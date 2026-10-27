"""
Syntetyczny dzwonek medytacyjny (misa tybetańska) – autorski, bez licencji zewnętrznych.
Uruchomienie: python3 scripts/generate-bell.py  -> assets/sounds/bell.wav
Synteza addytywna: niealikwotowe partie misy, lekkie dudnienia (pary rozstrojonych tonów),
miękkie uderzenie pałeczką i długie wybrzmienie.
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
DUR = 7.0
F0 = 432.0  # ciepły, niski ton
t = np.arange(int(SR * DUR)) / SR

# (stosunek częstotliwości, amplituda, czas zaniku w s, rozstrojenie dla dudnień w Hz)
partials = [
    (1.000, 1.00, 4.2, 0.9),
    (2.756, 0.42, 2.6, 1.6),
    (5.404, 0.18, 1.5, 2.3),
    (8.933, 0.07, 0.9, 3.1),
    (13.34, 0.03, 0.5, 4.0),
]

signal = np.zeros_like(t)
rng = np.random.default_rng(7)
for ratio, amp, decay, beat in partials:
    f = F0 * ratio
    env = np.exp(-t / decay)
    phase = rng.uniform(0, 2 * np.pi)
    # dwa bliskie tony = naturalne „falowanie” misy
    signal += amp * env * 0.5 * (np.sin(2 * np.pi * f * t + phase) + np.sin(2 * np.pi * (f + beat) * t + phase * 1.3))

# miękkie uderzenie: krótki, przefiltrowany szum
strike = rng.normal(0, 1, len(t)) * np.exp(-t / 0.012) * 0.06
sos = butter(2, [300, 2500], btype="band", fs=SR, output="sos")
signal += sosfilt(sos, strike)

# łagodny atak (bez kliknięcia) i wygaszenie końcówki
attack = np.clip(t / 0.006, 0, 1)
fade = np.clip((DUR - t) / 0.8, 0, 1)
signal *= attack * fade

# ciepło: delikatny lowpass
signal = sosfilt(butter(2, 5000, btype="low", fs=SR, output="sos"), signal)

signal = signal / np.max(np.abs(signal)) * 10 ** (-3 / 20)  # -3 dBFS
out = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds", "bell.wav")
wavfile.write(out, SR, (signal * 32767).astype(np.int16))
print("zapisano", os.path.normpath(out))
