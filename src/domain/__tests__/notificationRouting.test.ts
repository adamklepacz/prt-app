import { notificationTarget } from '../notificationRouting';

describe('notificationTarget – dokąd prowadzi dotknięcie powiadomienia', () => {
  it('przypomnienie otwiera ekran główny (wybór: reset czy dłuższa obserwacja)', () => {
    expect(notificationTarget('reminder-10:00')).toBe('home');
    expect(notificationTarget('reminder-07:43')).toBe('home');
  });

  it('powiadomienie o końcu sesji prowadzi do timera (tam czeka ocena reakcji)', () => {
    expect(notificationTarget('timer-end')).toBe('home');
    expect(notificationTarget('timer-end-1761650000000')).toBe('home');
  });

  it('nieznane powiadomienia nie zmieniają ekranu', () => {
    expect(notificationTarget('8f3a-uuid')).toBeNull();
  });

  it('nigdy nie prowadzi bezpośrednio do resetu przy biurku', () => {
    expect(notificationTarget('reminder-quick-reset')).toBe('home');
  });
});
