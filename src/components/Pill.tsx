import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

export interface PillProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  dotColor?: string;
  hint?: string;
  tone?: 'light' | 'onColor';
  leading?: ReactNode;
}

export function Pill({ label, selected = false, onPress, dotColor, hint, tone = 'light', leading }: PillProps) {
  const onColor = tone === 'onColor';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.pill,
        onColor && styles.pillOnColor,
        selected && (onColor ? styles.selectedOnColor : styles.selected),
        hint ? styles.withHint : null,
        pressed && styles.pressed,
      ]}
    >
      {leading}
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <View style={hint ? styles.textCol : undefined}>
        <Text style={[styles.label, onColor && styles.labelOnColor, selected && !onColor && styles.labelSelected]}>
          {label}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  withHint: { borderRadius: radius.md, paddingVertical: spacing.md, alignSelf: 'stretch' },
  pillOnColor: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.3)' },
  selected: { backgroundColor: colors.text, borderColor: colors.text },
  selectedOnColor: { backgroundColor: colors.card, borderColor: colors.card },
  pressed: { opacity: 0.75 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  textCol: { flexShrink: 1 },
  label: { fontSize: 15, fontWeight: '500', color: colors.text },
  labelSelected: { color: colors.textOnColor },
  labelOnColor: { color: colors.textOnColor },
  hint: { marginTop: 2, fontSize: 13, color: colors.textMuted },
});
