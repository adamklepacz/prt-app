import { X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botanical } from './Botanical';
import { BreathingCircle } from './BreathingCircle';
import { ReactionModal, ReactionSelection } from './ReactionModal';
import { pickRotating, QUICK_RESET_MESSAGES, QUICK_RESET_ROTATION_SECONDS } from '../domain/messages';
import { QUICK_RESET_SECONDS } from '../domain/timerMachine';
import { useAppActiveSettled } from '../hooks/useAppActiveSettled';
import { useTimer } from '../hooks/useTimer';
import { useTrackingStore } from '../store/trackingStore';
import { colors, fonts, radius, spacing } from '../theme/tokens';

/**
 * Tryb „Reset przy biurku” (60 s): pełny ekran, bez cyfrowego licznika (zero presji czasu).
 * Uruchamiany z kafelka lub z widgetu iOS przez deep link somatic://quick-reset.
 */
export function QuickReset({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { state, stop } = useTimer({ durationSeconds: QUICK_RESET_SECONDS, mode: 'quickReset', autoStart: true });
  const addSession = useTrackingStore((s) => s.addSession);
  const appSettled = useAppActiveSettled();

  const finished = state.status === 'finished';

  useEffect(() => {
    if (finished && state.elapsedSeconds < 1) onDone();
  }, [finished, state.elapsedSeconds, onDone]);

  const handleSave = (selection: ReactionSelection) => {
    addSession({
      durationSeconds: state.elapsedSeconds,
      frustrationLevel: selection.frustrationLevel,
      targetArea: selection.targetArea,
      note: selection.note,
      isQuickReset: true,
      completed: state.outcome === 'completed',
    });
    onDone();
  };

  const message = pickRotating(QUICK_RESET_MESSAGES, state.elapsedSeconds, QUICK_RESET_ROTATION_SECONDS);

  return (
    <View testID="quick-reset-screen" style={[styles.screen, { paddingTop: insets.top + spacing.md }]}>
      <Botanical variant="willow" size={260} color="#FFFFFF" opacity={0.35} style={styles.decorTop} />
      <Botanical variant="fern" size={200} color="#FFFFFF" opacity={0.22} style={styles.decorBottom} />

      <View style={styles.header}>
        <Text style={styles.caption}>Reset przy biurku</Text>
        {!finished ? (
          <Pressable onPress={stop} accessibilityRole="button" accessibilityLabel="Przerwij reset" hitSlop={12} style={styles.close}>
            <X color={colors.textOnColor} size={20} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        <BreathingCircle size={260} />
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      </View>

      <Text style={[styles.footer, { marginBottom: insets.bottom + spacing.xl }]}>
        Nie licz sekund. Telefon da znać delikatną wibracją.
      </Text>

      <ReactionModal
        visible={finished && state.elapsedSeconds >= 1 && appSettled}
        outcome={state.outcome ?? 'completed'}
        elapsedSeconds={state.elapsedSeconds}
        onSave={handleSave}
        onDiscard={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sage, paddingHorizontal: spacing.xl },
  decorTop: { position: 'absolute', top: -20, right: -40 },
  decorBottom: { position: 'absolute', bottom: 40, left: -50, transform: [{ scaleX: -1 }] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  caption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xxl },
  message: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 38,
    color: colors.textOnColor,
    textAlign: 'center',
    minHeight: 120,
    paddingHorizontal: spacing.md,
  },
  footer: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
});
