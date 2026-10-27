import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration, formatSessionDate } from '../domain/dates';
import { colors, radius, reactionColors, reactionLabels, spacing } from '../theme/tokens';
import { TrackingSession } from '../types';

export function SessionRow({ session, onLongPress }: { session: TrackingSession; onLongPress?: () => void }) {
  const tags = [
    session.targetArea,
    session.isQuickReset ? 'reset 60 s' : null,
    session.completed === false ? 'przerwana' : null,
  ].filter(Boolean) as string[];

  return (
    <Pressable onLongPress={onLongPress} style={styles.row} accessibilityHint="Przytrzymaj, aby usunąć">
      <View style={[styles.dot, { backgroundColor: reactionColors[session.frustrationLevel] }]} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={styles.title}>{reactionLabels[session.frustrationLevel].title}</Text>
          <Text style={styles.duration}>{formatDuration(session.durationSeconds)}</Text>
        </View>
        <Text style={styles.meta}>{formatSessionDate(session.createdAt)}</Text>
        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((t) => (
              <Text key={t} style={styles.tag}>
                {t}
              </Text>
            ))}
          </View>
        ) : null}
        {session.note ? <Text style={styles.note}>„{session.note}”</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  body: { flex: 1 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 15, fontWeight: '500', color: colors.text },
  duration: { fontSize: 14, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    fontSize: 12,
    color: colors.brown,
    backgroundColor: colors.brownSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  note: { marginTop: 6, fontSize: 14, fontStyle: 'italic', color: colors.textMuted },
});
