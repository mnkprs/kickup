import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Trophy } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAreas } from '../../hooks/useConfig';
import { supabase } from '../../lib/supabase';

const FORMATS = ['5v5', '6v6', '7v7', '8v8', '11v11'];

export function CreateTournament() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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

  const bg = isDark ? '#1C1B1F' : '#FFFBFE';
  const cardBg = isDark ? '#2D2C31' : 'white';
  const textPrimary = isDark ? '#E6E1E5' : '#1C1B1F';
  const textSecondary = isDark ? '#CAC4D0' : '#49454F';
  const borderColor = isDark ? '#49454F' : '#E7E0EC';
  const inputBg = isDark ? '#3A3940' : '#F7F2FA';

  const allAreas = groups.flatMap(g => g.areas);

  // Gate: only field owners
  if (!profile?.is_field_owner) {
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

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-1">
        <label style={{ fontSize: '13px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
        {children}
      </div>
    );
  }

  function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[52px] px-4 rounded-2xl outline-none border"
        style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }}
      />
    );
  }

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
        <Field label="Tournament Name *">
          <TextInput value={name} onChange={setName} placeholder="e.g. Summer Cup 2026" />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell teams about this tournament..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl outline-none border resize-none"
            style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }}
          />
        </Field>

        <Field label="Venue">
          <TextInput value={venue} onChange={setVenue} placeholder="e.g. Stade Municipal" />
        </Field>

        <Field label="Area *">
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="w-full h-[52px] px-4 rounded-2xl outline-none border appearance-none"
            style={{ background: inputBg, borderColor, color: area ? textPrimary : textSecondary, fontSize: '15px', fontFamily: 'Roboto, sans-serif' }}
          >
            <option value="" disabled>Select area…</option>
            {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>

        <Field label="Match Format">
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
        </Field>

        <div className="flex gap-4">
          <Field label="Max Teams">
            <select
              value={maxTeams}
              onChange={e => setMaxTeams(Number(e.target.value))}
              className="h-[52px] px-4 rounded-2xl outline-none border appearance-none"
              style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', minWidth: '120px', fontFamily: 'Roboto, sans-serif' }}
            >
              {[4, 8, 12, 16, 24, 32].map(n => <option key={n} value={n}>{n} teams</option>)}
            </select>
          </Field>
          <Field label="Teams per Group">
            <select
              value={teamsPerGroup}
              onChange={e => setTeamsPerGroup(Number(e.target.value))}
              className="h-[52px] px-4 rounded-2xl outline-none border appearance-none"
              style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', minWidth: '120px', fontFamily: 'Roboto, sans-serif' }}
            >
              {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} per group</option>)}
            </select>
          </Field>
        </div>

        <div className="flex gap-4">
          <Field label="Start Date">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-[52px] px-4 rounded-2xl outline-none border"
              style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif', minWidth: '150px' }}
            />
          </Field>
          <Field label="End Date">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-[52px] px-4 rounded-2xl outline-none border"
              style={{ background: inputBg, borderColor, color: textPrimary, fontSize: '15px', fontFamily: 'Roboto, sans-serif', minWidth: '150px' }}
            />
          </Field>
        </div>

        <Field label="Prize / Reward">
          <TextInput value={prize} onChange={setPrize} placeholder="e.g. Trophy + 5,000 DA" />
        </Field>

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
