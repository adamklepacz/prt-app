import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import * as Notifications from 'expo-notifications';
import { ErrorBoundaryProps, router, SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureNotificationHandler } from '../src/services/notifications';
import { colors } from '../src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Deep link somatic://quick-reset uruchomiony „na zimno” z widgetu nadal ma pod spodem zakładki.
export const unstable_settings = { initialRouteName: '(tabs)' };

/** Zamiast „zawieszenia” w buildzie Release pokazujemy treść błędu. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingTop: 80 }}
    >
      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Coś poszło nie tak</Text>
      <Text selectable style={{ fontSize: 15, color: colors.text, marginBottom: 12 }}>
        {error.name}: {error.message}
      </Text>
      <Text selectable style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'Menlo' }}>
        {error.stack}
      </Text>
      <Pressable
        onPress={retry}
        style={{ marginTop: 24, padding: 14, borderRadius: 999, backgroundColor: colors.sage, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Spróbuj ponownie</Text>
      </Pressable>
    </ScrollView>
  );
}

function useNotificationDeepLinks() {
  useEffect(() => {
    try {
      configureNotificationHandler();
    } catch (e) {
      console.warn('Notification handler', e);
    }

    const open = (response: Notifications.NotificationResponse | null | undefined) => {
      const url = response?.notification?.request?.content?.data?.url;
      if (typeof url === 'string' && url.includes('quick-reset')) router.push('/quick-reset');
    };

    let sub: { remove: () => void } | undefined;
    try {
      open(Notifications.getLastNotificationResponse());
      sub = Notifications.addNotificationResponseReceivedListener(open);
    } catch (e) {
      console.warn('Notification listener', e);
    }
    return () => sub?.remove();
  }, []);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
  });
  // Bezpiecznik: gdyby fonty się nie załadowały, startujemy po 3 s z krojem systemowym.
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(id);
  }, []);
  const ready = fontsLoaded || !!fontError || fontTimeout;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  useNotificationDeepLinks();

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="quick-reset"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
