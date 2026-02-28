import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { useAreas } from '../../hooks/useConfig';
import { supabase } from '../../lib/supabase';

const FORMATS = ['5v5', '6v6', '7v7', '8v8', '11v11'];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

export function CreateTournament() {
  const { isDark, bg, cardBg, textPrimary, textSecondary, borderColor } = useThemeColors();
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();
  const { groups } = useAreas();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [area, setArea] = useState('');
  const [format, setFormat] = useState('5v5');
  const [maxTeams, setMaxTeams] = useState(8);
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [prize, setPrize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const inputBg = isDark ? '#3A3940' : '#F7F2FA';

  const inputStyle: React.CSSProperties = {
    background: inputBg, borderColor, color: textPrimary,
    fontSize: '15px', fontFamily: 'Roboto, sans-serif',
  };

  const allAreas = groups.flatMap(g => g.areas);

  if (!profile?.is_field_owner && !isAdmin) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: textSecondary }}>Only field owners can create tournaments.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!area) { setError('Area is required'); return; }
    if (!user) return;

    setSaving(true);
    setError('');

    const { data, error: err } = await supabase.from('tournaments').insert({
      name: name.trim(),
      description: description.trim(),
      venue: venue.trim(),
      area,
      match_format: format,
      max_teams: maxTeams,
      teams_per_group: teamsPerGroup,
      start_date: startDate || null,
      end_date: endDate || null,
      prize: prize.trim(),
      organizer_id: user.id,
    }).select().single();

    setSaving(false);

    if (err) { setError(err.message); return; }
    navigate(`/app/tournaments/${data.id}/manage`, { replace: true });
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: 'Roboto, sans-serif' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: cardBg }}>
          <ChevronLeft size={24} color={textPrimary} />
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: textPrimary }}>Create Tournament</h1>
      </div>

      {/* Icon banner */}
      <div className="mx-4 mb-6 rounded-2xl flex items-center gap-4 p-4" style={{ background: '#F3E5F5' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#E1BEE7' }}>
          <Trophy size={28} color="#6A1B9A" />
        </div>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: '#6A1B9A' }}>New Tournament</p>
          <p style={{ fontSize: '13px', color: '#AB47BC' }}>Fill in the details below</p>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5 pb-32">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label style={{ ...LABEL_STYLE, color: textSecondary }}>Tournament Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Summer Cup 2026"
            className="w-full h-[52px] px-4 rounded-2xl outline-none border"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label style={{ ...LABEL_STYLE, color: textSecondary }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell teams about this tournament..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl outline-none border resize-none"
            style={inputStyle}
          />
        </div>

        {/* Venue */}
        <div className="flex flex-col gap-1">
          <label style={{ ...LABEL_STYLE, color: textSecondary }}>Venue</label>
          <input
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="e.g. Stade Municipal"
            className="w-full h-[52px] px-4 rounded-2xl outline-none border"
            style={inputStyle}
          />
        </div>

        {/* Area */}
        <div className="flex flex-col gap-1">
          <label style={{ ...LABEL_STYLE, color: textSecondary }}>Area *</label>
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="w-full h-[52px] px-4 rounded-2xl outline-none border appearance-none"
            style={{ ...inputStyle, color: area ? textPrimary : textSecondary }}
          >
            <option value="" disabled>Select area…</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Match Format */}
        <div className="flex flex-col gap-2">
          <label style={{ ...LABEL_STYLE, color: textSecondary }}>Match Format</label>
          <div className="flex gap-2 flex-wrap">
            {FORMATS.map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="px-4 py-2 rounded-2xl border"
                style={{
                  borderColor: format === f ? '#6A1B9A' : borderColor,
                  background: format === f ? '#F3E5F5' : cardBg,
                  color: format === f ? '#6A1B9A' : textSecondary,
                  fontSize: '14px',
                  fontWeight: format === f ? 700 : 400,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Max Teams + Teams per Group */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label style={{ ...LABEL_STYLE, color: textSecondary }}>Max Teams</label>
            <select
              value={maxTeams}
              onChange={e => setMaxTeams(Number(e.target.value))}
              className="h-[52px] px-4 rounded-2xl outline-none border appearance-none"
              style={{ ...inputStyle, minWidth: '120px' }}
            >
              {[4, 8, 12, 16, 24, 32].map(n => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ ...LABEL_STYLE, color: textSecondary }}>Teams per Group</label>
            <select
              value={teamsPerGroup}
              onChange={e => setTeamsPerGroup(Number(e.target.value))}
              className="h-[52px] px-4 rounded-2xl outline-none border appearance-none"
              style={{ ...inputStyle, minWidth: '120px' }}
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} per group</option>)}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label style={{ ...LABEL_STYLE, color: textSecondary }}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-[52px] px-4 rounded-2xl outline-none border"
              style={{ ...inputStyle, minWidth: '150px' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ ...LABEL_STYLE, color: textSecondary }}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-[52px] px-4 rounded-2xl outline-none border"
              style={{ ...inputStyle, minWidth: '150px' }}
            />
          </div>
        </div>

        {/* Prize */}
        <div className="flex flex-col gap-1">
          <label style={{ ...LABEL_STYLE, color: textSecondary }}>Prize / Reward</label>
          <input
            value={prize}
            onChange={e => setPrize(e.target.value)}
            placeholder="e.g. Trophy + 5,000 DA"
            className="w-full h-[52px] px-4 rounded-2xl outline-none border"
            style={inputStyle}
          />
        </div>

        {error && (
          <p className="px-4 py-3 rounded-2xl" style={{ background: '#FFEBEE', color: '#B3261E', fontSize: '14px' }}>{error}</p>
        )}
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-[88px] left-0 right-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-[430px] px-4 pointer-events-auto">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-[56px] rounded-2xl flex items-center justify-center gap-2 shadow-xl"
            style={{ background: '#6A1B9A', color: 'white', fontSize: '16px', fontWeight: 500, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trophy size={20} color="white" />
                Create Tournament
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
