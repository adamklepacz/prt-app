import * as Haptics from 'expo-haptics';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { QuickReset } from '../QuickReset';
import { playBell } from '../../services/sound';
import { scheduleTimerEndNotification } from '../../services/timerNotifications';
import { Timer } from '../Timer';
import { useTrackingStore } from '../../store/trackingStore';
import { DEFAULT_SETTINGS } from '../../types';

jest.mock('../../services/timerNotifications', () => ({
  scheduleTimerEndNotification: jest.fn(() => Promise.resolve('notif-1')),
  cancelTimerEndNotification: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../services/sound', () => ({ playBell: jest.fn(), preloadBell: jest.fn() }));

// Animacja oddechu nie jest przedmiotem testu (pętla Animated + fake timers).
jest.mock('../BreathingCircle', () => ({ BreathingCircle: () => null }));

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 27, 12, 0, 0));
  jest.clearAllMocks();
  useTrackingStore.setState({
    sessions: [],
    settings: { ...DEFAULT_SETTINGS, reminderTimes: [...DEFAULT_SETTINGS.reminderTimes] },
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('<Timer /> – standardowy Somatic Tracking', () => {
  it('pokazuje pigułki czasu i domyślnie 1 minutę', async () => {
    await render(<Timer />);

    for (const label of ['1 min', '3 min', '5 min', '10 min', '···']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText('15 min')).toBeNull();
    expect(screen.getByTestId('timer-display').props.children).toBe('01:00');
  });

  it('zmienia czas po wybraniu pigułki', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByText('5 min'));

    expect(screen.getByTestId('timer-display').props.children).toBe('05:00');
  });

  it('idle -> running: odlicza czas i wywołuje delikatną haptykę na start', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    await advance(10_000);
    expect(screen.getByTestId('timer-display').props.children).toBe('00:50');
    expect(screen.getByLabelText('Wstrzymaj')).toBeTruthy();
  });

  it('running -> paused -> running: czas pauzy się nie liczy', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(10_000);
    await fireEvent.press(screen.getByLabelText('Wstrzymaj'));
    await advance(30_000);

    expect(screen.getByTestId('timer-display').props.children).toBe('00:50');

    await fireEvent.press(screen.getByLabelText('Wznów'));
    await advance(5_000);
    expect(screen.getByTestId('timer-display').props.children).toBe('00:45');
  });

  it('pokazuje rotacyjną inskrypcję podczas obserwacji', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));

    expect(screen.getByText('Nie naprawiasz ciała. Testujesz stabilność układu.')).toBeTruthy();
  });

  it('running -> finished: po czasie haptyka sukcesu i modal oceny reakcji', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(60_000);

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    expect(screen.getByText('Jak zareagował układ nerwowy?')).toBeTruthy();
    expect(screen.getByText('Spokojna obserwacja')).toBeTruthy();
    expect(screen.getByText('Zniecierpliwienie')).toBeTruthy();
    expect(screen.getByText('Walka / Frustracja')).toBeTruthy();
  });

  it('zapisuje ukończoną sesję z wybraną reakcją i obszarem', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByText('3 min'));
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(180_000);

    await fireEvent.press(screen.getByText('Zniecierpliwienie'));
    await fireEvent.press(screen.getByText('łopatka'));
    await fireEvent.press(screen.getByText('Zapisz obserwację'));

    const [session] = useTrackingStore.getState().sessions;
    expect(useTrackingStore.getState().sessions).toHaveLength(1);
    expect(session).toMatchObject({
      durationSeconds: 180,
      frustrationLevel: 'impatient',
      targetArea: 'łopatka',
      isQuickReset: false,
      completed: true,
    });
    // timer wraca do idle
    expect(screen.queryByText('Jak zareagował układ nerwowy?')).toBeNull();
    expect(screen.getByTestId('timer-display').props.children).toBe('03:00');
  });

  it('nie pozwala zapisać bez wyboru reakcji', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(60_000);
    await fireEvent.press(screen.getByText('Zapisz obserwację'));

    expect(useTrackingStore.getState().sessions).toHaveLength(0);
  });

  it('rejestruje sesję przerwaną z faktycznym czasem', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByText('5 min'));
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(42_000);
    await fireEvent.press(screen.getByLabelText('Zakończ sesję'));

    expect(screen.getByText('Sesja przerwana po 42 s')).toBeTruthy();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Spokojna obserwacja'));
    await fireEvent.press(screen.getByText('Zapisz obserwację'));

    expect(useTrackingStore.getState().sessions[0]).toMatchObject({
      durationSeconds: 42,
      completed: false,
      frustrationLevel: 'calm',
    });
  });

  it('„Nie zapisuj” odrzuca sesję i resetuje timer', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(60_000);
    await fireEvent.press(screen.getByText('Nie zapisuj'));

    expect(useTrackingStore.getState().sessions).toHaveLength(0);
    expect(screen.getByLabelText('Rozpocznij obserwację')).toBeTruthy();
  });

  it('nie wywołuje haptyki, gdy jest wyłączona w ustawieniach', async () => {
    useTrackingStore.getState().updateSettings({ hapticsEnabled: false });
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(60_000);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});

