export function formatMatchDate(date: string | null, time: string | null): string {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const dateStr = `${day} ${month} ${year}`;
  if (!time) return dateStr;
  return `${dateStr} · ${time.slice(0, 5)}`;
}
