import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAreas, useAvatarColors } from '../../hooks/useConfig';
import { PlayerAvatar } from '../ui/PlayerAvatar';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const FEET = [
  { value: 'right', label: 'Right' },
  { value: 'left',  label: 'Left'  },
  { value: 'both',  label: 'Both'  },
] as const;

export function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, needsOnboarding } = useAuth();
  const { groups, loading: areasLoading } = useAreas();
  const { colors } = useAvatarColors();

  const googleName = user?.user_metadata?.full_name ?? profile?.full_name ?? '';
  const googleAvatar = profile?.avatar_url ?? null;

  const [fullName,      setFullName]      = useState(googleName);
  const [position,      setPosition]      = useState(profile?.position ?? '');
  const [area,          setArea]          = useState('');
  const [nationality,   setNationality]   = useState(profile?.nationality ?? '');
  const [dateOfBirth,   setDateOfBirth]   = useState(profile?.date_of_birth ?? '');
  const [height,        setHeight]        = useState(profile?.height?.toString() ?? '');
  const [preferredFoot, setPreferredFoot] = useState(profile?.preferred_foot ?? '');
  const [avatarColor,   setAvatarColor]   = useState(profile?.avatar_color ?? colors[0] ?? '#2E7D32');
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');

  if (!needsOnboarding && !saving) {
    navigate('/app', { replace: true });
    return null;
  }

  const activeColor = avatarColor || colors[0] || '#2E7D32';
  const initials = fullName.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const fieldStyle = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontStyle  = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };
  const labelStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500 as const, color: '#49454F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
  const optLabelStyle = { ...labelStyle, color: '#79747E' };

  // position + area are required; optional fields can be empty
  const canSubmit = !!fullName.trim() && !!position && !!area && !areasLoading;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);
    setError('');

    const profileInitials = fullName.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const { error: updateError } = await supabase.from('profiles').update({
      full_name:       fullName.trim(),
      avatar_initials: profileInitials,
      avatar_color:    activeColor,
      position,
      area,
      nationality:     nationality.trim() || null,
      date_of_birth:   dateOfBirth        || null,
      height:          height ? parseInt(height, 10) : null,
      preferred_foot:  preferredFoot      || null,
    }).eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    navigate('/app', { replace: true });
  };

  return (
    <div className="fixed inset-0 flex justify-center" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)' }}>
      <div className="w-full max-w-[430px] flex flex-col overflow-y-auto">
        <div className="px-6 pt-12 pb-6">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '26px', fontWeight: 700, color: '#1C1B1F' }}>
              What position do you play? 🏃
            </h1>
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '15px', color: '#49454F', marginTop: '6px' }}>
              Two quick picks and you're on the pitch.
            </p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="px-6 flex flex-col gap-6 pb-12">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            {googleAvatar ? (
              <img src={googleAvatar} alt="avatar" className="w-20 h-20 rounded-full object-cover shadow-md" />
            ) : (
              <PlayerAvatar initials={initials} color={activeColor} size={80} />
            )}
            {!googleAvatar ? (
              <div className="flex gap-2">
                {colors.map(c => (
                  <button key={c} onClick={() => setAvatarColor(c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, border: activeColor === c ? '2px solid white' : '2px solid transparent', boxShadow: activeColor === c ? `0 0 0 2px ${c}` : 'none' }} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <span style={labelStyle}>Full Name</span>
            <input className={fieldStyle} style={fontStyle} value={fullName}
              onChange={e => setFullName(e.target.value)} placeholder="e.g. Nikos Papadopoulos" />
          </div>

          {/* Position — required */}
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

          {/* Area — required */}
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

          {/* ── Optional divider ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#E7E0EC' }} />
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: '#79747E', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Optional · add later
            </span>
            <div className="flex-1 h-px" style={{ background: '#E7E0EC' }} />
          </div>

          {/* Nationality + DOB */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <span style={optLabelStyle}>Nationality</span>
              <input className={fieldStyle} style={{ ...fontStyle, color: '#79747E' }} value={nationality}
                onChange={e => setNationality(e.target.value)} placeholder="e.g. Greek" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span style={optLabelStyle}>Date of Birth</span>
              <input className={fieldStyle} style={{ ...fontStyle, color: '#79747E' }} type="date" value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Height + Preferred Foot */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <span style={optLabelStyle}>Height (cm)</span>
              <input className={fieldStyle} style={{ ...fontStyle, color: '#79747E' }} type="number" min="100" max="230"
                value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 178" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span style={optLabelStyle}>Preferred Foot</span>
              <div className="flex gap-2 h-[56px] items-center">
                {FEET.map(({ value, label }) => (
                  <button key={value} onClick={() => setPreferredFoot(preferredFoot === value ? '' : value)}
                    className="flex-1 h-full rounded-2xl border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: preferredFoot === value ? '#2E7D32' : '#E7E0EC', background: preferredFoot === value ? '#E8F5E9' : 'white', fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: preferredFoot === value ? 700 : 400, color: preferredFoot === value ? '#2E7D32' : '#79747E' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#B3261E' }}>{error}</p> : null}

          {/* Skip optional fields */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: canSubmit ? '#49454F' : '#CAC4D0', textDecoration: 'underline', background: 'none', border: 'none', cursor: canSubmit ? 'pointer' : 'default', textAlign: 'center' as const }}>
            Skip optional info for now
          </button>

          {/* Primary CTA */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: canSubmit && !saving ? 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)' : '#CAC4D0', boxShadow: canSubmit ? '0 4px 12px rgba(46,125,50,0.35)' : 'none' }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {saving ? 'Saving…' : "Let's play ⚽"}
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
