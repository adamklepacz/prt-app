import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReminderTimesEditor } from '../ReminderTimesEditor';
import { MAX_REMINDERS } from '../../domain/reminders';

// Natywny bębenek iOS zastępujemy polem tekstowym „HH:MM”, które woła onValueChange jak prawdziwy picker.
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  const pad = (n: number) => String(n).padStart(2, '0');
  function MockPicker({ value, onValueChange }: { value: Date; onValueChange: (e: unknown, d: Date) => void }) {
    return React.createElement(TextInput, {
      testID: 'time-picker',
      value: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
      onChangeText: (text: string) => {
        const [h, m] = text.split(':').map(Number);
        const next = new Date(value);
        next.setHours(h, m, 0, 0);
        onValueChange({ nativeEvent: { timestamp: next.getTime(), utcOffset: 0 } }, next);
      },
    });
  }
  return { __esModule: true, default: MockPicker };
});

const TIMES = ['10:00', '14:00', '17:00'];

describe('<ReminderTimesEditor />', () => {
  it('pokazuje ustawione godziny', async () => {
    await render(<ReminderTimesEditor times={TIMES} onChange={jest.fn()} />);
    for (const t of TIMES) expect(screen.getByText(t)).toBeTruthy();
  });

  it('pokazuje stan pusty', async () => {
    await render(<ReminderTimesEditor times={[]} onChange={jest.fn()} />);
    expect(screen.getByText('Brak przypomnień. Dodaj pierwszą godzinę.')).toBeTruthy();
  });

  it('dodaje przypomnienie o dowolnej godzinie z dokładnością do minut', async () => {
    const onChange = jest.fn();
    await render(<ReminderTimesEditor times={TIMES} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Dodaj godzinę przypomnienia'));
    expect(screen.getByText('Nowe przypomnienie')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('time-picker'), '07:43');
    await fireEvent.press(screen.getByText('Zapisz'));

    expect(onChange).toHaveBeenCalledWith(['07:43', '10:00', '14:00', '17:00']);
    expect(screen.queryByText('Nowe przypomnienie')).toBeNull();
  });

  it('nie dodaje duplikatu i pokazuje komunikat', async () => {
    const onChange = jest.fn();
    await render(<ReminderTimesEditor times={TIMES} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Dodaj godzinę przypomnienia'));
    await fireEvent.changeText(screen.getByTestId('time-picker'), '14:00');
    await fireEvent.press(screen.getByText('Zapisz'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Przypomnienie o 14:00 już istnieje.')).toBeTruthy();
  });

  it('edytuje godzinę po stuknięciu w przypomnienie', async () => {
    const onChange = jest.fn();
    await render(<ReminderTimesEditor times={TIMES} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Zmień przypomnienie 10:00'));
    expect(screen.getByText('Zmień godzinę')).toBeTruthy();
    expect(screen.getByTestId('time-picker').props.value).toBe('10:00');
    await fireEvent.changeText(screen.getByTestId('time-picker'), '10:25');
    await fireEvent.press(screen.getByText('Zapisz'));

    expect(onChange).toHaveBeenCalledWith(['10:25', '14:00', '17:00']);
  });

  it('anulowanie nie zmienia listy', async () => {
    const onChange = jest.fn();
    await render(<ReminderTimesEditor times={TIMES} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Dodaj godzinę przypomnienia'));
    await fireEvent.changeText(screen.getByTestId('time-picker'), '06:15');
    await fireEvent.press(screen.getByText('Anuluj'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText('Nowe przypomnienie')).toBeNull();
  });

  it('usuwa przypomnienie', async () => {
    const onChange = jest.fn();
    await render(<ReminderTimesEditor times={TIMES} onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Usuń przypomnienie 14:00'));

    expect(onChange).toHaveBeenCalledWith(['10:00', '17:00']);
  });

  it(`po osiągnięciu limitu ${MAX_REMINDERS} ukrywa dodawanie`, async () => {
    const full = Array.from({ length: MAX_REMINDERS }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
    await render(<ReminderTimesEditor times={full} onChange={jest.fn()} />);

    expect(screen.queryByLabelText('Dodaj godzinę przypomnienia')).toBeNull();
    expect(screen.getByText(`Osiągnięto limit ${MAX_REMINDERS} przypomnień.`)).toBeTruthy();
  });
});
