import { DURATION_PRESETS_SECONDS } from './timerMachine';

export const MIN_CUSTOM_MINUTES = 1;
export const MAX_CUSTOM_MINUTES = 120;

export type CustomMinutesResult = { ok: true; minutes: number } | { ok: false; error: string };

const ERROR = `Podaj liczbę minut od ${MIN_CUSTOM_MINUTES} do ${MAX_CUSTOM_MINUTES}.`;

/** Tylko pełne minuty (bez godzin, ułamków, dwukropków). */
export function parseCustomMinutes(text: string): CustomMinutesResult {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: ERROR };
  const minutes = Number(trimmed);
  if (minutes < MIN_CUSTOM_MINUTES || minutes > MAX_CUSTOM_MINUTES) return { ok: false, error: ERROR };
  return { ok: true, minutes };
}

export function isValidCustomMinutes(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= MIN_CUSTOM_MINUTES && value <= MAX_CUSTOM_MINUTES
  );
}

export function isPresetDuration(seconds: number): boolean {
  return (DURATION_PRESETS_SECONDS as readonly number[]).includes(seconds);
}
