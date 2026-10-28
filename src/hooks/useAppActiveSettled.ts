import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const isActive = (s: AppStateStatus | string | null | undefined) => s !== 'background' && s !== 'inactive';

/**
 * true dopiero, gdy aplikacja jest na pierwszym planie od `delayMs`.
 * iOS potrafi zignorować prezentację <Modal> w trakcie powrotu z tła (np. po dotknięciu powiadomienia).
 */
export function useAppActiveSettled(delayMs = 350): boolean {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSettled(true), delayMs);
    };
    if (isActive(AppState.currentState)) arm();
    const sub = AppState.addEventListener('change', (next) => {
      if (isActive(next)) arm();
      else {
        clearTimeout(timer);
        setSettled(false);
      }
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [delayMs]);

  return settled;
}
