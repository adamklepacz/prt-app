export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';
export type TimerMode = 'standard' | 'quickReset';
export type TimerOutcome = 'completed' | 'interrupted';

export interface TimerState {
  status: TimerStatus;
  mode: TimerMode;
  durationSeconds: number;
  /** Czas zebrany przed ostatnim wznowieniem (ms). */
  accumulatedMs: number;
  /** Timestamp ostatniego startu/wznowienia; null gdy nie biegnie. */
  startedAt: number | null;
  elapsedSeconds: number;
  outcome?: TimerOutcome;
}

export type TimerAction =
  | { type: 'SELECT_DURATION'; durationSeconds: number }
  | { type: 'START'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'STOP'; now: number }
  | { type: 'RESET' };

export const DURATION_PRESETS_SECONDS = [60, 180, 300, 600, 900] as const;
export const QUICK_RESET_SECONDS = 60;

export function createTimerState({
  durationSeconds,
  mode = 'standard',
}: {
  durationSeconds: number;
  mode?: TimerMode;
}): TimerState {
  return { status: 'idle', mode, durationSeconds, accumulatedMs: 0, startedAt: null, elapsedSeconds: 0 };
}

function elapsedMsAt(state: TimerState, now: number): number {
  return state.accumulatedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}

function toSeconds(state: TimerState, ms: number): number {
  return Math.min(Math.floor(ms / 1000), state.durationSeconds);
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'SELECT_DURATION':
      if (state.status !== 'idle' || action.durationSeconds <= 0) return state;
      return { ...state, durationSeconds: action.durationSeconds };

    case 'START':
      if (state.status !== 'idle') return state;
      return { ...state, status: 'running', startedAt: action.now, accumulatedMs: 0, elapsedSeconds: 0 };

    case 'PAUSE': {
      if (state.status !== 'running') return state;
      const ms = elapsedMsAt(state, action.now);
      return { ...state, status: 'paused', accumulatedMs: ms, startedAt: null, elapsedSeconds: toSeconds(state, ms) };
    }

    case 'RESUME':
      if (state.status !== 'paused') return state;
      return { ...state, status: 'running', startedAt: action.now };

    case 'TICK': {
      if (state.status !== 'running') return state;
      const ms = elapsedMsAt(state, action.now);
      if (ms >= state.durationSeconds * 1000) {
        return {
          ...state,
          status: 'finished',
          outcome: 'completed',
          accumulatedMs: state.durationSeconds * 1000,
          startedAt: null,
          elapsedSeconds: state.durationSeconds,
        };
      }
      const elapsedSeconds = toSeconds(state, ms);
      return elapsedSeconds === state.elapsedSeconds ? state : { ...state, elapsedSeconds };
    }

    case 'STOP': {
      if (state.status !== 'running' && state.status !== 'paused') return state;
      const ms = elapsedMsAt(state, action.now);
      return {
        ...state,
        status: 'finished',
        outcome: 'interrupted',
        accumulatedMs: ms,
        startedAt: null,
        elapsedSeconds: toSeconds(state, ms),
      };
    }

    case 'RESET':
      return createTimerState({ durationSeconds: state.durationSeconds, mode: state.mode });

    default:
      return state;
  }
}

export function remainingSeconds(state: TimerState): number {
  return Math.max(0, state.durationSeconds - state.elapsedSeconds);
}

export function progress(state: TimerState): number {
  return state.durationSeconds === 0 ? 0 : Math.min(1, state.elapsedSeconds / state.durationSeconds);
}
