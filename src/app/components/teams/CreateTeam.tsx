import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const FORMATS = ['5v5', '6v6', '7v7', '8v8', '11v11'];
const AREAS = ['Kolonaki', 'Exarcheia', 'Pangrati', 'Glyfada', 'Kifisia', 'Piraeus', 'Nea Smyrni', 'Chalandri', 'Other'];
const EMOJIS = ['⚽', '🦁', '🐉', '🦅', '🐺', '🔥', '⚡', '🌊', '🏹', '🦊', '🐯', '🦂'];
const COLORS = ['#2E7D32', '#1565C0', '#6A1B9A', '#E65100', '#B71C1C', '#00695C', '#37474F', '#F57F17'];

export function CreateTeam() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [format, setFormat] = useState('');
  const [area, setArea] = useState('');
  const [emoji, setEmoji] = useState('⚽');
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fieldStyle = "w-full h-[56px] px-4 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors";
  const fontStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' };
  const labelStyle = { fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: 500 as const, color: '#49454F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };

  const canSubmit = name && format && area;

  const handleCreate = async () => {
    setLoading(true);
    // TODO: Supabase insert
    setTimeout(() => { setLoading(false); navigate('/app/teams'); }, 1000);
  };

  return (
    <div className="fixed inset-0 flex justify-center" style={{ background: 'linear-gradient(180deg, #E8F5E9 0%, #FFFBFE 40%)' }}>
      <div className="w-full max-w-[430px] flex flex-col overflow-y-auto">
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
              style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
              <span style={{ fontSize: '48px' }}>{emoji}</span>
            </motion.div>
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-2 justify-center">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: emoji === e ? '#E8F5E9' : 'transparent', border: emoji === e ? '2px solid #2E7D32' : '2px solid transparent', fontSize: '22px' }}>
                  {e}
                </button>
              ))}
            </div>
            {/* Color picker */}
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, border: color === c ? '2px solid white' : '2px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }} />
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
              <select value={area} onChange={e => setArea(e.target.value)}
                className="w-full h-[56px] px-4 pr-10 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors appearance-none"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: area ? '#1C1B1F' : '#79747E' }}>
                <option value="" disabled>Select area...</option>
                {AREAS.map(a => <option key={a} value={a}>{a}, Athens</option>)}
              </select>
              <ChevronDown size={18} color="#79747E" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span style={labelStyle}>Description (optional)</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Tell opponents what your team is about..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[#CAC4D0] bg-white outline-none focus:border-[#2E7D32] transition-colors resize-none"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#1C1B1F' }} />
          </div>

          <button onClick={handleCreate} disabled={!canSubmit || loading}
            className="w-full h-[52px] rounded-2xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)', boxShadow: '0 4px 12px rgba(46,125,50,0.35)', opacity: (!canSubmit || loading) ? 0.6 : 1 }}>
            <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: 500, color: 'white' }}>
              {loading ? 'Creating...' : 'Create Team'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
