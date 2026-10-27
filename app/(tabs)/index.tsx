import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Timer } from '../../src/components/Timer';
import { Card, ColorBand, Screen } from '../../src/components/ui';
import { formatDuration, toDateKey } from '../../src/domain/dates';
import { useTrackingStore } from '../../src/store/trackingStore';
import { colors, fonts, spacing, type } from '../../src/theme/tokens';

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5 || h >= 21) return 'Dobry wieczór';
  if (h < 12) return 'Dzień dobry';
  if (h < 18) return 'Cześć';
  return 'Dobry wieczór';
}

export default function TimerScreen() {
  const sessions = useTrackingStore((s) => s.sessions);
  const today = useMemo(() => {
    const key = toDateKey(new Date());
    const list = sessions.filter((s) => toDateKey(new Date(s.createdAt)) === key);
    return { count: list.length, seconds: list.reduce((sum, s) => sum + s.durationSeconds, 0) };
  }, [sessions]);

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={type.title}>{greeting()},</Text>
        <Text style={[type.title, styles.heroSecond]}>co dziś obserwujesz?</Text>
        {today.count > 0 ? (
          <Text style={styles.today}>
            Dziś: {today.count} {today.count === 1 ? 'sesja' : 'sesje'} · {formatDuration(today.seconds)} spokojnej uwagi
          </Text>
        ) : null}
      </View>

      <ColorBand
        title="Reset przy biurku"
        subtitle="60 sekund deeskalacji · bez licznika"
        color={colors.sage}
        botanical="willow"
        onPress={() => router.push('/quick-reset')}
        accessibilityLabel="Otwórz reset przy biurku, 60 sekund"
      />

      <Card>
        <Text style={type.caption}>Somatic Tracking</Text>
        <Text style={[styles.cardTitle]}>Obserwacja</Text>
        <Timer />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  heroSecond: { color: colors.text },
  today: { marginTop: spacing.sm, fontSize: 14, color: colors.textMuted },
  cardTitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 30,
    color: colors.text,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
});
