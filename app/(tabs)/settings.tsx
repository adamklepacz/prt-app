import Constants from 'expo-constants';
import { Download, Smartphone, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { ReminderTimesEditor } from '../../src/components/ReminderTimesEditor';
import { Card, PrimaryButton, Screen, ScreenHeader, SectionLabel } from '../../src/components/ui';
import { parseBackup } from '../../src/domain/backup';
import { pickBackupText, shareBackup } from '../../src/services/backupFiles';
import { syncReminders } from '../../src/services/notifications';
import { playBell } from '../../src/services/sound';
import { useTrackingStore } from '../../src/store/trackingStore';
import { colors, fonts, spacing, type } from '../../src/theme/tokens';
import { ImportMode } from '../../src/types';

export default function SettingsScreen() {
  const settings = useTrackingStore((s) => s.settings);
  const updateSettings = useTrackingStore((s) => s.updateSettings);
  const exportBackup = useTrackingStore((s) => s.exportBackup);
  const importBackup = useTrackingStore((s) => s.importBackup);
  const clearAll = useTrackingStore((s) => s.clearAll);
  const sessionCount = useTrackingStore((s) => s.sessions.length);
  const [busy, setBusy] = useState(false);

  const applyReminders = async (enabled: boolean, times: string[]) => {
    updateSettings({ remindersEnabled: enabled, reminderTimes: times });
    try {
      const ok = await syncReminders(enabled, times);
      if (!ok) {
        updateSettings({ remindersEnabled: false });
        Alert.alert(
          'Brak zgody na powiadomienia',
          'Możesz ją włączyć w Ustawieniach iOS → Somatic → Powiadomienia.',
        );
      }
    } catch {
      Alert.alert('Nie udało się zaplanować przypomnień', 'Spróbuj ponownie za chwilę.');
    }
  };

  const changeTimes = (next: string[]) => {
    // Dodanie pierwszej godziny włącza przypomnienia; usunięcie ostatniej – wyłącza.
    const enabled = next.length > 0 && (settings.remindersEnabled || settings.reminderTimes.length === 0);
    applyReminders(enabled, next);
  };

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareBackup(exportBackup());
    } catch (e) {
      Alert.alert('Eksport nie powiódł się', e instanceof Error ? e.message : 'Nieznany błąd.');
    } finally {
      setBusy(false);
    }
  };

  const runImport = (text: string, mode: ImportMode) => {
    const result = importBackup(text, mode);
    if (!result.ok) {
      Alert.alert('Nie można zaimportować', result.errors.slice(0, 3).join('\n'));
      return;
    }
    const s = useTrackingStore.getState().settings;
    syncReminders(s.remindersEnabled, s.reminderTimes).catch(() => undefined);
    Alert.alert('Gotowe', `Zaimportowano sesji: ${result.imported}. Łącznie w historii: ${result.total}.`);
  };

  const handleImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text === null) return;
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        Alert.alert('Plik jest niepoprawny', parsed.errors.slice(0, 3).join('\n'));
        return;
      }
      Alert.alert(
        'Przywrócić dane?',
        `Plik zawiera ${parsed.backup.sessions.length} sesji. „Zastąp” przywraca stan z pliku (łącznie z ustawieniami), „Połącz” dokleja brakujące sesje.`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Połącz', onPress: () => runImport(text, 'merge') },
          { text: 'Zastąp', style: 'destructive', onPress: () => runImport(text, 'replace') },
        ],
      );
    } catch (e) {
      Alert.alert('Import nie powiódł się', e instanceof Error ? e.message : 'Nieznany błąd.');
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () =>
    Alert.alert('Usunąć całą historię?', 'Zrób najpierw eksport, jeśli chcesz zachować dane.', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: clearAll },
    ]);

  return (
    <Screen>
      <ScreenHeader eyebrow="Spokojnie, lokalnie, offline" title="Ustawienia" />

      <SectionLabel>Przypomnienia</SectionLabel>
      <Card>
        <Row
          title="Delikatne przypomnienia"
          subtitle="Codziennie o Twoich godzinach – dowolnie, co do minuty"
          value={settings.remindersEnabled}
          onChange={(v) => applyReminders(v, settings.reminderTimes.length ? settings.reminderTimes : ['10:00'])}
        />
        <View style={!settings.remindersEnabled && styles.dimmed}>
          <ReminderTimesEditor times={settings.reminderTimes} onChange={changeTimes} />
        </View>
      </Card>

      <SectionLabel>Doznania</SectionLabel>
      <Card>
        <Row
          title="Haptyka"
          subtitle="Miękka wibracja na start i koniec sesji"
          value={settings.hapticsEnabled}
          onChange={(v) => updateSettings({ hapticsEnabled: v })}
        />
        <View style={styles.divider} />
        <Row
          title="Dzwonek misy"
          subtitle="Delikatny dźwięk, gdy minie czas obserwacji – także przy wyciszonym telefonie"
          value={settings.bellEnabled !== false}
          onChange={(v) => {
            updateSettings({ bellEnabled: v });
            if (v) playBell();
          }}
        />
      </Card>

      <SectionLabel>Backup danych</SectionLabel>
      <Card>
        <Text style={[type.bodyMuted, styles.paragraph]}>
          Dane są tylko na tym telefonie ({sessionCount} sesji). Eksportuj plik JSON przez AirDrop lub „Zachowaj w
          Plikach” i przywróć go w dowolnym momencie.
        </Text>
        <View style={styles.buttons}>
          <PrimaryButton label="Eksportuj JSON" onPress={handleExport} icon={<Upload color="#fff" size={18} />} />
          <PrimaryButton
            label="Importuj JSON"
            tone="outline"
            onPress={handleImport}
            icon={<Download color={colors.text} size={18} />}
          />
        </View>
      </Card>

      <SectionLabel>Widget iOS</SectionLabel>
      <Card>
        <View style={styles.widgetHeader}>
          <View style={styles.widgetIcon}>
            <Smartphone color={colors.sage} size={20} />
          </View>
          <Text style={styles.widgetTitle}>Reset 60 s jednym dotknięciem</Text>
        </View>
        <Text style={styles.stepTitle}>Ekran początkowy</Text>
        <Steps
          items={[
            'Przytrzymaj puste miejsce na ekranie, aż ikony zaczną drgać.',
            'Stuknij „Edytuj” → „Dodaj widżet” i wyszukaj „Somatic”.',
            'Wybierz rozmiar mały lub średni i stuknij „Dodaj widżet”.',
          ]}
        />
        <Text style={styles.stepTitle}>Ekran blokady</Text>
        <Steps
          items={[
            'Przytrzymaj ekran blokady i stuknij „Dostosuj” → „Ekran blokady”.',
            'Stuknij pole widżetów pod zegarem i wybierz „Somatic – Reset 60 s”.',
            'Dotknięcie widżetu otwiera od razu tryb deeskalacji (somatic://quick-reset).',
          ]}
        />
      </Card>

      <SectionLabel>Dane</SectionLabel>
      <Card>
        <PrimaryButton label="Usuń całą historię" tone="outline" onPress={handleClear} />
      </Card>

      <Text style={styles.footer}>
        Somatic {Constants.expoConfig?.version ?? ''} · treści edukacyjne, nie zastępują konsultacji lekarskiej.
      </Text>
    </Screen>
  );
}

function Row({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={type.label}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.sage, false: colors.border }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.border}
        accessibilityLabel={title}
      />
    </View>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <View style={styles.steps}>
      {items.map((item, i) => (
        <View key={item} style={styles.step}>
          <Text style={styles.stepNo}>{i + 1}</Text>
          <Text style={styles.stepText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1 },
  rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  dimmed: { opacity: 0.6 },
  paragraph: { marginBottom: spacing.lg },
  buttons: { gap: spacing.sm },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  widgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetTitle: { flex: 1, fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text },
  stepTitle: { ...type.caption, marginTop: spacing.lg, marginBottom: spacing.sm },
  steps: { gap: spacing.sm },
  step: { flexDirection: 'row', gap: spacing.md },
  stepNo: { width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 22, fontSize: 12, color: colors.sage, backgroundColor: colors.sageSoft, overflow: 'hidden' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#3A3A3A' },
  footer: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: spacing.lg, paddingHorizontal: spacing.xl },
});
