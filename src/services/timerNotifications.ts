import * as Notifications from 'expo-notifications';

/**
 * Gdy telefon zostanie zablokowany w trakcie dłuższej obserwacji, JS jest wstrzymany.
 * Lokalne powiadomienie delikatnie informuje o końcu sesji (bez dźwięku alarmu).
 * Jeśli użytkownik nie dał zgody na powiadomienia – po prostu nic się nie dzieje.
 */
export async function scheduleTimerEndNotification(seconds: number): Promise<string | null> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted || seconds < 1) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Sesja zakończona', body: 'Zajrzyj, jak zareagował układ nerwowy.', sound: false },
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
