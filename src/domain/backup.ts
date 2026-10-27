import { isValidIsoDate, isValidTimeOfDay } from './dates';
import { isValidCustomMinutes, MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES } from './durations';
import { isValidDuration, MAX_NOTE_LENGTH, sortNewestFirst } from './sessions';
import {
  AppSettings,
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  BackupFile,
  FRUSTRATION_LEVELS,
  TrackingSession,
} from '../types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord => typeof v === 'object' && v !== null && !Array.isArray(v);

function validateSession(value: unknown, path: string): string[] {
  if (!isRecord(value)) return [`${path}: sesja musi być obiektem`];
  const errors: string[] = [];

  if (typeof value.id !== 'string' || value.id.trim() === '') errors.push(`${path}.id: wymagany niepusty tekst`);
  if (!isValidIsoDate(value.createdAt)) errors.push(`${path}.createdAt: wymagana data ISO 8601`);
  if (!isValidDuration(value.durationSeconds)) {
    errors.push(`${path}.durationSeconds: wymagana liczba całkowita sekund z zakresu 1–14400`);
  }
  if (!FRUSTRATION_LEVELS.includes(value.frustrationLevel as never)) {
    errors.push(`${path}.frustrationLevel: dozwolone wartości to ${FRUSTRATION_LEVELS.join(', ')}`);
  }
  if (typeof value.isQuickReset !== 'boolean') errors.push(`${path}.isQuickReset: wymagana wartość logiczna`);
  if (value.targetArea !== undefined && (typeof value.targetArea !== 'string' || value.targetArea.length > 60)) {
    errors.push(`${path}.targetArea: opcjonalny tekst (maks. 60 znaków)`);
  }
  if (value.note !== undefined && (typeof value.note !== 'string' || value.note.length > MAX_NOTE_LENGTH)) {
    errors.push(`${path}.note: opcjonalny tekst (maks. ${MAX_NOTE_LENGTH} znaków)`);
  }
  if (value.completed !== undefined && typeof value.completed !== 'boolean') {
    errors.push(`${path}.completed: opcjonalna wartość logiczna`);
  }
  return errors;
}

function validateSettings(value: unknown): string[] {
  if (!isRecord(value)) return ['settings: wymagany obiekt ustawień'];
  const errors: string[] = [];
  if (typeof value.remindersEnabled !== 'boolean') errors.push('settings.remindersEnabled: wymagana wartość logiczna');
  if (typeof value.hapticsEnabled !== 'boolean') errors.push('settings.hapticsEnabled: wymagana wartość logiczna');
  if (!Array.isArray(value.reminderTimes) || !value.reminderTimes.every(isValidTimeOfDay)) {
    errors.push('settings.reminderTimes: wymagana lista godzin w formacie HH:MM');
  }
  if (value.bellEnabled !== undefined && typeof value.bellEnabled !== 'boolean') {
    errors.push('settings.bellEnabled: opcjonalna wartość logiczna');
  }
  if (value.customTrackingMinutes !== undefined && !isValidCustomMinutes(value.customTrackingMinutes)) {
    errors.push(
      `settings.customTrackingMinutes: opcjonalna liczba całkowita ${MIN_CUSTOM_MINUTES}–${MAX_CUSTOM_MINUTES}`,
    );
  }
  return errors;
}

/** Zwraca listę błędów (pusta = backup poprawny). */
export function validateBackup(value: unknown): string[] {
  if (!isRecord(value)) return ['Plik nie zawiera obiektu backupu.'];
  const errors: string[] = [];

  if (value.app !== BACKUP_APP_ID) errors.push(`app: oczekiwano "${BACKUP_APP_ID}" – to nie jest backup tej aplikacji`);
  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    errors.push(`schemaVersion: obsługiwana wersja to ${BACKUP_SCHEMA_VERSION}`);
  }
  if (value.exportedAt !== undefined && !isValidIsoDate(value.exportedAt)) {
    errors.push('exportedAt: wymagana data ISO 8601');
  }

  if (!Array.isArray(value.sessions)) {
    errors.push('sessions: wymagana tablica sesji');
  } else {
    const seen = new Set<string>();
    value.sessions.forEach((session, index) => {
      const path = `sessions[${index}]`;
      errors.push(...validateSession(session, path));
      if (isRecord(session) && typeof session.id === 'string') {
        if (seen.has(session.id)) errors.push(`${path}.id: duplikat id "${session.id}"`);
        seen.add(session.id);
      }
    });
  }

  errors.push(...validateSettings(value.settings));
  return errors;
}

function pickSession(raw: UnknownRecord): TrackingSession {
  const session: TrackingSession = {
    id: raw.id as string,
    createdAt: raw.createdAt as string,
    durationSeconds: raw.durationSeconds as number,
    frustrationLevel: raw.frustrationLevel as TrackingSession['frustrationLevel'],
    isQuickReset: raw.isQuickReset as boolean,
  };
  if (typeof raw.targetArea === 'string') session.targetArea = raw.targetArea;
  if (typeof raw.note === 'string') session.note = raw.note;
  if (typeof raw.completed === 'boolean') session.completed = raw.completed;
  return session;
}

function pickSettings(raw: UnknownRecord): AppSettings {
  const settings: AppSettings = {
    remindersEnabled: raw.remindersEnabled as boolean,
    hapticsEnabled: raw.hapticsEnabled as boolean,
    reminderTimes: [...new Set(raw.reminderTimes as string[])].sort(),
    bellEnabled: typeof raw.bellEnabled === 'boolean' ? raw.bellEnabled : true,
  };
  if (isValidCustomMinutes(raw.customTrackingMinutes)) settings.customTrackingMinutes = raw.customTrackingMinutes;
  return settings;
}

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; errors: string[] };

/** Przyjmuje string JSON albo obiekt; zwraca znormalizowany backup (tylko znane pola). */
export function parseBackup(input: unknown): ParseResult {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch {
      return { ok: false, errors: ['Plik nie jest poprawnym JSON.'] };
    }
  }

  const errors = validateBackup(value);
  if (errors.length > 0) return { ok: false, errors };

  const record = value as UnknownRecord;
  return {
    ok: true,
    backup: {
      app: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: (record.exportedAt as string | undefined) ?? new Date(0).toISOString(),
      sessions: sortNewestFirst((record.sessions as UnknownRecord[]).map(pickSession)),
      settings: pickSettings(record.settings as UnknownRecord),
    },
  };
}

export function createBackup(sessions: TrackingSession[], settings: AppSettings, now: Date): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    sessions: sessions.map((s) => ({ ...s })),
    settings: { ...settings, reminderTimes: [...settings.reminderTimes] },
  };
}

export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `somatic-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
