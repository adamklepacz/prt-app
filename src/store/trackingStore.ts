import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, StateCreator } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createBackup, parseBackup } from '../domain/backup';
import { isValidTimeOfDay } from '../domain/dates';
import { isValidCustomMinutes } from '../domain/durations';
import {
  computeTotals,
  computeWeeklyStats,
  filterSessions,
  isValidDuration,
  normalizeNote,
  sortNewestFirst,
} from '../domain/sessions';
import {
  AppSettings,
  BackupFile,
  DEFAULT_SETTINGS,
  FRUSTRATION_LEVELS,
  ImportMode,
  ImportResult,
  NewSessionInput,
  SessionFilter,
  TrackingSession,
  WeeklyStats,
} from '../types';

export interface TrackingState {
  sessions: TrackingSession[];
  settings: AppSettings;

  addSession: (input: NewSessionInput) => TrackingSession;
  removeSession: (id: string) => void;
  clearAll: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;

  getWeeklyStats: (reference?: Date) => WeeklyStats;
  getTotals: () => { sessions: number; seconds: number; quickResets: number };
  getFilteredSessions: (filter: SessionFilter) => TrackingSession[];

  exportBackup: () => BackupFile;
  importBackup: (input: unknown, mode?: ImportMode) => ImportResult;
}

export interface TrackingStoreDeps {
  now?: () => Date;
  generateId?: () => string;
  /** false w testach – bez AsyncStorage i hydracji. */
  persist?: boolean;
  storageKey?: string;
}

export const STORAGE_KEY = 'somatic-tracking-v1';

const defaultId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function normalizeReminderTimes(times: string[]): string[] {
  if (!Array.isArray(times) || !times.every(isValidTimeOfDay)) {
    throw new Error('Godziny przypomnień muszą mieć format HH:MM.');
  }
  return [...new Set(times)].sort();
}

export function createTrackingStore(deps: TrackingStoreDeps = {}) {
  const now = deps.now ?? (() => new Date());
  const generateId = deps.generateId ?? defaultId;

  const creator: StateCreator<TrackingState> = (set, get) => ({
    sessions: [],
    settings: { ...DEFAULT_SETTINGS, reminderTimes: [...DEFAULT_SETTINGS.reminderTimes] },

    addSession: (input) => {
      if (!isValidDuration(input.durationSeconds)) {
        throw new Error('Czas trwania sesji musi być dodatnią liczbą całkowitą sekund.');
      }
      if (!FRUSTRATION_LEVELS.includes(input.frustrationLevel)) {
        throw new Error('Nieznany poziom reakcji.');
      }
      const session: TrackingSession = {
        id: generateId(),
        createdAt: input.createdAt ?? now().toISOString(),
        durationSeconds: input.durationSeconds,
        frustrationLevel: input.frustrationLevel,
        isQuickReset: input.isQuickReset,
        completed: input.completed ?? true,
      };
      if (input.targetArea) session.targetArea = input.targetArea;
      const note = normalizeNote(input.note);
      if (note) session.note = note;

      set((state) => ({ sessions: sortNewestFirst([session, ...state.sessions]) }));
      return session;
    },

    removeSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),

    clearAll: () => set({ sessions: [] }),

    updateSettings: (patch) => {
      const next: AppSettings = { ...get().settings, ...patch };
      if (patch.reminderTimes) next.reminderTimes = normalizeReminderTimes(patch.reminderTimes);
      if (patch.customTrackingMinutes !== undefined && !isValidCustomMinutes(patch.customTrackingMinutes)) {
        throw new Error('Własny czas obserwacji musi mieć od 1 do 120 minut.');
      }
      set({ settings: next });
    },

    getWeeklyStats: (reference) => computeWeeklyStats(get().sessions, reference ?? now()),

    getTotals: () => computeTotals(get().sessions),

    getFilteredSessions: (filter) => filterSessions(get().sessions, filter),

    exportBackup: () => createBackup(get().sessions, get().settings, now()),

    importBackup: (input, mode = 'replace') => {
      const parsed = parseBackup(input);
      if (!parsed.ok) return parsed;

      const { sessions, settings } = parsed.backup;
      if (mode === 'replace') {
        set({ sessions, settings });
        return { ok: true, imported: sessions.length, total: sessions.length };
      }

      const existing = new Set(get().sessions.map((s) => s.id));
      const fresh = sessions.filter((s) => !existing.has(s.id));
      const merged = sortNewestFirst([...get().sessions, ...fresh]);
      set({ sessions: merged });
      return { ok: true, imported: fresh.length, total: merged.length };
    },
  });

  if (deps.persist === false) {
    return create<TrackingState>()(creator);
  }

  return create<TrackingState>()(
    persist(creator, {
      name: deps.storageKey ?? STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ sessions: state.sessions, settings: state.settings }),
      // Nowe pola ustawień (np. bellEnabled) dostają wartości domyślne przy danych z poprzednich wersji.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Pick<TrackingState, 'sessions' | 'settings'>>;
        return {
          ...current,
          ...saved,
          settings: { ...current.settings, ...(saved.settings ?? {}) },
        };
      },
    }),
  );
}

/** Globalny store aplikacji (persistowany w AsyncStorage, 100% offline). */
export const useTrackingStore = createTrackingStore();

/** Wywołuje callback, gdy dane z AsyncStorage są już wczytane (od razu, jeśli już są). */
export function onTrackingStoreHydrated(callback: () => void): () => void {
  const api = (useTrackingStore as unknown as {
    persist?: { hasHydrated: () => boolean; onFinishHydration: (cb: () => void) => () => void };
  }).persist;
  if (!api || api.hasHydrated()) {
    callback();
    return () => undefined;
  }
  return api.onFinishHydration(callback);
}
