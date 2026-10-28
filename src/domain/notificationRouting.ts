export const REMINDER_ID_PREFIX = 'reminder-';
export const TIMER_END_ID_PREFIX = 'timer-end';

export type NotificationTarget = 'home' | null;

/**
 * Przypomnienie otwiera ekran główny – użytkownik sam wybiera: reset przy biurku czy dłuższa obserwacja.
 * Koniec sesji też prowadzi na ekran główny (zakładka Timer), gdzie czeka ocena reakcji.
 * Rozpoznajemy po identyfikatorze, więc działa też dla powiadomień zaplanowanych przez starsze wersje.
 */
export function notificationTarget(identifier: string): NotificationTarget {
  if (identifier.startsWith(REMINDER_ID_PREFIX) || identifier.startsWith(TIMER_END_ID_PREFIX)) return 'home';
  return null;
}
