import {
  addReminder,
  dateToTime,
  MAX_REMINDERS,
  removeReminder,
  suggestNewReminderTime,
  timeToDate,
  updateReminder,
} from '../reminders';

describe('reminders – konwersja czasu', () => {
  it('zamienia Date na HH:MM z dokładnością do minut', () => {
    expect(dateToTime(new Date(2026, 9, 27, 7, 5, 59))).toBe('07:05');
    expect(dateToTime(new Date(2026, 9, 27, 23, 59))).toBe('23:59');
    expect(dateToTime(new Date(2026, 9, 27, 0, 0))).toBe('00:00');
  });

  it('zamienia HH:MM na Date w dniu bazowym', () => {
    const d = timeToDate('18:47', new Date(2026, 9, 27, 9, 0));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([
      2026, 9, 27, 18, 47, 0,
    ]);
  });
});

describe('reminders – dodawanie', () => {
  it('dodaje dowolną godzinę i sortuje listę', () => {
    expect(addReminder(['10:00', '17:00'], '07:43')).toEqual({ ok: true, times: ['07:43', '10:00', '17:00'] });
  });

  it('odrzuca duplikat z czytelnym komunikatem', () => {
    const result = addReminder(['10:00'], '10:00');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('10:00');
  });

  it('odrzuca niepoprawny format', () => {
    expect(addReminder([], '24:00').ok).toBe(false);
    expect(addReminder([], '9:5').ok).toBe(false);
  });

  it(`pozwala na maksymalnie ${MAX_REMINDERS} przypomnień`, () => {
    const full = Array.from({ length: MAX_REMINDERS }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
    const result = addReminder(full, '05:30');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(MAX_REMINDERS));
  });
});

describe('reminders – edycja i usuwanie', () => {
  it('zmienia godzinę istniejącego przypomnienia', () => {
    expect(updateReminder(['10:00', '14:00'], '10:00', '10:25')).toEqual({ ok: true, times: ['10:25', '14:00'] });
  });

  it('zmiana na tę samą godzinę niczego nie psuje', () => {
    expect(updateReminder(['10:00', '14:00'], '10:00', '10:00')).toEqual({ ok: true, times: ['10:00', '14:00'] });
  });

  it('nie pozwala zmienić na godzinę, która już istnieje', () => {
    expect(updateReminder(['10:00', '14:00'], '10:00', '14:00').ok).toBe(false);
  });

  it('zwraca błąd, gdy edytowanego przypomnienia nie ma na liście', () => {
    expect(updateReminder(['10:00'], '11:00', '12:00').ok).toBe(false);
  });

  it('usuwa przypomnienie', () => {
    expect(removeReminder(['10:00', '14:00', '17:00'], '14:00')).toEqual(['10:00', '17:00']);
  });
});

describe('reminders – podpowiedź nowej godziny', () => {
  it('proponuje 10:00, gdy jest wolna', () => {
    expect(suggestNewReminderTime([])).toBe('10:00');
  });

  it('proponuje pierwszą wolną pełną godzinę', () => {
    expect(suggestNewReminderTime(['10:00', '11:00'])).toBe('12:00');
  });
});
