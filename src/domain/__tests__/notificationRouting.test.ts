import { notificationTarget } from '../notificationRouting';

describe('notificationTarget – dokąd prowadzi dotknięcie powiadomienia', () => {
  it('przypomnienie otwiera ekran główny (wybór: reset czy dłuższa obserwacja)', () => {
    expect(notificationTarget('reminder-10:00')).toBe('home');
    expect(notificationTarget('reminder-07:43')).toBe('home');
  });

  it('powiadomienie o końcu sesji nie zmienia ekranu', () => {
    expect(notificationTarget('timer-end')).toBeNull();
    expect(notificationTarget('8f3a-uuid')).toBeNull();
  });

  it('nigdy nie prowadzi bezpośrednio do resetu przy biurku', () => {
    expect(notificationTarget('reminder-quick-reset')).toBe('home');
  });
});
