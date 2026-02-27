import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAreas, useAvatarColors, useTeamEmojis } from '../../hooks/useConfig';
import type { MatchFormat } from '../../types/database';

const FORMATS: MatchFormat[] = ['5v5', '6v6', '7v7', '8v8', '11v11'];

export function CreateTeam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { groups, loading: areasLoading } = useAreas();
  const { colors, loading: colorsLoading } = useAvatarColors();
  const { emojis, loading: emojisLoading } = useTeamEmojis();

  const [name, setName] = useState('');
  const [format, setFormat] = useState<MatchFormat | ''>('');
  const [area, setArea] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fall back to first loaded value once available
  const activeEmoji = emoji || emojis[0] || '⚽';
  const activeColor = color || colors[0] || '#2E7D32';

  const fieldStyle = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };
  const labelStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500 as const, color: '#49454F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };

  const canSubmit = name && format && area && !areasLoading && !colorsLoading && !emojisLoading;

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const { data: teamId, error: rpcError } = await supabase.rpc('create_team_with_captain', {
      p_name: name,
      p_short_name: name.slice(0, 3).toUpperCase(),
      p_format: format,
      p_area: area,
      p_emoji: activeEmoji,
      p_color: activeColor,
      p_description: description,
    });
    setLoading(false);
    if (rpcError) { addToast(rpcError.message, 'error'); setError(rpcError.message); return; }
    navigate(`/app/teams/${teamId}`);
  };

  return (
    <div style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)', minHeight: '100vh' }}>
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8F5E9] transition-colors">
            <ArrowLeft size={22} color="#49454F" />
          </button>
          <h1 style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: 500, color: '#1C1B1F' }}>Create Team</h1>
          <div className="w-10" />
        </div>

        <div className="px-6 flex flex-col gap-6 pb-8">
          {/* Team avatar preview */}
          <div className="flex flex-col items-center gap-4">
            <motion.div whileTap={{ scale: 0.95 }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl"
              style={{ background: `linear-gradient(135deg, ${activeColor} 0%, ${activeColor}99 100%)` }}>
              <span style={{ fontSize: '48px' }}>{activeEmoji}</span>
            </motion.div>
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-2 justify-center">
              {emojisLoading
                ? <div className="h-10 w-48 rounded-xl bg-[#E8F5E9] animate-pulse" />
                : emojis.map(e => (
                  <button key={e} onClick={() => setEmoji(e)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: activeEmoji === e ? '#E8F5E9' : 'transparent', border: activeEmoji === e ? '2px solid #2E7D32' : '2px solid transparent', fontSize: '22px' }}>
                    {e}
                  </button>
                ))}
            </div>
            {/* Color picker */}
            <div className="flex gap-2">
              {colorsLoading
                ? <div className="h-7 w-40 rounded-full bg-[#E8F5E9] animate-pulse" />
                : colors.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, border: activeColor === c ? '2px solid white' : '2px solid transparent', boxShadow: activeColor === c ? `0 0 0 2px ${c}` : 'none' }} />
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span style={labelStyle}>Team Name</span>
            <input className={fieldStyle} style={fontStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pangrati Wolves" />
          </div>

          <div className="flex flex-col gap-2">
            <span style={labelStyle}>Format</span>
            <div className="flex gap-2 flex-wrap">
              {FORMATS.map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className="flex-1 h-[48px] rounded-2xl border-2 flex items-center justify-center transition-all"
                  style={{ borderColor: format === f ? '#2E7D32' : '#CAC4D0', background: format === f ? '#E8F5E9' : 'white', fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: format === f ? 700 : 400, color: format === f ? '#2E7D32' : '#49454F' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span style={labelStyle}>Area</span>
            <div className="relative">
              <select value={area} onChange={e => setArea(e.target.value)} disabled={areasLoading}
                className="w-full h-[56px] px-4 pr-10 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors appearance-none"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: area ? '#1C1B1F' : '#79747E' }}>
                <option value="" disabled>{areasLoading ? 'Loading...' : 'Select area...'}</option>
                {groups.map(({ city, areas: cityAreas }) => (
                  <optgroup key={city} label={city}>
                    {cityAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={18} color="#79747E" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span style={labelStyle}>Description (optional)</span>
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: description.length > 180 ? '#B3261E' : '#79747E' }}>{description.length}/200</span>
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 200))}
              placeholder="Tell opponents what your team is about..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors resize-none"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' }} />
          </div>

          {error && <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#B3261E' }}>{error}</p>}

          <button onClick={handleCreate} disabled={!canSubmit || loading}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: (!canSubmit || loading) ? 0.6 : 1 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {loading ? 'Creating...' : 'Create Team'}
            </span>
          </button>
        </div>
    </div>
  );
}
