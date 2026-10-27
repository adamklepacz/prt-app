import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';

import { QuickReset } from '../src/components/QuickReset';

/** Trasa dla deep linku somatic://quick-reset (widget iOS, przypomnienia, kafelek). */
export default function QuickResetRoute() {
  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <QuickReset onDone={close} />
    </>
  );
}
