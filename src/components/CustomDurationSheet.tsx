import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES, parseCustomMinutes } from '../domain/durations';
import { colors, fonts, radius, spacing, type } from '../theme/tokens';

export interface CustomDurationSheetProps {
  visible: boolean;
  initialMinutes?: number;
  onSubmit: (minutes: number) => void;
  onCancel: () => void;
}

const QUICK = [2, 7, 12, 20, 30];

/** Własny czas obserwacji – wyłącznie w minutach. */
export function CustomDurationSheet({ visible, initialMinutes, onSubmit, onCancel }: CustomDurationSheetProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText(initialMinutes ? String(initialMinutes) : '');
      setError(null);
    }
  }, [visible, initialMinutes]);

  const submit = (value = text) => {
    const result = parseCustomMinutes(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSubmit(result.minutes);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <Text style={type.caption}>Somatic Tracking</Text>
          <Text style={styles.title}>Własny czas obserwacji</Text>
          <Text style={styles.hint}>
            Ile minut chcesz poświęcić na obserwację? Od {MIN_CUSTOM_MINUTES} do {MAX_CUSTOM_MINUTES}.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={(v) => {
                setText(v.replace(/[^0-9]/g, '').slice(0, 3));
                setError(null);
              }}
              accessibilityLabel="Liczba minut"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={() => submit()}
              placeholder="np. 7"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={3}
              autoFocus
            />
            <Text style={styles.unit}>min</Text>
          </View>

          <View style={styles.quick}>
            {QUICK.map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setText(String(m));
                  setError(null);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${m} minut`}
                style={styles.quickChip}
              >
                <Text style={styles.quickLabel}>{m}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable onPress={() => submit()} accessibilityRole="button" style={styles.primary}>
            <Text style={styles.primaryLabel}>Ustaw</Text>
          </Pressable>
          <Pressable onPress={onCancel} accessibilityRole="button" style={styles.secondary}>
            <Text style={styles.secondaryLabel}>Anuluj</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginTop: spacing.xs },
  hint: { ...type.bodyMuted, fontSize: 14, marginTop: spacing.xs },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: spacing.xl, gap: spacing.sm },
  input: {
    minWidth: 120,
    textAlign: 'center',
    fontFamily: fonts.serif,
    fontSize: 54,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  unit: { fontSize: 18, color: colors.textMuted },
  quick: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  quickChip: {
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  quickLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  error: { marginTop: spacing.md, color: colors.brown, fontSize: 14, textAlign: 'center' },
  primary: {
    marginTop: spacing.xl,
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryLabel: { color: colors.textOnColor, fontSize: 16, fontWeight: '600' },
  secondary: { paddingVertical: spacing.lg, alignItems: 'center' },
  secondaryLabel: { color: colors.textMuted, fontSize: 15 },
});
