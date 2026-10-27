import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';

import { createTimerState, remainingSeconds, TimerMode, timerReducer, TimerState } from '../domain/timerMachine';
import { haptics } from '../services/haptics';
import { cancelTimerEndNotification, scheduleTimerEndNotification } from '../services/timerNotifications';
import { useTrackingStore } from '../store/trackingStore';

const TICK_MS = 250;

export interface UseTimerOptions {
  durationSeconds: number;
  mode?: TimerMode;
  autoStart?: boolean;
}

export function useTimer({ durationSeconds, mode = 'standard', autoStart = false }: UseTimerOptions) {
  const [state, dispatch] = useReducer(timerReducer, { durationSeconds, mode }, createTimerState);
  const hapticsEnabled = useTrackingStore((s) => s.settings.hapticsEnabled);

  const prevStatus = useRef<TimerState['status']>(state.status);
  const notificationRef = useRef<Promise<string | null> | null>(null);

  const cancelNotification = useCallback(() => {
    const pending = notificationRef.current;
    notificationRef.current = null;
    if (pending) pending.then(cancelTimerEndNotification);
  }, []);

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

    if (state.status === 'running') {
      if (prev === 'idle' && hapticsEnabled) haptics.start();
      notificationRef.current = scheduleTimerEndNotification(remainingSeconds(state));
    }
    if (state.status === 'paused' || state.status === 'idle') cancelNotification();
    if (state.status === 'finished') {
      cancelNotification();
      if (state.outcome === 'completed' && hapticsEnabled) haptics.finished();
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
