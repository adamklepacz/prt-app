export const REMINDER_ID_PREFIX = 'reminder-';

export type NotificationTarget = 'home' | null;

/**
 * Przypomnienie otwiera ekran główny – użytkownik sam wybiera: reset przy biurku czy dłuższa obserwacja.
 * Rozpoznajemy po identyfikatorze, więc działa też dla przypomnień zaplanowanych przez starsze wersje.
 */
export function notificationTarget(identifier: string): NotificationTarget {
  return identifier.startsWith(REMINDER_ID_PREFIX) ? 'home' : null;
}
