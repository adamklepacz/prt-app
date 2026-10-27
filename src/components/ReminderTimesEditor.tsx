import DateTimePicker from '@react-native-community/datetimepicker';
import { Bell, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  addReminder,
  dateToTime,
  MAX_REMINDERS,
  removeReminder,
  suggestNewReminderTime,
  timeToDate,
  updateReminder,
} from '../domain/reminders';
import { colors, fonts, radius, spacing, type } from '../theme/tokens';

export interface ReminderTimesEditorProps {
  times: string[];
  onChange: (times: string[]) => void;
}

type Draft = { mode: 'add' } | { mode: 'edit'; original: string };

/** Lista dowolnych godzin przypomnień (HH:MM) z natywnym iOS-owym wyborem czasu. */
export function ReminderTimesEditor({ times, onChange }: ReminderTimesEditorProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [value, setValue] = useState<Date>(() => timeToDate('10:00'));
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setValue(timeToDate(suggestNewReminderTime(times)));
    setError(null);
    setDraft({ mode: 'add' });
  };

  const openEdit = (time: string) => {
    setValue(timeToDate(time));
    setError(null);
    setDraft({ mode: 'edit', original: time });
  };

  const close = () => {
    setDraft(null);
    setError(null);
  };

  const save = () => {
    if (!draft) return;
    const time = dateToTime(value);
    const result = draft.mode === 'add' ? addReminder(times, time) : updateReminder(times, draft.original, time);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.times);
    close();
  };

  const canAdd = times.length < MAX_REMINDERS;

  return (
    <View>
      {times.length === 0 ? (
        <Text style={styles.empty}>Brak przypomnień. Dodaj pierwszą godzinę.</Text>
      ) : (
        <View style={styles.list}>
          {times.map((time) => (
            <View key={time} style={styles.chip}>
              <Pressable
                onPress={() => openEdit(time)}
                accessibilityRole="button"
                accessibilityLabel={`Zmień przypomnienie ${time}`}
                style={styles.chipMain}
                hitSlop={4}
              >
                <Bell color={colors.sage} size={14} strokeWidth={1.8} />
                <Text style={styles.chipTime}>{time}</Text>
              </Pressable>
              <Pressable
                onPress={() => onChange(removeReminder(times, time))}
                accessibilityRole="button"
                accessibilityLabel={`Usuń przypomnienie ${time}`}
                hitSlop={8}
                style={styles.chipRemove}
              >
                <X color={colors.textMuted} size={14} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {canAdd ? (
        <Pressable
          onPress={openAdd}
          accessibilityRole="button"
          accessibilityLabel="Dodaj godzinę przypomnienia"
          style={({ pressed }) => [styles.add, pressed && styles.pressed]}
        >
          <Plus color={colors.sage} size={18} />
          <Text style={styles.addLabel}>Dodaj godzinę</Text>
        </Pressable>
      ) : (
        <Text style={styles.limit}>{`Osiągnięto limit ${MAX_REMINDERS} przypomnień.`}</Text>
      )}

      <Modal visible={draft !== null} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={type.caption}>Delikatne przypomnienie</Text>
            <Text style={styles.sheetTitle}>{draft?.mode === 'edit' ? 'Zmień godzinę' : 'Nowe przypomnienie'}</Text>

            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={value}
                mode="time"
                display="spinner"
                locale="pl-PL"
                themeVariant="light"
                textColor={colors.text}
                onValueChange={(_event, date) => {
                  if (date) {
                    setValue(date);
                    setError(null);
                  }
                }}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={save}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <Text style={styles.primaryLabel}>Zapisz</Text>
            </Pressable>
            <Pressable onPress={close} accessibilityRole="button" style={styles.secondary}>
              <Text style={styles.secondaryLabel}>Anuluj</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { ...type.bodyMuted, fontSize: 14, marginTop: spacing.lg },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    paddingLeft: spacing.md,
    paddingRight: 6,
  },
  chipMain: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9 },
  chipTime: { fontSize: 16, fontWeight: '500', color: colors.text, fontVariant: ['tabular-nums'] },
  chipRemove: {
    marginLeft: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.sage,
  },
  addLabel: { color: colors.sage, fontSize: 15, fontWeight: '600' },
  limit: { marginTop: spacing.lg, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.75 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, marginTop: spacing.xs },
  pickerWrap: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    overflow: 'hidden',
  },
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
