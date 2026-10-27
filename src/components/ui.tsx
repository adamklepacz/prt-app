import { ArrowRight } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botanical, BotanicalVariant } from './Botanical';
import { cardStyle, colors, fonts, radius, spacing, type } from '../theme/tokens';

export function Screen({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[{ paddingTop: insets.top + spacing.lg, paddingBottom: spacing.xxxl }, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function ScreenHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={type.display}>{title}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[cardStyle, styles.cardMargin, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={[type.caption, styles.sectionLabel]}>{children}</Text>;
}

/** Kolorowe pasmo jak w kartach medytacji INTU – serif, ilustracja botaniczna, strzałka. */
export function ColorBand({
  title,
  subtitle,
  color,
  botanical,
  onPress,
  accessibilityLabel,
  rounded = true,
}: {
  title: string;
  subtitle?: string;
  color: string;
  botanical: BotanicalVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
  rounded?: boolean;
}) {
  const content = (
    <>
      <Botanical variant={botanical} size={170} color="#1E1E1E" opacity={0.42} style={styles.bandArt} />
      <View style={styles.bandText}>
        <Text style={styles.bandTitle}>{title}</Text>
        {subtitle ? <Text style={styles.bandSubtitle}>{subtitle}</Text> : null}
      </View>
      {onPress ? (
        <View style={styles.bandArrow}>
          <ArrowRight color={colors.textOnColor} size={18} />
        </View>
      ) : null}
    </>
  );
  const style = [styles.band, rounded && styles.bandRounded, { backgroundColor: color }];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  tone = 'sage',
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  tone?: 'sage' | 'outline';
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, tone === 'outline' && styles.buttonOutline, pressed && styles.pressed]}
    >
      {icon}
      <Text style={[styles.buttonLabel, tone === 'outline' && styles.buttonLabelOutline]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  eyebrow: { ...type.bodyMuted, marginBottom: spacing.xs },
  cardMargin: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionLabel: { marginHorizontal: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.md },
  band: {
    minHeight: 132,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bandRounded: { borderRadius: radius.lg, marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  bandArt: { position: 'absolute', right: -14, top: -16 },
  bandText: { paddingRight: 96 },
  bandTitle: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 40, color: colors.textOnColor },
  bandSubtitle: { marginTop: 2, fontSize: 14, color: 'rgba(255,255,255,0.88)' },
  bandArrow: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.card, shadowColor: '#5A4A3A', shadowOpacity: 0.08, shadowRadius: 6 },
  segmentLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  segmentLabelActive: { color: colors.text },
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
  },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonLabel: { color: colors.textOnColor, fontSize: 15, fontWeight: '600' },
  buttonLabelOutline: { color: colors.text },
});
