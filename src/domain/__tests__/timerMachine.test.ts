import { createTimerState, DURATION_PRESETS_SECONDS, remainingSeconds, timerReducer, TimerState } from '../timerMachine';

const T0 = 1_000_000;

const run = (state: TimerState, ...actions: Parameters<typeof timerReducer>[1][]) =>
  actions.reduce(timerReducer, state);

describe('timerMachine – przejścia stanów', () => {
  it('startuje w stanie idle z wybranym czasem', () => {
    const s = createTimerState({ durationSeconds: 180 });
    expect(s).toMatchObject({ status: 'idle', mode: 'standard', durationSeconds: 180, elapsedSeconds: 0 });
  });

  it('idle -> running -> paused -> running -> finished (ukończona)', () => {
    let s = createTimerState({ durationSeconds: 60 });
    s = timerReducer(s, { type: 'START', now: T0 });
    expect(s.status).toBe('running');

    s = timerReducer(s, { type: 'TICK', now: T0 + 20_000 });
    expect(s.elapsedSeconds).toBe(20);

    s = timerReducer(s, { type: 'PAUSE', now: T0 + 25_000 });
    expect(s.status).toBe('paused');
    expect(s.elapsedSeconds).toBe(25);

    // czas pauzy się nie liczy
    s = timerReducer(s, { type: 'RESUME', now: T0 + 100_000 });
    expect(s.status).toBe('running');
    s = timerReducer(s, { type: 'TICK', now: T0 + 110_000 });
    expect(s.elapsedSeconds).toBe(35);

    s = timerReducer(s, { type: 'TICK', now: T0 + 135_000 });
    expect(s).toMatchObject({ status: 'finished', outcome: 'completed', elapsedSeconds: 60 });
  });

  it('liczy czas z timestampów – po powrocie z tła nie gubi sekund', () => {
    const s = run(createTimerState({ durationSeconds: 600 }), { type: 'START', now: T0 }, { type: 'TICK', now: T0 + 245_400 });
    expect(s.elapsedSeconds).toBe(245);
    expect(remainingSeconds(s)).toBe(355);
  });

  it('nie przekracza zadanego czasu nawet przy spóźnionym ticku', () => {
    const s = run(createTimerState({ durationSeconds: 60 }), { type: 'START', now: T0 }, { type: 'TICK', now: T0 + 999_000 });
    expect(s.elapsedSeconds).toBe(60);
    expect(remainingSeconds(s)).toBe(0);
  });

  it('STOP w trakcie kończy sesję jako przerwaną z faktycznym czasem', () => {
    const s = run(createTimerState({ durationSeconds: 300 }), { type: 'START', now: T0 }, { type: 'STOP', now: T0 + 42_700 });
    expect(s).toMatchObject({ status: 'finished', outcome: 'interrupted', elapsedSeconds: 42 });
  });

  it('STOP podczas pauzy również przerywa sesję', () => {
    const s = run(
      createTimerState({ durationSeconds: 300 }),
      { type: 'START', now: T0 },
      { type: 'PAUSE', now: T0 + 10_000 },
      { type: 'STOP', now: T0 + 50_000 },
    );
    expect(s).toMatchObject({ status: 'finished', outcome: 'interrupted', elapsedSeconds: 10 });
  });

  it('RESET wraca do idle z zachowaniem wybranego czasu i trybu', () => {
    const s = run(
      createTimerState({ durationSeconds: 60, mode: 'quickReset' }),
      { type: 'START', now: T0 },
      { type: 'STOP', now: T0 + 5_000 },
      { type: 'RESET' },
    );
    expect(s).toMatchObject({ status: 'idle', mode: 'quickReset', durationSeconds: 60, elapsedSeconds: 0 });
    expect(s.outcome).toBeUndefined();
  });

  it('pozwala zmienić czas tylko w stanie idle', () => {
    let s = createTimerState({ durationSeconds: 60 });
    s = timerReducer(s, { type: 'SELECT_DURATION', durationSeconds: 300 });
    expect(s.durationSeconds).toBe(300);

    const running = timerReducer(s, { type: 'START', now: T0 });
    expect(timerReducer(running, { type: 'SELECT_DURATION', durationSeconds: 60 })).toBe(running);
  });

  it.each<[string, TimerState['status'], Parameters<typeof timerReducer>[1]]>([
    ['PAUSE w idle', 'idle', { type: 'PAUSE', now: T0 }],
    ['RESUME w idle', 'idle', { type: 'RESUME', now: T0 }],
    ['TICK w idle', 'idle', { type: 'TICK', now: T0 }],
    ['STOP w idle', 'idle', { type: 'STOP', now: T0 }],
  ])('ignoruje niedozwolone przejście: %s', (_label, _status, action) => {
    const s = createTimerState({ durationSeconds: 60 });
    expect(timerReducer(s, action)).toBe(s);
  });

  it('ignoruje START w trakcie biegu i po zakończeniu', () => {
    const running = run(createTimerState({ durationSeconds: 60 }), { type: 'START', now: T0 });
    expect(timerReducer(running, { type: 'START', now: T0 + 1 })).toBe(running);

    const finished = timerReducer(running, { type: 'TICK', now: T0 + 60_000 });
    expect(timerReducer(finished, { type: 'START', now: T0 + 61_000 })).toBe(finished);
  });

  it('zapamiętuje spóźnienie zakończenia (np. powrót z tła) – do decyzji o dzwonku', () => {
    const onTime = run(createTimerState({ durationSeconds: 60 }), { type: 'START', now: T0 }, { type: 'TICK', now: T0 + 60_200 });
    expect(onTime.lateByMs).toBe(200);

    const late = run(createTimerState({ durationSeconds: 60 }), { type: 'START', now: T0 }, { type: 'TICK', now: T0 + 660_000 });
    expect(late.lateByMs).toBe(600_000);

    const interrupted = run(createTimerState({ durationSeconds: 60 }), { type: 'START', now: T0 }, { type: 'STOP', now: T0 + 5_000 });
    expect(interrupted.lateByMs).toBeUndefined();
  });

  it('oferuje 4 pigułki czasu (15 min zastąpione własnym czasem)', () => {
    expect([...DURATION_PRESETS_SECONDS]).toEqual([60, 180, 300, 600]);
  });
});

