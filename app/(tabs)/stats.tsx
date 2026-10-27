import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Pill } from '../../src/components/Pill';
import { SessionRow } from '../../src/components/SessionRow';
import { Card, ScreenHeader, Screen, SectionLabel } from '../../src/components/ui';
import { WeeklyChart } from '../../src/components/WeeklyChart';
import { computeTotals, computeWeeklyStats, filterSessions } from '../../src/domain/sessions';
import { useTrackingStore } from '../../src/store/trackingStore';
import { colors, fonts, reactionColors, reactionLabels, spacing, type } from '../../src/theme/tokens';
import { FRUSTRATION_LEVELS, FrustrationLevel, TrackingSession } from '../../src/types';

const PAGE = 30;

export default function StatsScreen() {
  const sessions = useTrackingStore((s) => s.sessions);
  const removeSession = useTrackingStore((s) => s.removeSession);
  const [filter, setFilter] = useState<FrustrationLevel | 'all' | 'quick'>('all');
  const [limit, setLimit] = useState(PAGE);

  const weekly = useMemo(() => computeWeeklyStats(sessions, new Date()), [sessions]);
  const totals = useMemo(() => computeTotals(sessions), [sessions]);
  const filtered = useMemo(() => {
    if (filter === 'all') return sessions;
    if (filter === 'quick') return filterSessions(sessions, { isQuickReset: true });
    return filterSessions(sessions, { frustrationLevel: filter });
  }, [sessions, filter]);

  const confirmRemove = (s: TrackingSession) =>
    Alert.alert('Usunąć sesję?', 'Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => removeSession(s.id) },
    ]);

  return (
    <Screen>
      <ScreenHeader eyebrow="Historia i reakcje" title="Twoje obserwacje" />

      <View style={styles.tiles}>
        <Tile value={String(totals.sessions)} label="sesji łącznie" />
        <Tile value={String(Math.round(totals.seconds / 60))} label="minut obserwacji" />
        <Tile value={weekly.totalSessions ? `${Math.round(weekly.calmShare * 100)}%` : '–'} label="spokoju w tym tyg." />
      </View>

      <Card>
        <Text style={type.caption}>Ostatnie 7 dni</Text>
        <Text style={styles.cardTitle}>Reakcja układu</Text>
        <Text style={[type.bodyMuted, styles.cardHint]}>
          Progres to nie mniej bólu, tylko więcej szałwiowego koloru: reakcja przesuwa się z walki w stronę spokoju.
        </Text>
        <WeeklyChart stats={weekly} />
      </Card>

      <SectionLabel>Historia</SectionLabel>
      <View style={styles.filters}>
        <Pill label="Wszystkie" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {FRUSTRATION_LEVELS.map((l) => (
          <Pill
            key={l}
            label={reactionLabels[l].title.split(' /')[0]}
            dotColor={reactionColors[l]}
            selected={filter === l}
            onPress={() => setFilter(l)}
          />
        ))}
        <Pill label="Reset 60 s" selected={filter === 'quick'} onPress={() => setFilter('quick')} />
      </View>

      <Card style={styles.listCard}>
        {filtered.length === 0 ? (
          <Text style={[type.bodyMuted, styles.empty]}>
            {sessions.length === 0
              ? 'Pierwsza obserwacja pojawi się tutaj. Wystarczy minuta.'
              : 'Brak sesji dla wybranego filtra.'}
          </Text>
        ) : (
          filtered.slice(0, limit).map((s) => <SessionRow key={s.id} session={s} onLongPress={() => confirmRemove(s)} />)
        )}
        {filtered.length > limit ? (
          <Text style={styles.more} onPress={() => setLimit((n) => n + PAGE)}>
            Pokaż więcej
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  tileValue: { fontFamily: fonts.serif, fontSize: 28, color: colors.text },
  tileLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardTitle: { fontFamily: fonts.serifItalic, fontSize: 26, color: colors.text, marginTop: 2 },
  cardHint: { marginTop: spacing.xs, marginBottom: spacing.xl, fontSize: 14, lineHeight: 20 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  listCard: { paddingVertical: spacing.sm },
  empty: { paddingVertical: spacing.lg, textAlign: 'center' },
  more: { textAlign: 'center', paddingVertical: spacing.md, color: colors.sage, fontWeight: '600' },
});
