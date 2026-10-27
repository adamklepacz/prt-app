import { Pause, Play, Square } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Pill } from './Pill';
import { ReactionModal, ReactionSelection } from './ReactionModal';
import { formatClock } from '../domain/dates';
import { INSCRIPTION_ROTATION_SECONDS, pickRotating, TRACKING_INSCRIPTIONS } from '../domain/messages';
import { DURATION_PRESETS_SECONDS, progress } from '../domain/timerMachine';
import { useTimer } from '../hooks/useTimer';
import { useTrackingStore } from '../store/trackingStore';
import { colors, fonts, radius, shadow, spacing, type } from '../theme/tokens';

const RING = 232;
const STROKE = 3;
const R = (RING - STROKE * 2) / 2;
const CIRC = 2 * Math.PI * R;

/** Standardowy timer Somatic Tracking: pigułki czasu, pierścień postępu, rotacyjne inskrypcje. */
export function Timer() {
  const { state, remaining, start, pause, resume, stop, reset, selectDuration } = useTimer({ durationSeconds: 60 });
  const addSession = useTrackingStore((s) => s.addSession);

  const isActive = state.status === 'running' || state.status === 'paused';
  const showModal = state.status === 'finished' && state.elapsedSeconds >= 1;

  // Przerwanie w pierwszej sekundzie – nie ma czego zapisywać.
  useEffect(() => {
    if (state.status === 'finished' && state.elapsedSeconds < 1) reset();
  }, [state.status, state.elapsedSeconds, reset]);

  const handleSave = (selection: ReactionSelection) => {
    addSession({
      durationSeconds: state.elapsedSeconds,
      frustrationLevel: selection.frustrationLevel,
      targetArea: selection.targetArea,
      note: selection.note,
      isQuickReset: false,
      completed: state.outcome === 'completed',
    });
    reset();
  };

  const inscription = isActive
    ? pickRotating(TRACKING_INSCRIPTIONS, state.elapsedSeconds, INSCRIPTION_ROTATION_SECONDS)
    : 'Usiądź wygodnie. Wybierz czas i skieruj uwagę na doznanie.';

  return (
    <View>
      <View style={styles.pills}>
        {DURATION_PRESETS_SECONDS.map((seconds) => (
          <Pill
            key={seconds}
            label={`${seconds / 60} min`}
            selected={state.durationSeconds === seconds}
            onPress={state.status === 'idle' ? () => selectDuration(seconds) : undefined}
          />
        ))}
      </View>

      <View style={styles.ringWrap}>
        <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
          <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            stroke={colors.sage}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - progress(state))}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </Svg>
        <Text testID="timer-display" style={styles.clock} accessibilityLabel="Pozostały czas">
          {formatClock(remaining)}
        </Text>
        <Text style={type.caption}>{state.status === 'paused' ? 'pauza' : 'pozostało'}</Text>
      </View>

      <Text style={styles.inscription}>{inscription}</Text>

      <View style={styles.controls}>
        {state.status === 'idle' || state.status === 'finished' ? (
          <RoundButton label="Rozpocznij obserwację" onPress={start} large>
            <Play color={colors.textOnColor} size={30} fill={colors.textOnColor} />
          </RoundButton>
        ) : (
          <>
            <RoundButton label="Zakończ sesję" onPress={stop} subtle>
              <Square color={colors.brown} size={18} />
            </RoundButton>
            {state.status === 'running' ? (
              <RoundButton label="Wstrzymaj" onPress={pause} large>
                <Pause color={colors.textOnColor} size={28} />
              </RoundButton>
            ) : (
              <RoundButton label="Wznów" onPress={resume} large>
                <Play color={colors.textOnColor} size={28} fill={colors.textOnColor} />
              </RoundButton>
            )}
            <View style={styles.spacer} />
          </>
        )}
      </View>

      <ReactionModal
        visible={showModal}
        outcome={state.outcome ?? 'completed'}
        elapsedSeconds={state.elapsedSeconds}
        onSave={handleSave}
        onDiscard={reset}
      />
    </View>
  );
}

function RoundButton({
  label,
  onPress,
  children,
  large,
  subtle,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  large?: boolean;
  subtle?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.round,
        large ? styles.roundLarge : styles.roundSmall,
        subtle && styles.roundSubtle,
        pressed && { transform: [{ scale: 0.96 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  ringWrap: {
    alignSelf: 'center',
    width: RING,
    height: RING,
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clock: {
    fontFamily: fonts.serif,
    fontSize: 54,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  inscription: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    lineHeight: 25,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  spacer: { width: 52 },
  round: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
  roundLarge: { width: 84, height: 84, backgroundColor: colors.brown, ...shadow },
  roundSmall: { width: 52, height: 52 },
  roundSubtle: { backgroundColor: colors.brownSoft },
});
