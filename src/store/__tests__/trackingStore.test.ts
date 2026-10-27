import { createTrackingStore } from '../trackingStore';
import { BACKUP_APP_ID, BACKUP_SCHEMA_VERSION, DEFAULT_SETTINGS, NewSessionInput } from '../../types';

// Wtorek 27.10.2026, 12:00 czasu lokalnego. Tydzień obejmuje zmianę czasu (25.10).
const NOW = new Date(2026, 9, 27, 12, 0, 0);

function makeStore(now: Date = NOW) {
  let counter = 0;
  let current = now;
  const store = createTrackingStore({
    now: () => current,
    generateId: () => `id-${++counter}`,
    persist: false,
  });
  return {
    store,
    setNow: (d: Date) => {
      current = d;
    },
  };
}

const timerSession: NewSessionInput = {
  durationSeconds: 180,
  frustrationLevel: 'calm',
  targetArea: 'szyja',
  isQuickReset: false,
};

const quickResetSession: NewSessionInput = {
  durationSeconds: 60,
  frustrationLevel: 'impatient',
  isQuickReset: true,
};

/** Lokalna data N dni przed NOW o wskazanej godzinie. */
const daysAgo = (n: number, hour = 10) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - n, hour, 0, 0);

describe('trackingStore – stan początkowy', () => {
  it('startuje bez sesji i z domyślnymi ustawieniami', () => {
    const { store } = makeStore();
    expect(store.getState().sessions).toEqual([]);
    expect(store.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('trackingStore – dodawanie sesji', () => {
  it('dodaje sesję z poziomu standardowego timera', () => {
    const { store } = makeStore();
    const saved = store.getState().addSession(timerSession);

    expect(saved).toEqual({
      id: 'id-1',
      createdAt: NOW.toISOString(),
      durationSeconds: 180,
      frustrationLevel: 'calm',
      targetArea: 'szyja',
      isQuickReset: false,
      completed: true,
    });
    expect(store.getState().sessions).toHaveLength(1);
    expect(store.getState().sessions[0]).toEqual(saved);
  });

  it('dodaje sesję z szybkiego resetu (widget / deep link)', () => {
    const { store } = makeStore();
    const saved = store.getState().addSession(quickResetSession);

    expect(saved.isQuickReset).toBe(true);
    expect(saved.durationSeconds).toBe(60);
    expect(saved.targetArea).toBeUndefined();
  });

  it('rejestruje sesję przerwaną przed czasem', () => {
    const { store } = makeStore();
    const saved = store.getState().addSession({ ...timerSession, durationSeconds: 42, completed: false });

    expect(saved.completed).toBe(false);
    expect(saved.durationSeconds).toBe(42);
  });

  it('trzyma sesje od najnowszej', () => {
    const { store, setNow } = makeStore();
    store.getState().addSession(timerSession);
    setNow(new Date(NOW.getTime() + 60_000));
    store.getState().addSession(quickResetSession);

    expect(store.getState().sessions.map((s) => s.id)).toEqual(['id-2', 'id-1']);
  });

  it('przycina notatkę i pomija pustą', () => {
    const { store } = makeStore();
    const a = store.getState().addSession({ ...timerSession, note: '  ciepło w łopatce  ' });
    const b = store.getState().addSession({ ...timerSession, note: '   ' });

    expect(a.note).toBe('ciepło w łopatce');
    expect(b.note).toBeUndefined();
  });

  it('odrzuca sesję o niepoprawnym czasie trwania', () => {
    const { store } = makeStore();
    expect(() => store.getState().addSession({ ...timerSession, durationSeconds: 0 })).toThrow();
    expect(() => store.getState().addSession({ ...timerSession, durationSeconds: -5 })).toThrow();
    expect(store.getState().sessions).toHaveLength(0);
  });

  it('usuwa sesję po id', () => {
    const { store } = makeStore();
    store.getState().addSession(timerSession);
    store.getState().addSession(quickResetSession);
    store.getState().removeSession('id-1');

    expect(store.getState().sessions.map((s) => s.id)).toEqual(['id-2']);
  });
});

describe('trackingStore – statystyki tygodniowe', () => {
  it('zwraca dokładnie 7 dni zakończonych dzisiaj, z polskimi etykietami', () => {
    const { store } = makeStore();
    const stats = store.getState().getWeeklyStats();

    expect(stats.days).toHaveLength(7);
    expect(stats.days.map((d) => d.dateKey)).toEqual([
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
    ]);
    expect(stats.days.map((d) => d.label)).toEqual(['Śr', 'Cz', 'Pt', 'Sb', 'Nd', 'Pn', 'Wt']);
  });

  it('segmentuje sesje dnia wg poziomu reakcji i sumuje czas', () => {
    const { store, setNow } = makeStore();
    setNow(daysAgo(0, 8));
    store.getState().addSession({ ...timerSession, frustrationLevel: 'calm', durationSeconds: 300 });
    setNow(daysAgo(0, 9));
    store.getState().addSession({ ...timerSession, frustrationLevel: 'frustrated', durationSeconds: 60 });
    setNow(daysAgo(2, 9));
    store.getState().addSession({ ...timerSession, frustrationLevel: 'impatient', durationSeconds: 180 });
    setNow(NOW);

    const stats = store.getState().getWeeklyStats();
    const today = stats.days[6];
    const twoDaysAgo = stats.days[4];

    expect(today).toMatchObject({ total: 2, calm: 1, impatient: 0, frustrated: 1, seconds: 360 });
    expect(twoDaysAgo).toMatchObject({ total: 1, calm: 0, impatient: 1, frustrated: 0, seconds: 180 });
    expect(stats.totalSessions).toBe(3);
    expect(stats.totalSeconds).toBe(540);
    expect(stats.maxDailyTotal).toBe(2);
    expect(stats.calmShare).toBeCloseTo(1 / 3);
  });

  it('pomija sesje starsze niż 7 dni oraz z przyszłości', () => {
    const { store, setNow } = makeStore();
    setNow(daysAgo(7));
    store.getState().addSession(timerSession);
    setNow(daysAgo(-1));
    store.getState().addSession(timerSession);
    setNow(daysAgo(6, 0));
    store.getState().addSession(timerSession);
    setNow(NOW);

    const stats = store.getState().getWeeklyStats();
    expect(stats.totalSessions).toBe(1);
    expect(stats.days[0].total).toBe(1);
  });

  it('dla pustej historii zwraca zera (bez dzielenia przez zero)', () => {
    const { store } = makeStore();
    const stats = store.getState().getWeeklyStats();

    expect(stats.totalSessions).toBe(0);
    expect(stats.totalSeconds).toBe(0);
    expect(stats.calmShare).toBe(0);
    expect(stats.maxDailyTotal).toBe(0);
  });

  it('zwraca łączne podsumowanie całej historii', () => {
    const { store, setNow } = makeStore();
    setNow(daysAgo(30));
    store.getState().addSession({ ...timerSession, durationSeconds: 600 });
    setNow(NOW);
    store.getState().addSession({ ...quickResetSession });

    expect(store.getState().getTotals()).toEqual({ sessions: 2, seconds: 660, quickResets: 1 });
  });
});

describe('trackingStore – filtrowanie historii', () => {
  function seeded() {
    const ctx = makeStore();
    const add = (minutesAgo: number, input: NewSessionInput) => {
      ctx.setNow(new Date(NOW.getTime() - minutesAgo * 60_000));
      ctx.store.getState().addSession(input);
    };
    add(40, { ...timerSession, frustrationLevel: 'calm', targetArea: 'szyja' }); // id-1
    add(30, { ...timerSession, frustrationLevel: 'frustrated', targetArea: 'łopatka' }); // id-2
    add(20, { ...quickResetSession, frustrationLevel: 'calm' }); // id-3
    add(10, { ...timerSession, frustrationLevel: 'impatient', targetArea: 'szyja', completed: false }); // id-4
    ctx.setNow(NOW);
    return ctx.store;
  }

  it('pusty filtr zwraca całą historię od najnowszej', () => {
    const store = seeded();
    expect(store.getState().getFilteredSessions({}).map((s) => s.id)).toEqual(['id-4', 'id-3', 'id-2', 'id-1']);
  });

  it('filtruje po stanie emocjonalnym', () => {
    const store = seeded();
    expect(store.getState().getFilteredSessions({ frustrationLevel: 'calm' }).map((s) => s.id)).toEqual([
      'id-3',
      'id-1',
    ]);
  });

  it('filtruje po obszarze ciała', () => {
    const store = seeded();
    expect(store.getState().getFilteredSessions({ targetArea: 'szyja' }).map((s) => s.id)).toEqual(['id-4', 'id-1']);
  });

  it('filtruje szybkie resety i sesje przerwane', () => {
    const store = seeded();
    expect(store.getState().getFilteredSessions({ isQuickReset: true }).map((s) => s.id)).toEqual(['id-3']);
    expect(store.getState().getFilteredSessions({ completed: false }).map((s) => s.id)).toEqual(['id-4']);
  });

  it('łączy kryteria', () => {
    const store = seeded();
    expect(
      store.getState().getFilteredSessions({ frustrationLevel: 'calm', isQuickReset: false }).map((s) => s.id),
    ).toEqual(['id-1']);
  });
});

describe('trackingStore – ustawienia', () => {
  it('aktualizuje ustawienia częściowo', () => {
    const { store } = makeStore();
    store.getState().updateSettings({ hapticsEnabled: false });

    expect(store.getState().settings).toEqual({ ...DEFAULT_SETTINGS, hapticsEnabled: false });
  });

  it('normalizuje godziny przypomnień: sortuje, usuwa duplikaty', () => {
    const { store } = makeStore();
    store.getState().updateSettings({ reminderTimes: ['17:00', '09:30', '17:00'] });

    expect(store.getState().settings.reminderTimes).toEqual(['09:30', '17:00']);
  });

  it('odrzuca niepoprawny format godziny', () => {
    const { store } = makeStore();
    expect(() => store.getState().updateSettings({ reminderTimes: ['25:00'] })).toThrow();
    expect(store.getState().settings.reminderTimes).toEqual(DEFAULT_SETTINGS.reminderTimes);
  });
});

describe('trackingStore – eksport i import JSON', () => {
  function withData() {
    const ctx = makeStore();
    ctx.store.getState().addSession(timerSession);
    ctx.store.getState().addSession({ ...quickResetSession, note: 'po spotkaniu' });
    ctx.store.getState().updateSettings({ remindersEnabled: true });
    return ctx.store;
  }

  it('eksportuje kompletny, wersjonowany obiekt backupu', () => {
    const store = withData();
    const backup = store.getState().exportBackup();

    expect(backup.app).toBe(BACKUP_APP_ID);
    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(backup.exportedAt).toBe(NOW.toISOString());
    expect(backup.sessions).toHaveLength(2);
    expect(backup.settings.remindersEnabled).toBe(true);
    expect(JSON.parse(JSON.stringify(backup))).toEqual(backup);
  });

  it('importuje backup (string JSON) i zastępuje stan', () => {
    const source = withData();
    const json = JSON.stringify(source.getState().exportBackup());

    const { store: target } = makeStore();
    target.getState().addSession({ ...timerSession, frustrationLevel: 'frustrated' });
    const result = target.getState().importBackup(json);

    expect(result).toEqual({ ok: true, imported: 2, total: 2 });
    expect(target.getState().sessions).toEqual(source.getState().sessions);
    expect(target.getState().settings).toEqual(source.getState().settings);
  });

  it('w trybie merge dokleja nowe sesje i pomija istniejące id', () => {
    const source = withData();
    const backup = source.getState().exportBackup();

    const { store: target, setNow } = makeStore();
    setNow(new Date(NOW.getTime() - 3_600_000));
    target.getState().addSession(timerSession); // id-1 – koliduje z backupem
    target.getState().addSession(timerSession); // id-2 – koliduje z backupem
    target.getState().addSession(timerSession); // id-3 – unikalna
    setNow(NOW);

    const result = target.getState().importBackup(backup, 'merge');

    expect(result).toEqual({ ok: true, imported: 0, total: 3 });
    expect(target.getState().sessions).toHaveLength(3);
  });

  it('odrzuca niepoprawny JSON i nie zmienia stanu', () => {
    const store = withData();
    const before = store.getState().sessions;
    const result = store.getState().importBackup('{ to nie jest json');

    expect(result.ok).toBe(false);
    expect(store.getState().sessions).toBe(before);
  });

  it('odrzuca plik z innej aplikacji lub w nieznanej wersji schematu', () => {
    const store = withData();
    const backup = store.getState().exportBackup();

    expect(store.getState().importBackup({ ...backup, app: 'inna-apka' }).ok).toBe(false);
    expect(store.getState().importBackup({ ...backup, schemaVersion: 99 }).ok).toBe(false);
  });

  it('odrzuca backup z uszkodzoną sesją i wskazuje jej indeks', () => {
    const store = withData();
    const backup = store.getState().exportBackup();
    const broken = {
      ...backup,
      sessions: [backup.sessions[0], { ...backup.sessions[1], frustrationLevel: 'panika' }],
    };
    const result = store.getState().importBackup(broken);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toContain('sessions[1]');
    }
    expect(store.getState().sessions).toHaveLength(2);
  });
});
