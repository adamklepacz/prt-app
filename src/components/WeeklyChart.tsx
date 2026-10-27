import { StyleSheet, Text, View } from 'react-native';

import { colors, reactionColors, reactionLabels, spacing } from '../theme/tokens';
import { FRUSTRATION_LEVELS, WeeklyStats } from '../types';

const BAR_AREA = 140;

/**
 * Słupki 7 dni z segmentacją wg reakcji. Spokój na dole – progres widać,
 * gdy szałwiowa część rośnie kosztem walki.
 */
export function WeeklyChart({ stats }: { stats: WeeklyStats }) {
  const max = Math.max(stats.maxDailyTotal, 1);
  return (
    <View>
      <View style={styles.bars}>
        {stats.days.map((day, i) => {
          const isToday = i === stats.days.length - 1;
          return (
            <View key={day.dateKey} style={styles.col} accessible accessibilityLabel={`${day.label}: ${day.total} sesji`}>
              <Text style={styles.count}>{day.total > 0 ? day.total : ''}</Text>
              <View style={[styles.track, { height: BAR_AREA }]}>
                <View style={[styles.stack, { height: (day.total / max) * BAR_AREA }]}>
                  {(['frustrated', 'impatient', 'calm'] as const).map((level) =>
                    day[level] > 0 ? (
                      <View
                        key={level}
                        testID={`bar-${day.dateKey}-${level}`}
                        style={{ flex: day[level], backgroundColor: reactionColors[level] }}
                      />
                    ) : null,
                  )}
                </View>
              </View>
              <Text style={[styles.day, isToday && styles.today]}>{day.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        {FRUSTRATION_LEVELS.map((level) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: reactionColors[level] }]} />
            <Text style={styles.legendLabel}>{reactionLabels[level].title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center' },
  count: { fontSize: 12, color: colors.textMuted, marginBottom: 4, minHeight: 16 },
  track: { width: 22, justifyContent: 'flex-end', borderRadius: 11, backgroundColor: colors.backgroundAlt, overflow: 'hidden' },
  stack: { width: '100%', borderRadius: 11, overflow: 'hidden' },
  day: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
  today: { color: colors.text, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: colors.textMuted },
});
