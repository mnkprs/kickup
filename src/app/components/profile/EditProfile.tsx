import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ChevronDown, ChevronRight, Eye, EyeOff, LogOut, Mail, Trash2, User, Lock, Palette, Building2, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadAvatar } from '../../lib/uploadAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAreas, useAvatarColors } from '../../hooks/useConfig';
import { PlayerAvatar } from '../ui/PlayerAvatar';
import type { OwnerApplication } from '../../types/database';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const FEET = [
  { value: 'right', label: 'Right' },
  { value: 'left',  label: 'Left'  },
  { value: 'both',  label: 'Both'  },
] as const;

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@kickup.app';

type Section = 'player' | 'security' | 'appearance' | 'field-owner' | 'account';

const slideIn  = { x: '100%', opacity: 0 };
const slideOut = { x: '-30%', opacity: 0 };
const center   = { x: 0, opacity: 1 };

export function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { groups, loading: areasLoading } = useAreas();
  const { colors } = useAvatarColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<Section | null>(null);

  // ── Player Info fields ──────────────────────────────────────────────────────
  const [fullName,      setFullName]      = useState(profile?.full_name      ?? '');
  const [position,      setPosition]      = useState(profile?.position        ?? '');
  const [area,          setArea]          = useState(profile?.area            ?? '');
  const [nationality,   setNationality]   = useState(profile?.nationality     ?? '');
  const [dateOfBirth,   setDateOfBirth]   = useState(profile?.date_of_birth   ?? '');
  const [height,        setHeight]        = useState(profile?.height?.toString() ?? '');
  const [preferredFoot, setPreferredFoot] = useState<string>(profile?.preferred_foot ?? '');
  const [bio,           setBio]           = useState(profile?.bio             ?? '');
  const [avatarColor,   setAvatarColor]   = useState(profile?.avatar_color    ?? '#2E7D32');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [saving,        setSaving]        = useState(false);

  // ── Account & Security ──────────────────────────────────────────────────────
  const [email,           setEmail]           = useState(user?.email ?? '');
  const [emailSaving,     setEmailSaving]     = useState(false);
  const isEmailAuth = user?.app_metadata?.provider === 'email' || !user?.app_metadata?.provider;
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw,       setShowNewPw]       = useState(false);
  const [showConfirmPw,   setShowConfirmPw]   = useState(false);
  const [pwSaving,        setPwSaving]        = useState(false);

  // ── Field Owner ─────────────────────────────────────────────────────────────
  const [application,   setApplication]   = useState<OwnerApplication | null | undefined>(undefined);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMessage,  setApplyMessage]  = useState('');
  const [applyLoading,  setApplyLoading]  = useState(false);

  // ── Danger Zone ─────────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('owner_applications').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setApplication(data ?? null));
  }, [user]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const activeColor = avatarColor || profile?.avatar_color || '#2E7D32';

  const surfaceBg     = isDark ? '#1C1B1F' : '#F7F2FA';
  const cardBg        = isDark ? '#2D2C31' : 'white';
  const cardBorder    = isDark ? '#49454F' : '#E7E0EC';
  const textPrimary   = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#938F99' : '#79747E';

  const inputCls = `w-full h-[56px] px-4 rounded-2xl border-2 outline-none transition-colors font-[Roboto,sans-serif] text-base ${
    isDark
      ? 'border-[#49454F] bg-[#2D2C31] text-white focus:border-[#66BB6A]'
      : 'border-[#CAC4D0] bg-white text-[#1C1B1F] focus:border-[#2E7D32]'
  }`;
  const labelStyle = {
    fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500 as const,
    color: textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSavePlayer = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const { url, error } = await uploadAvatar(user.id, avatarFile);
        if (error) { addToast(error, 'error'); return; }
        avatarUrl = url;
      }
      const initials = fullName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(), avatar_initials: initials, avatar_color: activeColor,
        avatar_url: avatarUrl, position: position || null, area: area || null,
        nationality: nationality.trim() || null, date_of_birth: dateOfBirth || null,
        height: height ? parseInt(height, 10) : null, preferred_foot: preferredFoot || null,
        bio: bio.trim(),
      }).eq('id', user.id);
      if (error) { addToast(error.message, 'error'); return; }
      await refreshProfile();
      addToast('Profile saved', 'success');
      setSection(null);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email.trim() || email.trim() === user?.email) return;
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setEmailSaving(false);
    if (error) { addToast(error.message, 'error'); return; }
    addToast(`Confirmation sent to ${email.trim()}`, 'info');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { addToast('Password must be at least 8 characters', 'error'); return; }
    if (newPassword !== confirmPassword) { addToast('Passwords do not match', 'error'); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (error) { addToast(error.message, 'error'); return; }
    addToast('Password updated', 'success');
    setNewPassword(''); setConfirmPassword('');
  };

  const handleApplySubmit = async () => {
    if (!user || !profile) return;
    setApplyLoading(true);
    const { data } = await supabase.from('owner_applications')
      .insert({ user_id: user.id, message: applyMessage.trim() }).select().single();
    if (data) {
      setApplication(data as OwnerApplication);
      setShowApplyForm(false);
      const subject = encodeURIComponent(`Field Owner Application – ${profile.full_name}`);
      const body = encodeURIComponent(`Name: ${profile.full_name}\nUser ID: ${user.id}\nEmail: ${user.email ?? 'N/A'}\nArea: ${profile.area ?? 'N/A'}\n\nMessage:\n${applyMessage.trim() || '(none)'}`);
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
    }
    setApplyLoading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const handleDeleteRequest = () => {
    const subject = encodeURIComponent('Account Deletion Request');
    const body = encodeURIComponent(`Please delete my account.\n\nUser ID: ${user?.id ?? 'N/A'}\nEmail: ${user?.email ?? 'N/A'}`);
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
    setShowDeleteConfirm(false);
  };

  // ── Hub summary helpers ───────────────────────────────────────────────────
  const playerSummary = [position, nationality, height ? `${height}cm` : null]
    .filter(Boolean).join(' · ') || 'Name, position, bio…';
  const fieldOwnerSummary = profile?.is_field_owner
    ? 'Active — Field Owner'
    : application?.status === 'pending' ? 'Application under review'
    : application?.status === 'rejected' ? 'Application not approved'
    : 'Apply to manage tournaments';

  // ── Sub-screen header ─────────────────────────────────────────────────────
  const SubHeader = ({ title, onSave, saving: isSaving, canSave = true }: {
    title: string; onSave?: () => void; saving?: boolean; canSave?: boolean;
  }) => (
    <div className="flex items-center justify-between px-4 pt-12 pb-5 shrink-0">
      <button onClick={() => setSection(null)}
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: isDark ? '#2D2C31' : '#E8F5E9' }}>
        <ArrowLeft size={20} color={isDark ? '#E6E1E5' : '#49454F'} />
      </button>
      <h1 style={{ fontSize: '18px', fontWeight: 500, color: textPrimary }}>{title}</h1>
      {onSave ? (
        <button onClick={onSave} disabled={isSaving || !canSave}
          className="px-4 h-9 rounded-2xl transition-all active:scale-95"
          style={{ background: isSaving || !canSave ? (isDark ? '#49454F' : '#CAC4D0') : 'linear-gradient(135deg, #2E7D32, #43A047)', color: 'white', fontSize: '14px', fontWeight: 500 }}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      ) : <div className="w-10" />}
    </div>
  );

  // ── Shared field wrapper ──────────────────────────────────────────────────
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: surfaceBg, fontFamily: 'Roboto, sans-serif' }}>
      <AnimatePresence mode="wait" initial={false}>

        {/* ── HUB ──────────────────────────────────────────────────────────── */}
        {section === null && (
          <motion.div key="hub" className="absolute inset-0 overflow-y-auto"
            initial={slideOut} animate={center} exit={slideOut}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-12 pb-6">
              <button onClick={() => navigate('/app/profile')}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: isDark ? '#2D2C31' : '#E8F5E9' }}>
                <ArrowLeft size={20} color={isDark ? '#E6E1E5' : '#49454F'} />
              </button>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: textPrimary }}>Settings</h1>
            </div>

            {/* Avatar preview */}
            <div className="flex items-center gap-4 px-5 mb-7">
              <div className="relative">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
                  : <PlayerAvatar initials={profile?.avatar_initials ?? '?'} color={activeColor} size={64} />
                }
              </div>
              <div>
                <p style={{ fontSize: '17px', fontWeight: 600, color: textPrimary }}>{profile?.full_name ?? 'Player'}</p>
                <p style={{ fontSize: '13px', color: textSecondary }}>{user?.email}</p>
              </div>
            </div>

            {/* Section rows */}
            <div className="px-4 flex flex-col gap-2 pb-16">
              {([
                { key: 'player',       icon: User,       label: 'Player Info',        sub: playerSummary,             color: '#2E7D32', bg: '#E8F5E9' },
                { key: 'security',     icon: Lock,       label: 'Account & Security', sub: user?.email ?? '',         color: '#1565C0', bg: '#E3F2FD' },
                { key: 'appearance',   icon: Palette,    label: 'Appearance',         sub: isDark ? 'Dark mode' : 'Light mode', color: '#6A1B9A', bg: '#F3E5F5' },
                { key: 'field-owner',  icon: Building2,  label: 'Field Owner',        sub: fieldOwnerSummary,         color: '#E65100', bg: '#FFF3E0' },
                { key: 'account',      icon: Settings,   label: 'Account',            sub: 'Sign out, delete account',color: '#B3261E', bg: '#FFEBEE' },
              ] as const).map(({ key, icon: Icon, label, sub, color, bg }) => (
                <button key={key} onClick={() => setSection(key as Section)}
                  className="flex items-center gap-4 p-4 rounded-2xl w-full text-left"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{label}</p>
                    <p style={{ fontSize: '12px', color: textSecondary, marginTop: '1px' }} className="truncate">{sub}</p>
                  </div>
                  <ChevronRight size={18} color={textSecondary} />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── PLAYER INFO ──────────────────────────────────────────────────── */}
        {section === 'player' && (
          <motion.div key="player" className="absolute inset-0 overflow-y-auto"
            initial={slideIn} animate={center} exit={slideIn}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>

            <SubHeader title="Player Info" onSave={handleSavePlayer} saving={saving} canSave={!!fullName.trim()} />

            <div className="px-5 flex flex-col gap-5 pb-12">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4 py-1">
                <div className="relative w-24 h-24">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-full object-cover shadow-lg" />
                    : <PlayerAvatar initials={profile?.avatar_initials ?? '?'} color={activeColor} size={96} />
                  }
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow cursor-pointer"
                    style={{ background: '#E8F5E9', border: '2px solid white' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                  </label>
                </div>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button key={c} onClick={() => setAvatarColor(c)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ background: c, border: activeColor === c ? '2px solid white' : '2px solid transparent', boxShadow: activeColor === c ? `0 0 0 2px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>

              <Field label="Full Name">
                <input className={inputCls} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Nikos Papadopoulos" />
              </Field>

              <Field label="Position">
                <div className="flex gap-3">
                  {POSITIONS.map(pos => (
                    <button key={pos} onClick={() => setPosition(position === pos ? '' : pos)}
                      className="flex-1 h-[48px] rounded-2xl border-2 flex items-center justify-center transition-all"
                      style={{ borderColor: position === pos ? '#2E7D32' : cardBorder, background: position === pos ? '#E8F5E9' : cardBg, fontSize: '14px', fontWeight: position === pos ? 700 : 400, color: position === pos ? '#2E7D32' : textSecondary }}>
                      {pos}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Area / Neighbourhood">
                <div className="relative">
                  <select value={area} onChange={e => setArea(e.target.value)} disabled={areasLoading}
                    className={`${inputCls} pr-10 appearance-none`}
                    style={{ color: area ? textPrimary : textSecondary }}>
                    <option value="">{areasLoading ? 'Loading…' : 'Select area…'}</option>
                    {groups.map(({ city, areas: cityAreas }) => (
                      <optgroup key={city} label={city}>
                        {cityAreas.map(a => <option key={a} value={a}>{a}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={18} color={textSecondary} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </Field>

              <div className="flex gap-3">
                <Field label="Height (cm)">
                  <input className={inputCls} type="number" min="100" max="230" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 178" />
                </Field>
                <Field label="Preferred Foot">
                  <div className="flex gap-2 h-[56px] items-center">
                    {FEET.map(({ value, label }) => (
                      <button key={value} onClick={() => setPreferredFoot(preferredFoot === value ? '' : value)}
                        className="flex-1 h-full rounded-2xl border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: preferredFoot === value ? '#2E7D32' : cardBorder, background: preferredFoot === value ? '#E8F5E9' : cardBg, fontSize: '13px', fontWeight: preferredFoot === value ? 700 : 400, color: preferredFoot === value ? '#2E7D32' : textSecondary }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="flex gap-3">
                <Field label="Nationality">
                  <input className={inputCls} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Greek" />
                </Field>
                <Field label="Date of Birth">
                  <input className={inputCls} type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                </Field>
              </div>

              <Field label="Bio (optional)">
                <div className="flex justify-end mb-1">
                  <span style={{ fontSize: '11px', color: bio.length > 180 ? '#B3261E' : textSecondary }}>{bio.length}/200</span>
                </div>
                <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell others about your playing style…" rows={3}
                  className={`w-full px-4 py-3 rounded-2xl border-2 outline-none transition-colors resize-none ${isDark ? 'border-[#49454F] bg-[#2D2C31] text-white focus:border-[#66BB6A]' : 'border-[#CAC4D0] bg-white text-[#1C1B1F] focus:border-[#2E7D32]'}`}
                  style={{ fontSize: '16px' }} />
              </Field>
            </div>
          </motion.div>
        )}

        {/* ── ACCOUNT & SECURITY ───────────────────────────────────────────── */}
        {section === 'security' && (
          <motion.div key="security" className="absolute inset-0 overflow-y-auto"
            initial={slideIn} animate={center} exit={slideIn}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>

            <SubHeader title="Account & Security" />

            <div className="px-5 flex flex-col gap-5 pb-12">
              {/* Email */}
              <div className="flex flex-col gap-3 p-4 rounded-2xl border" style={{ background: cardBg, borderColor: cardBorder }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>Email Address</p>
                <div className="relative">
                  <Mail size={18} color={textSecondary} className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    className={`w-full h-[52px] pl-12 pr-4 rounded-xl border-2 outline-none transition-colors ${isDark ? 'border-[#49454F] bg-[#1C1B1F] text-white focus:border-[#66BB6A]' : 'border-[#CAC4D0] bg-[#F7F2FA] text-[#1C1B1F] focus:border-[#2E7D32]'}`}
                    style={{ fontSize: '15px' }} type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                {email.trim() !== (user?.email ?? '') && (
                  <p style={{ fontSize: '12px', color: '#1565C0' }}>✉️ A confirmation will be sent to this address</p>
                )}
                <button onClick={handleSaveEmail}
                  disabled={emailSaving || email.trim() === (user?.email ?? '')}
                  className="h-11 rounded-xl"
                  style={{ background: emailSaving || email.trim() === user?.email ? (isDark ? '#49454F' : '#CAC4D0') : '#1565C0', color: 'white', fontSize: '14px', fontWeight: 600 }}>
                  {emailSaving ? 'Sending…' : 'Update Email'}
                </button>
              </div>

              {/* Password */}
              {isEmailAuth ? (
                <div className="flex flex-col gap-3 p-4 rounded-2xl border" style={{ background: cardBg, borderColor: cardBorder }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>Change Password</p>
                  <div className="relative">
                    <input type={showNewPw ? 'text' : 'password'} placeholder="New password (min 8 chars)"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className={`w-full h-[52px] px-4 pr-12 rounded-xl border-2 outline-none transition-colors ${isDark ? 'border-[#49454F] bg-[#1C1B1F] text-white focus:border-[#66BB6A]' : 'border-[#CAC4D0] bg-[#F7F2FA] text-[#1C1B1F] focus:border-[#2E7D32]'}`}
                      style={{ fontSize: '15px' }} />
                    <button onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showNewPw ? <EyeOff size={18} color={textSecondary} /> : <Eye size={18} color={textSecondary} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showConfirmPw ? 'text' : 'password'} placeholder="Confirm new password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full h-[52px] px-4 pr-12 rounded-xl border-2 outline-none transition-colors ${isDark ? 'border-[#49454F] bg-[#1C1B1F] text-white focus:border-[#66BB6A]' : 'border-[#CAC4D0] bg-[#F7F2FA] text-[#1C1B1F] focus:border-[#2E7D32]'}`}
                      style={{ fontSize: '15px' }} />
                    <button onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showConfirmPw ? <EyeOff size={18} color={textSecondary} /> : <Eye size={18} color={textSecondary} />}
                    </button>
                  </div>
                  <button onClick={handleChangePassword}
                    disabled={pwSaving || !newPassword || !confirmPassword}
                    className="h-11 rounded-xl"
                    style={{ background: pwSaving || !newPassword || !confirmPassword ? (isDark ? '#49454F' : '#CAC4D0') : '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 600, opacity: pwSaving ? 0.7 : 1 }}>
                    {pwSaving ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor: cardBorder }}>
                  <span style={{ fontSize: '22px' }}>🔑</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Signed in with Google</p>
                    <p style={{ fontSize: '12px', color: textSecondary }}>Manage your password via Google account settings</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── APPEARANCE ───────────────────────────────────────────────────── */}
        {section === 'appearance' && (
          <motion.div key="appearance" className="absolute inset-0 overflow-y-auto"
            initial={slideIn} animate={center} exit={slideIn}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>

            <SubHeader title="Appearance" />

            <div className="px-5 flex flex-col gap-4 pb-12">
              <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ background: cardBg, borderColor: cardBorder }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>{isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}</p>
                  <p style={{ fontSize: '12px', color: textSecondary, marginTop: '2px' }}>Toggle app appearance</p>
                </div>
                <button onClick={toggleTheme}
                  className="w-12 h-6 rounded-full relative transition-colors"
                  style={{ background: isDark ? '#2E7D32' : '#E7E0EC' }}>
                  <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                    style={{ left: isDark ? 'calc(100% - 22px)' : '2px' }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FIELD OWNER ──────────────────────────────────────────────────── */}
        {section === 'field-owner' && (
          <motion.div key="field-owner" className="absolute inset-0 overflow-y-auto"
            initial={slideIn} animate={center} exit={slideIn}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>

            <SubHeader title="Field Owner" />

            <div className="px-5 flex flex-col gap-4 pb-12">
              {profile?.is_field_owner ? (
                <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor: cardBorder }}>
                  <span style={{ fontSize: '26px' }}>🏟️</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#2E7D32' }}>Field Owner</p>
                    <p style={{ fontSize: '12px', color: textSecondary }}>You have access to tournament management</p>
                  </div>
                </div>
              ) : application?.status === 'pending' ? (
                <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor: cardBorder }}>
                  <span style={{ fontSize: '26px' }}>⏳</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Application Under Review</p>
                    <p style={{ fontSize: '12px', color: textSecondary }}>We'll get back to you soon</p>
                  </div>
                </div>
              ) : application?.status === 'rejected' ? (
                <div className="p-4 rounded-2xl border flex items-center gap-3" style={{ background: cardBg, borderColor: cardBorder }}>
                  <span style={{ fontSize: '26px' }}>❌</span>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary }}>Application Not Approved</p>
                    <p style={{ fontSize: '12px', color: textSecondary }}>Contact us for more info</p>
                  </div>
                </div>
              ) : showApplyForm ? (
                <div className="p-4 rounded-2xl border flex flex-col gap-3" style={{ background: cardBg, borderColor: cardBorder }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: textPrimary }}>Apply as Field Owner</p>
                  <p style={{ fontSize: '13px', color: textSecondary }}>Tell us about your field (location, capacity, etc.)</p>
                  <textarea rows={4} value={applyMessage} onChange={e => setApplyMessage(e.target.value)}
                    placeholder="e.g. I own a 5v5 turf in Ampelokipoi, Athens…"
                    className={`w-full rounded-xl px-3 py-2.5 resize-none outline-none ${isDark ? 'bg-[#1C1B1F] border border-[#49454F] text-white' : 'bg-[#F7F2FA] border border-[#CAC4D0] text-[#1C1B1F]'}`}
                    style={{ fontSize: '14px' }} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowApplyForm(false)} className="flex-1 py-3 rounded-xl"
                      style={{ background: isDark ? '#49454F' : '#E7E0EC', color: textPrimary, fontSize: '14px', fontWeight: 500 }}>
                      Cancel
                    </button>
                    <button onClick={handleApplySubmit} disabled={applyLoading} className="flex-1 py-3 rounded-xl"
                      style={{ background: '#2E7D32', color: 'white', fontSize: '14px', fontWeight: 600, opacity: applyLoading ? 0.6 : 1 }}>
                      {applyLoading ? 'Sending…' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl border" style={{ background: cardBg, borderColor: cardBorder }}>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: textPrimary, marginBottom: '6px' }}>Own a football field?</p>
                    <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.5 }}>
                      Apply to become a verified Field Owner on Kickup. You'll be able to host and manage tournaments directly from the app.
                    </p>
                  </div>
                  <button onClick={() => setShowApplyForm(true)}
                    className="h-13 py-3.5 rounded-2xl w-full"
                    style={{ background: 'linear-gradient(135deg, #E65100, #F57C00)', color: 'white', fontSize: '15px', fontWeight: 600 }}>
                    Apply Now
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ACCOUNT ──────────────────────────────────────────────────────── */}
        {section === 'account' && (
          <motion.div key="account" className="absolute inset-0 overflow-y-auto"
            initial={slideIn} animate={center} exit={slideIn}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}>

            <SubHeader title="Account" />

            <div className="px-5 flex flex-col gap-3 pb-12">
              <button onClick={handleSignOut}
                className="flex items-center gap-4 p-4 rounded-2xl border w-full text-left"
                style={{ background: cardBg, borderColor: cardBorder }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFEBEE' }}>
                  <LogOut size={20} color="#B3261E" />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#B3261E' }}>Sign Out</p>
                  <p style={{ fontSize: '12px', color: textSecondary }}>You'll need to sign in again to use the app</p>
                </div>
              </button>

              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-4 p-4 rounded-2xl border w-full text-left"
                  style={{ background: cardBg, borderColor: isDark ? '#4D2020' : '#FFCDD2' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFEBEE' }}>
                    <Trash2 size={20} color="#B3261E" />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: isDark ? '#CF6679' : '#B3261E' }}>Delete Account</p>
                    <p style={{ fontSize: '12px', color: textSecondary }}>Permanently remove your data</p>
                  </div>
                </button>
              ) : (
                <div className="p-4 rounded-2xl border flex flex-col gap-3"
                  style={{ background: isDark ? '#2D1A1A' : '#FFF3F3', borderColor: isDark ? '#4D2020' : '#FFCDD2' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#B3261E' }}>Delete your account?</p>
                  <p style={{ fontSize: '13px', color: textSecondary, lineHeight: 1.5 }}>
                    This sends a deletion request to our team. Your data will be permanently removed within 7 days.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl"
                      style={{ background: isDark ? '#49454F' : '#E7E0EC', color: textPrimary, fontSize: '14px', fontWeight: 500 }}>
                      Cancel
                    </button>
                    <button onClick={handleDeleteRequest} className="flex-1 py-3 rounded-xl"
                      style={{ background: '#B3261E', color: 'white', fontSize: '14px', fontWeight: 600 }}>
                      Send Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
