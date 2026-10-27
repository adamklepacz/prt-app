export const QUICK_RESET_MESSAGES = [
  'Opuść barki.',
  'Rozluźnij żuchwę.',
  'To tylko sygnał alarmowy – tkanki są bezpieczne.',
  'Wydłuż wydech. Niech krzesło Cię niesie.',
  'Nic nie musisz naprawiać. Wystarczy zauważyć.',
  'Twój mózg uczy się właśnie, że jest bezpiecznie.',
] as const;

export const TRACKING_INSCRIPTIONS = [
  'Nie naprawiasz ciała. Testujesz stabilność układu.',
  'Rejestruj surowe parametry: temperatura, gęstość, granice.',
  'Obserwuj jak naukowiec – z ciekawością, bez oceny.',
  'Doznanie może być intensywne i jednocześnie bezpieczne.',
  'Gdy uwaga ucieka, po prostu wróć. To też jest trening.',
  'Brak paniki to najważniejszy sygnał, jaki wysyłasz mózgowi.',
] as const;

export const QUICK_RESET_ROTATION_SECONDS = 10;
export const INSCRIPTION_ROTATION_SECONDS = 20;

/** Deterministyczny wybór komunikatu na podstawie upływu czasu. */
export function pickRotating<T>(list: readonly T[], elapsedSeconds: number, everySeconds: number): T {
  const index = Math.floor(Math.max(0, elapsedSeconds) / everySeconds) % list.length;
  return list[index];
}
