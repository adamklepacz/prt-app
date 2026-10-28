import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { createTimerState, remainingSeconds, TimerMode, timerReducer, TimerState } from '../domain/timerMachine';
import { haptics } from '../services/haptics';
import { playBell, preloadBell } from '../services/sound';
import { cancelTimerEndNotification, scheduleTimerEndNotification } from '../services/timerNotifications';
import { useTrackingStore, useTrackingStoreHydrated } from '../store/trackingStore';

const TICK_MS = 250;
/** Koniec odnotowany później (aplikacja była w tle) – wtedy dzwonił już system, nie dublujemy. */
const LIVE_FINISH_TOLERANCE_MS = 3000;

export interface UseTimerOptions {
  durationSeconds: number;
  mode?: TimerMode;
  autoStart?: boolean;
  /** Dzwonek misy na koniec (Somatic Tracking). Reset przy biurku kończy się samą haptyką. */
  bell?: boolean;
  /**
   * Zapisuj sesję w pamięci trwałej i przywracaj ją po ponownym uruchomieniu.
   * iOS zamyka uśpione aplikacje w tle – bez tego dłuższa obserwacja przy zablokowanym telefonie przepadała.
   */
  persist?: boolean;
}

export function useTimer({
  durationSeconds,
  mode = 'standard',
  autoStart = false,
  bell = false,
  persist = false,
}: UseTimerOptions) {
  const [state, dispatch] = useReducer(timerReducer, { durationSeconds, mode }, createTimerState);
  const hydrated = useTrackingStoreHydrated();
  const setActiveTimer = useTrackingStore((s) => s.setActiveTimer);
  const [restoreDone, setRestoreDone] = useState(!persist);
  const restoredRef = useRef(false);
  const hapticsEnabled = useTrackingStore((s) => s.settings.hapticsEnabled);
  const bellEnabled = useTrackingStore((s) => s.settings.bellEnabled !== false);
  const withBell = bell && bellEnabled;

  useEffect(() => {
    if (withBell) preloadBell();
  }, [withBell]);

  const prevStatus = useRef<TimerState['status']>(state.status);
  const notificationRef = useRef<Promise<string | null> | null>(null);

  const cancelNotification = useCallback(() => {
    const pending = notificationRef.current ?? Promise.resolve(null);
    notificationRef.current = null;
    pending.then(() => cancelTimerEndNotification(mode));
  }, [mode]);

  // Przywrócenie zapisanej sesji – dopiero po wczytaniu danych z AsyncStorage.
  useEffect(() => {
    if (!persist || !hydrated || restoreDone) return;
    const saved = useTrackingStore.getState().activeTimer;
    if (saved && saved.mode === mode && saved.status !== 'idle') {
      restoredRef.current = true;
      dispatch({ type: 'RESTORE', state: saved, now: Date.now() });
    }
    setRestoreDone(true);
  }, [persist, hydrated, restoreDone, mode]);

  // Zapis przy każdej zmianie stanu (nie przy każdym ticku – czas liczymy z timestampów).
  useEffect(() => {
    if (!persist || !hydrated || !restoreDone) return;
    setActiveTimer(state.status === 'idle' ? null : state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist, hydrated, restoreDone, state.status, state.startedAt, state.accumulatedMs, state.durationSeconds]);

  // Tykanie – czas liczony z timestampów, więc interwał może być rzadki i nieregularny.
  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), TICK_MS);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') dispatch({ type: 'TICK', now: Date.now() });
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [state.status]);

  // Efekty uboczne przejść stanów: haptyka i powiadomienie o końcu.
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = state.status;
    if (prev === state.status) return;

    const restored = restoredRef.current;
    restoredRef.current = false;

    if (state.status === 'running') {
      if (prev === 'idle' && hapticsEnabled && !restored) haptics.start();
      // Ten sam identyfikator → po przywróceniu po prostu zastępujemy wcześniej zaplanowane powiadomienie.
      notificationRef.current = scheduleTimerEndNotification(remainingSeconds(state), { bell: withBell, mode });
    }
    if (state.status === 'paused' || state.status === 'idle') cancelNotification();
    if (state.status === 'finished') {
      cancelNotification();
      const live = (state.lateByMs ?? 0) < LIVE_FINISH_TOLERANCE_MS;
      if (state.outcome === 'completed' && live) {
        if (hapticsEnabled) haptics.finished();
        if (withBell) playBell();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (autoStart) dispatch({ type: 'START', now: Date.now() });
    return cancelNotification;
  }, [autoStart, cancelNotification]);

  return {
    state,
    remaining: remainingSeconds(state),
    start: useCallback(() => dispatch({ type: 'START', now: Date.now() }), []),
    pause: useCallback(() => dispatch({ type: 'PAUSE', now: Date.now() }), []),
    resume: useCallback(() => dispatch({ type: 'RESUME', now: Date.now() }), []),
    stop: useCallback(() => dispatch({ type: 'STOP', now: Date.now() }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
    selectDuration: useCallback((seconds: number) => dispatch({ type: 'SELECT_DURATION', durationSeconds: seconds }), []),
  };
}
