import * as Notifications from 'expo-notifications';

/**
 * Gdy telefon zostanie zablokowany w trakcie dłuższej obserwacji, JS jest wstrzymany.
 * Lokalne powiadomienie delikatnie informuje o końcu sesji (bez dźwięku alarmu).
 * Jeśli użytkownik nie dał zgody na powiadomienia – po prostu nic się nie dzieje.
 */
export const BELL_SOUND_FILE = 'bell.wav';

export async function scheduleTimerEndNotification(
  seconds: number,
  { bell }: { bell: boolean } = { bell: false },
): Promise<string | null> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted || seconds < 1) return null;
    return await Notifications.scheduleNotificationAsync({
      identifier: `timer-end-${Date.now()}`,
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

export async function cancelTimerEndNotification(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignorujemy – powiadomienie mogło już zostać dostarczone
  }
}
