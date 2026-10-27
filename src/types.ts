export type FrustrationLevel = 'calm' | 'impatient' | 'frustrated';

export const FRUSTRATION_LEVELS: readonly FrustrationLevel[] = ['calm', 'impatient', 'frustrated'];

export const TARGET_AREAS = ['łopatka', 'szyja', 'prostowniki', 'pośladek', 'inne'] as const;
export type TargetArea = (typeof TARGET_AREAS)[number];

export interface TrackingSession {
  id: string;
  createdAt: string; // ISO 8601
  durationSeconds: number; // faktycznie przeobserwowany czas, np. 60, 180, 300
  targetArea?: string; // np. "łopatka", "szyja", "prostowniki", "pośladek", "inne"
  frustrationLevel: FrustrationLevel; // poziom reakcji emocjonalnej (nie ocena bólu!)
  isQuickReset: boolean; // czy uruchomione z szybkiego resetu / widgetu
  note?: string;
  /** false = sesja przerwana przed czasem. Brak pola = ukończona (zgodność wsteczna). */
  completed?: boolean;
}

export interface AppSettings {
  remindersEnabled: boolean;
  reminderTimes: string[]; // np. ["10:00", "14:00", "17:00"]
  hapticsEnabled: boolean;
  /** Dzwonek misy na koniec obserwacji (Somatic Tracking). */
  bellEnabled: boolean;
  /** Ostatnio ustawiony własny czas obserwacji w minutach (pigułka „···”). */
  customTrackingMinutes?: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: false,
  reminderTimes: ['10:00', '14:00', '17:00'],
  hapticsEnabled: true,
  bellEnabled: true,
};

/** Dane potrzebne do zapisania sesji – id i createdAt nadaje store. */
export type NewSessionInput = Omit<TrackingSession, 'id' | 'createdAt'> & { createdAt?: string };

export interface SessionFilter {
  frustrationLevel?: FrustrationLevel;
  targetArea?: string;
  isQuickReset?: boolean;
  completed?: boolean;
}

export interface DayStats {
  dateKey: string; // YYYY-MM-DD (czas lokalny)
  label: string; // skrót dnia tygodnia po polsku
  total: number;
  calm: number;
  impatient: number;
  frustrated: number;
  seconds: number;
}

export interface WeeklyStats {
  days: DayStats[]; // dokładnie 7, od najstarszego do dzisiaj
  totalSessions: number;
  totalSeconds: number;
  calmShare: number; // 0..1 – udział sesji w spokojnej obserwacji w tym tygodniu
  maxDailyTotal: number;
}

export const BACKUP_APP_ID = 'prt-app';
export const BACKUP_SCHEMA_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  sessions: TrackingSession[];
  settings: AppSettings;
}

export type ImportMode = 'replace' | 'merge';

export type ImportResult =
  | { ok: true; imported: number; total: number }
  | { ok: false; errors: string[] };
