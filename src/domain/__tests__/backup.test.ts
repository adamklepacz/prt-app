import { parseBackup, validateBackup } from '../backup';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, BackupFile, DEFAULT_SETTINGS } from '../../types';

const validBackup = (): BackupFile => ({
  app: BACKUP_APP_ID,
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2026-10-27T11:00:00.000Z',
  settings: { ...DEFAULT_SETTINGS },
  sessions: [
    {
      id: 'a',
      createdAt: '2026-10-27T10:00:00.000Z',
      durationSeconds: 60,
      frustrationLevel: 'calm',
      isQuickReset: true,
    },
    {
      id: 'b',
      createdAt: '2026-10-26T10:00:00.000Z',
      durationSeconds: 300,
      frustrationLevel: 'frustrated',
      isQuickReset: false,
      targetArea: 'prostowniki',
      note: 'opór na początku',
      completed: false,
    },
  ],
});

describe('validateBackup – integralność pliku backupu', () => {
  it('akceptuje poprawny backup', () => {
    expect(validateBackup(validBackup())).toEqual([]);
  });

  it('akceptuje pustą historię', () => {
    expect(validateBackup({ ...validBackup(), sessions: [] })).toEqual([]);
  });

  it.each([null, undefined, 42, 'tekst', []])('odrzuca wartość, która nie jest obiektem: %p', (value) => {
    expect(validateBackup(value).length).toBeGreaterThan(0);
  });

  it('wymaga identyfikatora aplikacji i wersji schematu', () => {
    const { app, ...noApp } = validBackup();
    expect(validateBackup(noApp).join(' ')).toContain('app');
    expect(validateBackup({ ...validBackup(), schemaVersion: 2 }).join(' ')).toContain('schemaVersion');
  });

  it('wymaga tablicy sesji', () => {
    expect(validateBackup({ ...validBackup(), sessions: {} }).join(' ')).toContain('sessions');
  });

  it.each<[string, Record<string, unknown>]>([
    ['brak id', { id: '' }],
    ['zła data', { createdAt: 'wczoraj' }],
    ['ujemny czas', { durationSeconds: -1 }],
    ['ułamkowy czas', { durationSeconds: 1.5 }],
    ['zbyt długi czas (> 4h)', { durationSeconds: 4 * 3600 + 1 }],
    ['nieznany poziom reakcji', { frustrationLevel: 'ból 8/10' }],
    ['isQuickReset nie-bool', { isQuickReset: 'tak' }],
    ['targetArea nie-string', { targetArea: 5 }],
    ['completed nie-bool', { completed: 1 }],
    ['notatka nie-string', { note: ['x'] }],
  ])('odrzuca sesję: %s', (_label, patch) => {
    const backup = validBackup();
    const sessions = [backup.sessions[0], { ...backup.sessions[1], ...patch }];
    const errors = validateBackup({ ...backup, sessions });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('sessions[1]');
  });

  it('odrzuca zduplikowane id sesji', () => {
    const backup = validBackup();
    backup.sessions[1].id = 'a';
    expect(validateBackup(backup).join(' ')).toContain('duplikat');
  });

  it('waliduje ustawienia', () => {
    const base = validBackup();
    expect(validateBackup({ ...base, settings: { ...base.settings, hapticsEnabled: 'tak' } }).length).toBeGreaterThan(
      0,
    );
    expect(
      validateBackup({ ...base, settings: { ...base.settings, reminderTimes: ['10:00', '7:5'] } }).join(' '),
    ).toContain('reminderTimes');
  });
});

describe('validateBackup – nowe, opcjonalne ustawienia', () => {
  it('akceptuje backup bez nowych pól (zgodność ze starszymi plikami)', () => {
    const base = validBackup();
    const { bellEnabled, customTrackingMinutes, ...oldSettings } = base.settings;
    expect(validateBackup({ ...base, settings: oldSettings })).toEqual([]);
  });

  it('waliduje własny czas obserwacji i dzwonek', () => {
    const base = validBackup();
    expect(validateBackup({ ...base, settings: { ...base.settings, customTrackingMinutes: 7 } })).toEqual([]);
    expect(validateBackup({ ...base, settings: { ...base.settings, customTrackingMinutes: 0 } }).join(' ')).toContain(
      'customTrackingMinutes',
    );
    expect(validateBackup({ ...base, settings: { ...base.settings, customTrackingMinutes: 7.5 } }).length).toBeGreaterThan(0);
    expect(validateBackup({ ...base, settings: { ...base.settings, bellEnabled: 'tak' } }).join(' ')).toContain('bellEnabled');
  });

  it('parseBackup uzupełnia brakujący dzwonek wartością domyślną (włączony)', () => {
    const base = validBackup();
    const { bellEnabled, ...oldSettings } = base.settings;
    const result = parseBackup({ ...base, settings: oldSettings });
    expect(result.ok && result.backup.settings.bellEnabled).toBe(true);
  });
});

describe('parseBackup', () => {
  it('parsuje string JSON do znormalizowanego backupu', () => {
    const result = parseBackup(JSON.stringify(validBackup()));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.sessions).toHaveLength(2);
      // sesje posortowane od najnowszej
      expect(result.backup.sessions[0].id).toBe('a');
    }
  });

  it('zwraca błąd czytelny dla człowieka przy uszkodzonym JSON', () => {
    const result = parseBackup('{"app": ');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/JSON/);
    }
  });

  it('usuwa nieznane pola z sesji (nie przenosi śmieci do stanu)', () => {
    const backup = validBackup() as unknown as { sessions: Record<string, unknown>[] };
    backup.sessions[0].hack = '<script>';
    const result = parseBackup(backup);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.backup.sessions[0])).not.toContain('hack');
    }
  });
});
