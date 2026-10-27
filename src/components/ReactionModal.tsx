import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Botanical } from './Botanical';
import { Pill } from './Pill';
import { formatDuration } from '../domain/dates';
import { TimerOutcome } from '../domain/timerMachine';
import { colors, fonts, radius, reactionColors, reactionLabels, spacing, type } from '../theme/tokens';
import { FRUSTRATION_LEVELS, FrustrationLevel, TARGET_AREAS } from '../types';

export interface ReactionSelection {
  frustrationLevel: FrustrationLevel;
  targetArea?: string;
  note?: string;
}

export interface ReactionModalProps {
  visible: boolean;
  outcome: TimerOutcome;
  elapsedSeconds: number;
  onSave: (selection: ReactionSelection) => void;
  onDiscard: () => void;
}

/** Modal zakończenia: ocena reakcji układu nerwowego (nie bólu!). */
export function ReactionModal({ visible, outcome, elapsedSeconds, onSave, onDiscard }: ReactionModalProps) {
  const [level, setLevel] = useState<FrustrationLevel | null>(null);
  const [area, setArea] = useState<string | undefined>();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setLevel(null);
      setArea(undefined);
      setNote('');
    }
  }, [visible]);

  const save = () => {
    if (!level) return;
    onSave({ frustrationLevel: level, targetArea: area, note });
  };

  const subtitle =
    outcome === 'completed'
      ? `Obserwacja trwała ${formatDuration(elapsedSeconds)}. Dziękuję, że zostałeś z tym doznaniem.`
      : `Sesja przerwana po ${formatDuration(elapsedSeconds)}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDiscard}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Botanical variant="sprig" size={130} style={styles.decor} opacity={0.35} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={type.caption}>Ocena reakcji</Text>
            <Text style={[type.title, styles.title]}>Jak zareagował układ nerwowy?</Text>
            <Text style={type.bodyMuted}>{subtitle}</Text>

            <View style={styles.group}>
              {FRUSTRATION_LEVELS.map((key) => (
                <Pill
                  key={key}
                  label={reactionLabels[key].title}
                  hint={reactionLabels[key].hint}
                  dotColor={reactionColors[key]}
                  selected={level === key}
                  onPress={() => setLevel(key)}
                />
              ))}
            </View>

            <Text style={[type.caption, styles.sectionLabel]}>Obszar (opcjonalnie)</Text>
            <View style={styles.wrap}>
              {TARGET_AREAS.map((a) => (
                <Pill key={a} label={a} selected={area === a} onPress={() => setArea(area === a ? undefined : a)} />
              ))}
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Notatka: temperatura, gęstość, granice…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              multiline
              maxLength={500}
            />

            <Pressable
              onPress={save}
              disabled={!level}
              accessibilityRole="button"
              accessibilityState={{ disabled: !level }}
              style={({ pressed }) => [styles.primary, !level && styles.primaryDisabled, pressed && styles.pressed]}
            >
              <Text style={styles.primaryLabel}>Zapisz obserwację</Text>
            </Pressable>
            <Pressable onPress={onDiscard} accessibilityRole="button" style={styles.secondary}>
              <Text style={styles.secondaryLabel}>Nie zapisuj</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  decor: { position: 'absolute', right: -20, top: -10 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { marginTop: spacing.sm, marginBottom: spacing.sm, paddingRight: 70 },
  group: { gap: spacing.sm, marginTop: spacing.xl },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    marginTop: spacing.lg,
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  primary: {
    marginTop: spacing.xl,
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
  primaryLabel: { color: colors.textOnColor, fontSize: 16, fontWeight: '600' },
  secondary: { paddingVertical: spacing.lg, alignItems: 'center' },
  secondaryLabel: { color: colors.textMuted, fontSize: 15, fontFamily: fonts.sans },
});
