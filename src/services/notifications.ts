import * as Notifications from 'expo-notifications';

const REMINDER_PREFIX = 'reminder-';

const REMINDER_BODIES = [
  'Minuta dla układu nerwowego. Opuść barki i po prostu poobserwuj.',
  'Krótki reset? Rozluźnij żuchwę, wydłuż wydech.',
  'Zajrzyj do ciała z ciekawością – bez naprawiania.',
];

let handlerConfigured = false;

/** W aplikacji (foreground) nie pokazujemy banerów – haptyka i UI wystarczą. */
export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return requested.granted;
}

async function cancelReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Synchronizuje codzienne przypomnienia z ustawieniami. Zwraca false, gdy brak zgody. */
export async function syncReminders(enabled: boolean, times: string[]): Promise<boolean> {
  await cancelReminders();
  if (!enabled || times.length === 0) return true;
  if (!(await ensureNotificationPermission())) return false;

  await Promise.all(
    times.map((time, index) => {
      const [hour, minute] = time.split(':').map(Number);
      return Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${time}`,
        content: {
          title: 'Somatic',
          body: REMINDER_BODIES[index % REMINDER_BODIES.length],
          data: { url: 'somatic://quick-reset' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }),
  );
  return true;
}
