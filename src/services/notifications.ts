import * as Notifications from 'expo-notifications';

import { REMINDER_ID_PREFIX as REMINDER_PREFIX } from '../domain/notificationRouting';

const REMINDER_BODIES = [
  'Chwila dla układu nerwowego: reset przy biurku czy dłuższa obserwacja?',
  'Opuść barki. Masz minutę – albo dziesięć?',
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

export async function ensureNotificationPermission({ prompt = true }: { prompt?: boolean } = {}): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!prompt || !current.canAskAgain) return false;
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
export async function syncReminders(
  enabled: boolean,
  times: string[],
  { prompt = true }: { prompt?: boolean } = {},
): Promise<boolean> {
  await cancelReminders();
  if (!enabled || times.length === 0) return true;
  if (!(await ensureNotificationPermission({ prompt }))) return false;

  await Promise.all(
    times.map((time, index) => {
      const [hour, minute] = time.split(':').map(Number);
      return Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${time}`,
        content: {
          title: 'Somatic',
          body: REMINDER_BODIES[index % REMINDER_BODIES.length],
          data: { target: 'home' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }),
  );
  return true;
}
