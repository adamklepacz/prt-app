import { isValidTimeOfDay } from './dates';

/** iOS pozwala na 64 zaplanowane lokalne powiadomienia – 12 dziennych to bezpieczny zapas. */
export const MAX_REMINDERS = 12;

export type ReminderResult = { ok: true; times: string[] } | { ok: false; error: string };

const pad = (n: number) => String(n).padStart(2, '0');
const sorted = (times: string[]) => [...new Set(times)].sort();

export function dateToTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function timeToDate(time: string, base: Date = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m, 0, 0);
}

export function addReminder(times: string[], time: string): ReminderResult {
  if (!isValidTimeOfDay(time)) return { ok: false, error: 'Niepoprawna godzina.' };
  if (times.includes(time)) return { ok: false, error: `Przypomnienie o ${time} już istnieje.` };
  if (times.length >= MAX_REMINDERS) {
    return { ok: false, error: `Możesz ustawić maksymalnie ${MAX_REMINDERS} przypomnień.` };
  }
  return { ok: true, times: sorted([...times, time]) };
}

export function updateReminder(times: string[], previous: string, next: string): ReminderResult {
  if (!times.includes(previous)) return { ok: false, error: 'Nie znaleziono przypomnienia.' };
  if (!isValidTimeOfDay(next)) return { ok: false, error: 'Niepoprawna godzina.' };
  if (previous === next) return { ok: true, times: sorted(times) };
  if (times.includes(next)) return { ok: false, error: `Przypomnienie o ${next} już istnieje.` };
  return { ok: true, times: sorted(times.map((t) => (t === previous ? next : t))) };
}

export function removeReminder(times: string[], time: string): string[] {
  return times.filter((t) => t !== time);
}

/** Pierwsza wolna pełna godzina, zaczynając od 10:00. */
export function suggestNewReminderTime(times: string[]): string {
  for (let i = 0; i < 24; i += 1) {
    const candidate = `${pad((10 + i) % 24)}:00`;
    if (!times.includes(candidate)) return candidate;
  }
  return '10:00';
}
