const PL_DAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'] as const;
const PL_MONTH_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** Klucz dnia w czasie lokalnym: YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayLabel(date: Date): string {
  return PL_DAY_SHORT[date.getDay()];
}

/**
 * Ostatnie `count` dni kalendarzowych zakończone dniem `reference` (włącznie).
 * Arytmetyka na dacie kalendarzowej, więc zmiana czasu (DST) nie przesuwa dni.
 */
export function lastNDays(reference: Date, count: number): Date[] {
  const days: Date[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - i));
  }
  return days;
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 10) return false;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** "27 października, 14:05" */
export function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${PL_MONTH_GENITIVE[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 75 -> "01:15" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** 42 -> "42 s", 180 -> "3 min", 200 -> "3 min 20 s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest === 0 ? `${m} min` : `${m} min ${rest} s`;
}

export const TIME_OF_DAY_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeOfDay(value: unknown): value is string {
  return typeof value === 'string' && TIME_OF_DAY_RE.test(value);
}
