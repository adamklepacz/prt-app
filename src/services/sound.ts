import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BELL = require('../../assets/sounds/bell.wav');

let player: AudioPlayer | null = null;
let modeConfigured = false;

async function ensurePlayer(): Promise<AudioPlayer> {
  if (!modeConfigured) {
    modeConfigured = true;
    // Dzwonek ma zabrzmieć także przy przełączniku wyciszenia (jak w aplikacjach do medytacji),
    // ściszając na chwilę muzykę zamiast ją zatrzymywać.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' });
  }
  if (!player) player = createAudioPlayer(BELL);
  return player;
}

/** Wczytuje dźwięk z wyprzedzeniem, żeby zabrzmiał bez opóźnienia. */
export function preloadBell(): void {
  ensurePlayer().catch(() => undefined);
}

/** Miękki dzwonek misy tybetańskiej na koniec obserwacji. */
export function playBell(): void {
  ensurePlayer()
    .then(async (p) => {
      p.volume = 0.9;
      await p.seekTo(0);
      p.play();
    })
    .catch(() => undefined);
}
