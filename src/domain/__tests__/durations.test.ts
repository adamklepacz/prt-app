import { isPresetDuration, MAX_CUSTOM_MINUTES, MIN_CUSTOM_MINUTES, parseCustomMinutes } from '../durations';

describe('durations – własny czas obserwacji w minutach', () => {
  it.each([
    ['7', 7],
    [' 25 ', 25],
    ['1', 1],
    [String(MAX_CUSTOM_MINUTES), MAX_CUSTOM_MINUTES],
  ])('akceptuje "%s" → %i min', (text, minutes) => {
    expect(parseCustomMinutes(text)).toEqual({ ok: true, minutes });
  });

  it.each(['', '0', '-3', '2.5', '1,5', 'abc', String(MAX_CUSTOM_MINUTES + 1), '1:30'])('odrzuca "%s"', (text) => {
    const result = parseCustomMinutes(text);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe(`Podaj liczbę minut od ${MIN_CUSTOM_MINUTES} do ${MAX_CUSTOM_MINUTES}.`);
    }
  });

  it('rozpoznaje czasy z pigułek', () => {
    expect(isPresetDuration(60)).toBe(true);
    expect(isPresetDuration(600)).toBe(true);
    expect(isPresetDuration(900)).toBe(false); // 15 min nie jest już pigułką
    expect(isPresetDuration(420)).toBe(false);
  });
});
