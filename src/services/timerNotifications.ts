import * as Notifications from 'expo-notifications';

import { TIMER_END_ID_PREFIX } from '../domain/notificationRouting';
import { TimerMode } from '../domain/timerMachine';

/**
 * Gdy telefon zostanie zablokowany w trakcie dłuższej obserwacji, JS jest wstrzymany.
 * Lokalne powiadomienie delikatnie informuje o końcu sesji (bez dźwięku alarmu).
 * Jeśli użytkownik nie dał zgody na powiadomienia – po prostu nic się nie dzieje.
 */
export const BELL_SOUND_FILE = 'bell.wav';

/** Stały identyfikator na tryb: ponowne zaplanowanie zastępuje stare, a anulowanie działa też po restarcie aplikacji. */
export const timerEndNotificationId = (mode: TimerMode) => `${TIMER_END_ID_PREFIX}-${mode}`;

export async function scheduleTimerEndNotification(
  seconds: number,
  { bell, mode = 'standard' }: { bell: boolean; mode?: TimerMode } = { bell: false },
): Promise<string | null> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted || seconds < 1) return null;
    return await Notifications.scheduleNotificationAsync({
      identifier: timerEndNotificationId(mode),
      content: {
        title: 'Sesja zakończona',
        body: 'Zajrzyj, jak zareagował układ nerwowy.',
        // Ten sam dzwonek misy, gdy telefon jest zablokowany (plik dołączany przez plugin expo-notifications).
        sound: bell ? BELL_SOUND_FILE : false,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(seconds) },
    });
  } catch {
    return null;
  }
}

export async function cancelTimerEndNotification(mode: TimerMode): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(timerEndNotificationId(mode));
  } catch {
    // ignorujemy – powiadomienie mogło już zostać dostarczone
  }
}
