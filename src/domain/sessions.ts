import { dayLabel, lastNDays, toDateKey } from './dates';
import { DayStats, SessionFilter, TrackingSession, WeeklyStats } from '../types';

export const MAX_SESSION_SECONDS = 4 * 3600;
export const MAX_NOTE_LENGTH = 2000;

export function sortNewestFirst(sessions: TrackingSession[]): TrackingSession[] {
  return [...sessions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function isValidDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_SESSION_SECONDS;
}

export function normalizeNote(note: string | undefined): string | undefined {
  if (typeof note !== 'string') return undefined;
  const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function filterSessions(sessions: TrackingSession[], filter: SessionFilter): TrackingSession[] {
  return sessions.filter((s) => {
    if (filter.frustrationLevel !== undefined && s.frustrationLevel !== filter.frustrationLevel) return false;
    if (filter.targetArea !== undefined && s.targetArea !== filter.targetArea) return false;
    if (filter.isQuickReset !== undefined && s.isQuickReset !== filter.isQuickReset) return false;
    if (filter.completed !== undefined && (s.completed ?? true) !== filter.completed) return false;
    return true;
  });
}

export function computeWeeklyStats(sessions: TrackingSession[], reference: Date): WeeklyStats {
  const days: DayStats[] = lastNDays(reference, 7).map((date) => ({
    dateKey: toDateKey(date),
    label: dayLabel(date),
    total: 0,
    calm: 0,
    impatient: 0,
    frustrated: 0,
    seconds: 0,
  }));
  const byKey = new Map(days.map((d) => [d.dateKey, d]));

  for (const session of sessions) {
    const day = byKey.get(toDateKey(new Date(session.createdAt)));
    if (!day) continue;
    day.total += 1;
    day[session.frustrationLevel] += 1;
    day.seconds += session.durationSeconds;
  }

  const totalSessions = days.reduce((sum, d) => sum + d.total, 0);
  const totalSeconds = days.reduce((sum, d) => sum + d.seconds, 0);
  const calm = days.reduce((sum, d) => sum + d.calm, 0);

  return {
    days,
    totalSessions,
    totalSeconds,
    calmShare: totalSessions === 0 ? 0 : calm / totalSessions,
    maxDailyTotal: days.reduce((max, d) => Math.max(max, d.total), 0),
  };
}

export function computeTotals(sessions: TrackingSession[]) {
  return {
    sessions: sessions.length,
    seconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
    quickResets: sessions.filter((s) => s.isQuickReset).length,
  };
}
