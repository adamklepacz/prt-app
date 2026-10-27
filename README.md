# Somatic · PRT App

Aplikacja iOS do praktyki **Somatic Tracking** z terapii przetwarzania bólu (Pain Reprocessing Therapy). Ma natywny **widget WidgetKit** „Reset 60 s” na ekran początkowy i ekran blokady, który przez deep link `somatic://quick-reset` otwiera od razu pełnoekranowy tryb deeskalacji.

Zasady: dane w 100% lokalne i offline, bez logowania. Zero presji, zero czerwonych alarmów i zero oceny bólu w skali 1–10. Po sesji oceniasz **reakcję układu nerwowego**, a nie natężenie bólu.

## Funkcje

| Zakładka | Co jest w środku |
| --- | --- |
| **Timer** | Kafel „Reset przy biurku (60 s)”: pełny ekran bez licznika, rotacyjne komunikaty, oddychające koła, haptyka po 60 s, potem ocena reakcji. Standardowy timer 1/3/5/10/15 min z pauzą, rotacyjnymi inskrypcjami i zapisem sesji przerwanych. |
| **Reakcje** | Łączna liczba sesji i minut, % spokoju w tygodniu, wykres 7 dni segmentowany wg reakcji (spokój / zniecierpliwienie / walka), filtry i historia. Przytrzymanie sesji usuwa ją. |
| **Wiedza** | Trzy sekcje: Mindset (Somatic Tracking, czego unikać, błąd predykcji), Nurty (1. i 2. poziom psychoterapii i miejsce PRT), Sensytyzacja ośrodkowa. |
| **Ustawienia** | Codzienne przypomnienia o dowolnych godzinach co do minuty (do 12, natywny wybór czasu iOS, `expo-notifications`), haptyka, eksport JSON (`expo-sharing`: AirDrop, Pliki), import JSON z walidacją (tryby „Zastąp” i „Połącz”), instrukcja dodania widgetu. |

## Stack

- **Expo SDK 58** (React Native 0.88, React 19.3), dev build i Continuous Native Generation (`expo prebuild`)
- **Expo Router**: Stack + Tabs, trasa `/quick-reset` jako `fullScreenModal` (deep link)
- **Zustand 5** z `persist` w AsyncStorage
- **Widget**: `@bacons/apple-targets` v5, SwiftUI, folder `targets/widget`
- `expo-haptics`, `expo-notifications`, `expo-sharing`, `expo-file-system`, `expo-document-picker`
- UI: czysty `StyleSheet` z tokenami designu, `lucide-react-native`, Playfair Display + SF Pro, proceduralne ilustracje botaniczne (SVG)
- Testy: **Jest 30 + jest-expo + React Native Testing Library 14**

## Struktura

```
app/                      # Expo Router
  _layout.tsx             # fonty, splash, Stack, deep linki z powiadomień
  quick-reset.tsx         # somatic://quick-reset
  (tabs)/                 # index (Timer), stats, knowledge, settings
src/
  types.ts                # model danych (TrackingSession, AppSettings, BackupFile)
  domain/                 # czysta logika: timerMachine, sessions (statystyki, filtry), backup, dates, messages
  store/trackingStore.ts  # Zustand + persist; fabryka z wstrzykiwanym zegarem i id (testowalność)
  hooks/useTimer.ts       # maszyna stanów + haptyka + powiadomienie o końcu w tle
  components/             # Timer, QuickReset, ReactionModal, WeeklyChart, Botanical, ui
  services/               # haptics, notifications, timerNotifications, backupFiles
  content/knowledge.ts    # treści bazy wiedzy
targets/widget/           # WidgetKit (SwiftUI) + expo-target.config.js
scripts/generate-assets.ts
```

## TDD i testy

Praca szła cyklem Red → Green, co widać w historii commitów:

1. `test(red)`: store, walidacja backupu i maszyna stanów timera
2. `feat(green)`: implementacja domeny i store'a
3. `test(red)`: komponenty `Timer` i `QuickReset`
4. `feat(green)`: komponenty, hook, haptyka

```bash
npm test               # wszystkie testy
npm run test:coverage  # z pokryciem
npm run verify         # tsc --noEmit + jest
```

**Raport (ostatnie uruchomienie):** 5 zestawów, **82/82 testy zaliczone**, `tsc --noEmit` bez błędów.