describe('<Timer /> – własny czas obserwacji („···”)', () => {
  it('ustawia własny czas w minutach i zapamiętuje go', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Własny czas'));
    expect(screen.getByText('Własny czas obserwacji')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Liczba minut'), '7');
    await fireEvent.press(screen.getByText('Ustaw'));

    expect(screen.getByTestId('timer-display').props.children).toBe('07:00');
    expect(screen.getByText('7 min')).toBeTruthy();
    expect(useTrackingStore.getState().settings.customTrackingMinutes).toBe(7);
    expect(screen.queryByText('Własny czas obserwacji')).toBeNull();
  });

  it('odrzuca niepoprawną liczbę minut', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Własny czas'));
    await fireEvent.changeText(screen.getByLabelText('Liczba minut'), '0');
    await fireEvent.press(screen.getByText('Ustaw'));

    expect(screen.getByText('Podaj liczbę minut od 1 do 120.')).toBeTruthy();
    expect(screen.getByTestId('timer-display').props.children).toBe('01:00');
  });

  it('pokazuje zapamiętany własny czas i podpowiada go w polu', async () => {
    useTrackingStore.getState().updateSettings({ customTrackingMinutes: 12 });
    await render(<Timer />);

    expect(screen.getByText('12 min')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Własny czas'));
    expect(screen.getByLabelText('Liczba minut').props.value).toBe('12');
  });

  it('zapisuje sesję z własnym czasem', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Własny czas'));
    await fireEvent.changeText(screen.getByLabelText('Liczba minut'), '7');
    await fireEvent.press(screen.getByText('Ustaw'));
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(7 * 60_000);
    await fireEvent.press(screen.getByText('Spokojna obserwacja'));
    await fireEvent.press(screen.getByText('Zapisz obserwację'));

    expect(useTrackingStore.getState().sessions[0].durationSeconds).toBe(420);
  });
});

describe('<Timer /> – dzwonek na koniec obserwacji', () => {
  it('gra dzwonek, gdy obserwacja dobiegnie końca', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(59_000);
    expect(playBell).not.toHaveBeenCalled();
    await advance(1_000);

    expect(playBell).toHaveBeenCalledTimes(1);
  });

  it('powiadomienie w tle (zablokowany telefon) też ma dzwonek', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));

    expect(scheduleTimerEndNotification).toHaveBeenCalledWith(60, { bell: true });
  });

  it('nie gra dzwonka przy przerwanej sesji', async () => {
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(20_000);
    await fireEvent.press(screen.getByLabelText('Zakończ sesję'));

    expect(playBell).not.toHaveBeenCalled();
  });

  it('nie gra dzwonka, gdy jest wyłączony w ustawieniach', async () => {
    useTrackingStore.getState().updateSettings({ bellEnabled: false });
    await render(<Timer />);
    await fireEvent.press(screen.getByLabelText('Rozpocznij obserwację'));
    await advance(60_000);

    expect(playBell).not.toHaveBeenCalled();
    expect(scheduleTimerEndNotification).toHaveBeenCalledWith(60, { bell: false });
  });
});

describe('<QuickReset /> – reset przy biurku (60 s)', () => {
  it('kończy się tylko delikatną haptyką, bez dzwonka (biuro)', async () => {
    await render(<QuickReset onDone={jest.fn()} />);
    await advance(60_000);

    expect(playBell).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it('startuje automatycznie i nie pokazuje cyfrowego licznika', async () => {
    await render(<QuickReset onDone={jest.fn()} />);
    await advance(5_000);

    expect(screen.getByTestId('quick-reset-screen')).toBeTruthy();
    expect(screen.queryByText(/\d{2}:\d{2}/)).toBeNull();
    expect(screen.getByText('Opuść barki.')).toBeTruthy();
  });

  it('rotuje kojące komunikaty', async () => {
    await render(<QuickReset onDone={jest.fn()} />);
    await advance(12_000);
    expect(screen.getByText('Rozluźnij żuchwę.')).toBeTruthy();

    await advance(12_000);
    expect(screen.getByText('To tylko sygnał alarmowy – tkanki są bezpieczne.')).toBeTruthy();
  });

  it('po 60 s: haptyka i automatyczny wybór reakcji; zapis oznacza sesję jako quick reset', async () => {
    const onDone = jest.fn();
    await render(<QuickReset onDone={onDone} />);
    await advance(60_000);

    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    expect(screen.getByText('Jak zareagował układ nerwowy?')).toBeTruthy();

    await fireEvent.press(screen.getByText('Spokojna obserwacja'));
    await fireEvent.press(screen.getByText('szyja'));
    await fireEvent.press(screen.getByText('Zapisz obserwację'));

    expect(useTrackingStore.getState().sessions[0]).toMatchObject({
      durationSeconds: 60,
      isQuickReset: true,
      frustrationLevel: 'calm',
      targetArea: 'szyja',
      completed: true,
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('przerwanie resetu pozwala zapisać sesję jako przerwaną', async () => {
    const onDone = jest.fn();
    await render(<QuickReset onDone={onDone} />);
    await advance(20_000);
    await fireEvent.press(screen.getByLabelText('Przerwij reset'));

    expect(screen.getByText('Sesja przerwana po 20 s')).toBeTruthy();
    await fireEvent.press(screen.getByText('Walka / Frustracja'));
    await fireEvent.press(screen.getByText('Zapisz obserwację'));

    expect(useTrackingStore.getState().sessions[0]).toMatchObject({
      durationSeconds: 20,
      isQuickReset: true,
      completed: false,
      frustrationLevel: 'frustrated',
    });
    expect(onDone).toHaveBeenCalled();
  });

  it('„Nie zapisuj” zamyka reset bez zapisu', async () => {
    const onDone = jest.fn();
    await render(<QuickReset onDone={onDone} />);
    await advance(60_000);
    await fireEvent.press(screen.getByText('Nie zapisuj'));

    expect(useTrackingStore.getState().sessions).toHaveLength(0);
    expect(onDone).toHaveBeenCalled();
  });
});
