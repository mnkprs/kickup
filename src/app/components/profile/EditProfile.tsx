import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadAvatar } from '../../lib/uploadAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAreas, useAvatarColors } from '../../hooks/useConfig';
import { PlayerAvatar } from '../ui/PlayerAvatar';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const FEET = [
  { value: 'right', label: 'Right' },
  { value: 'left',  label: 'Left'  },
  { value: 'both',  label: 'Both'  },
] as const;

export function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const { groups, loading: areasLoading } = useAreas();
  const { colors } = useAvatarColors();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const activeColor = avatarColor || profile?.avatar_color || '#2E7D32';

  const fieldStyle = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontStyle  = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };
  const labelStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500 as const, color: '#49454F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const { url, error } = await uploadAvatar(user.id, avatarFile);
        if (error) { addToast(error, 'error'); setSaving(false); return; }
        avatarUrl = url;
      }

      const initials = fullName.trim().split(' ')
        .map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

      const { error } = await supabase.from('profiles').update({
        full_name:      fullName.trim(),
        avatar_initials: initials,
        avatar_color:   activeColor,
        avatar_url:     avatarUrl,
        position:       position  || null,
        area:           area      || null,
        nationality:    nationality.trim() || null,
        date_of_birth:  dateOfBirth       || null,
        height:         height ? parseInt(height, 10) : null,
        preferred_foot: preferredFoot     || null,
        bio:            bio.trim(),
      }).eq('id', user.id);

      if (error) { addToast(error.message, 'error'); return; }
      await refreshProfile();
      addToast('Profile saved', 'success');
      navigate('/app/profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)', minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button onClick={() => navigate('/app/profile')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
          <ArrowLeft size={22} color="#49454F" />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#1C1B1F' }}>Edit Profile</h1>
        <button onClick={handleSave} disabled={saving || !fullName.trim()}
          className="px-4 h-9 rounded-2xl flex items-center transition-all active:scale-95"
          style={{ background: saving || !fullName.trim() ? '#CAC4D0' : 'linear-gradient(135deg, #2E7D32, #43A047)', color: 'white', fontSize: '14px', fontWeight: 500 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="px-6 flex flex-col gap-6 pb-12">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-full object-cover shadow-lg" />
            ) : (
              <PlayerAvatar initials={profile?.avatar_initials ?? '?'} color={activeColor} size={96} />
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow cursor-pointer"
              style={{ background: '#E8F5E9', border: '2px solid white' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>
          {/* Color picker */}
          <div className="flex gap-2">
            {colors.map(c => (
              <button key={c} onClick={() => setAvatarColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ background: c, border: activeColor === c ? '2px solid white' : '2px solid transparent', boxShadow: activeColor === c ? `0 0 0 2px ${c}` : 'none' }} />
            ))}
          </div>
        </div>

        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <span style={labelStyle}>Full Name</span>
          <input className={fieldStyle} style={fontStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Nikos Papadopoulos" />
        </div>

        {/* Position */}
        <div className="flex flex-col gap-2">
          <span style={labelStyle}>Position</span>
          <div className="flex gap-3">
            {POSITIONS.map(pos => (
              <button key={pos} onClick={() => setPosition(position === pos ? '' : pos)}
                className="flex-1 h-[48px] rounded-2xl border-2 flex items-center justify-center transition-all"
                style={{ borderColor: position === pos ? '#2E7D32' : '#CAC4D0', background: position === pos ? '#E8F5E9' : 'white', fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: position === pos ? 700 : 400, color: position === pos ? '#2E7D32' : '#49454F' }}>
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Area */}
        <div className="flex flex-col gap-1">
          <span style={labelStyle}>Area / Neighbourhood</span>
          <div className="relative">
            <select value={area} onChange={e => setArea(e.target.value)} disabled={areasLoading}
              className="w-full h-[56px] px-4 pr-10 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors appearance-none"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: area ? '#1C1B1F' : '#79747E' }}>
              <option value="">{areasLoading ? 'Loading…' : 'Select area…'}</option>
              {groups.map(({ city, areas: cityAreas }) => (
                <optgroup key={city} label={city}>
                  {cityAreas.map(a => <option key={a} value={a}>{a}</option>)}
                </optgroup>
              ))}
            </select>
            <ChevronDown size={18} color="#79747E" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Height + Preferred Foot */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <span style={labelStyle}>Height (cm)</span>
            <input className={fieldStyle} style={fontStyle} type="number" min="100" max="230"
              value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 178" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span style={labelStyle}>Preferred Foot</span>
            <div className="flex gap-2 h-[56px] items-center">
              {FEET.map(({ value, label }) => (
                <button key={value} onClick={() => setPreferredFoot(preferredFoot === value ? '' : value)}
                  className="flex-1 h-full rounded-2xl border-2 flex items-center justify-center transition-all"
                  style={{ borderColor: preferredFoot === value ? '#2E7D32' : '#CAC4D0', background: preferredFoot === value ? '#E8F5E9' : 'white', fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: preferredFoot === value ? 700 : 400, color: preferredFoot === value ? '#2E7D32' : '#49454F' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nationality + DOB */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <span style={labelStyle}>Nationality</span>
            <input className={fieldStyle} style={fontStyle} value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. Greek" />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span style={labelStyle}>Date of Birth</span>
            <input className={fieldStyle} style={fontStyle} type="date" value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span style={labelStyle}>Bio (optional)</span>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: bio.length > 180 ? '#B3261E' : '#79747E' }}>{bio.length}/200</span>
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 200))}
            placeholder="Tell others about your playing style..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors resize-none"
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' }} />
        </div>
      </div>
    </div>
  );
}