| Plik testów | Zakres |
| --- | --- |
| `src/store/__tests__/trackingStore.test.ts` | dodawanie sesji (timer / quick reset / przerwane), statystyki 7 dni (także tydzień ze zmianą czasu), sumy, filtrowanie, ustawienia, eksport/import JSON (replace/merge, odrzucanie błędnych plików) |
| `src/domain/__tests__/backup.test.ts` | integralność backupu: typy pól, zakresy, enumy, duplikaty id, format HH:MM, whitelist pól |
| `src/domain/__tests__/timerMachine.test.ts` | idle → running → paused → finished, czas liczony z timestampów (tło), niedozwolone przejścia |
| `src/components/__tests__/Timer.test.tsx` | pigułki czasu, odliczanie, pauza, haptyka (i jej wyłączenie), modal reakcji, zapis ukończonych i przerwanych sesji, QuickReset bez licznika, rotacja komunikatów, flaga `isQuickReset` |
| `src/components/__tests__/WeeklyChart.test.tsx` | segmentacja słupków wg reakcji, legenda |

Pokrycie: `src/domain` ~94%, `src/store` ~96%, `Timer` / `QuickReset` / `useTimer` 93–96% linii.

## Uruchomienie na fizycznym iPhonie (development build)

**Wymagania:** macOS z aktualnym Xcode (z App Store), CocoaPods ≥ 1.16.2, Node LTS i iPhone z włączonym **Trybem dewelopera** (Ustawienia → Prywatność i ochrona → Tryb dewelopera).

1. **Ustaw Team ID** w `app.json` → `expo.ios.appleTeamId` (ustawiony: `6MV2UZSC96`; zmień, jeśli budujesz innym kontem). Znajdziesz go w Xcode → Settings → Accounts albo na developer.apple.com → Membership. Jeśli używasz darmowego konta Apple, zmień też `bundleIdentifier` na unikalny.
2. Zainstaluj zależności i wygeneruj projekt natywny:
   ```bash
   npm install
   npx expo prebuild --platform ios --clean
   ```
3. Podłącz iPhone'a kablem i stuknij „Ufaj temu komputerowi”. Do pracy przez Wi-Fi wejdź po pierwszym połączeniu w Xcode → Window → Devices and Simulators i zaznacz „Connect via network”.
4. Zbuduj i zainstaluj:
   ```bash
   npx expo run:ios --device
   ```
   Wybierz swój telefon z listy. Uruchomi się Metro, a aplikacja (dev client) połączy się z nim w tej samej sieci.
   Wersja działająca bez Metro: `npx expo run:ios --device --configuration Release`.
5. Przy pierwszym uruchomieniu iOS może zablokować dewelopera. Odblokujesz go w Ustawienia → Ogólne → VPN i urządzenia → Twój profil → Ufaj.

> Aplikacja używa wyłącznie lokalnych powiadomień (`enableRemoteNotifications: false`), więc nie potrzebuje uprawnienia Push Notifications. Dzięki temu można ją podpisać darmowym „Personal Team”.

### Widget

- **Ekran początkowy:** przytrzymaj tło → Edytuj → Dodaj widżet → „Somatic” (mały lub średni).
- **Ekran blokady:** przytrzymaj ekran blokady → Dostosuj → Ekran blokady → pole widżetów → „Somatic – Reset 60 s”.
- Widget ma `widgetURL(somatic://quick-reset)`, a Expo Router mapuje go na `app/quick-reset.tsx`. Przy zimnym starcie pod spodem i tak są zakładki (`unstable_settings.initialRouteName`).
- Deep link przetestujesz bez widgetu: wpisz `somatic://quick-reset` w Safari na telefonie albo na symulatorze uruchom `xcrun simctl openurl booted somatic://quick-reset`.
- Kod widgetu edytujesz w Xcode w wirtualnym folderze `expo:targets/widget`. Zmiany zapisują się w `targets/widget/`, poza `ios/`, który jest generowany.

### Po zmianie `app.json` lub `targets/*/expo-target.config.js`

```bash
npx expo prebuild --platform ios --clean && npx expo run:ios --device
```

## Format backupu

```json
{
  "app": "prt-app",
  "schemaVersion": 1,
  "exportedAt": "2026-10-27T13:00:00.000Z",
  "settings": { "remindersEnabled": true, "reminderTimes": ["10:00", "14:00"], "hapticsEnabled": true },
  "sessions": [
    {
      "id": "…",
      "createdAt": "2026-10-27T12:58:00.000Z",
      "durationSeconds": 60,
      "frustrationLevel": "calm",
      "targetArea": "szyja",
      "isQuickReset": true,
      "completed": true,
      "note": "ciepło w łopatce"
    }
  ]
}
```

Import przyjmuje tylko znane pola i odrzuca cały plik, jeśli którakolwiek sesja jest niepoprawna. Komunikat błędu wskazuje wtedy jej indeks.

## Zastrzeżenie

Treści mają charakter edukacyjny i nie zastępują konsultacji lekarskiej. Przyczyny strukturalne bólu wyklucz z lekarzem.
