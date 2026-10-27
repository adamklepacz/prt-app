import { render, screen } from '@testing-library/react-native';

import { WeeklyChart } from '../WeeklyChart';
import { computeWeeklyStats } from '../../domain/sessions';
import { TrackingSession } from '../../types';

const REF = new Date(2026, 9, 27, 12, 0, 0);
const at = (daysAgo: number, hour: number) =>
  new Date(REF.getFullYear(), REF.getMonth(), REF.getDate() - daysAgo, hour).toISOString();

const session = (id: string, createdAt: string, frustrationLevel: TrackingSession['frustrationLevel']): TrackingSession => ({
  id,
  createdAt,
  durationSeconds: 60,
  frustrationLevel,
  isQuickReset: false,
});

describe('<WeeklyChart />', () => {
  it('rysuje 7 kolumn z etykietami i segmentami wg reakcji', async () => {
    const stats = computeWeeklyStats(
      [
        session('a', at(0, 9), 'calm'),
        session('b', at(0, 10), 'frustrated'),
        session('c', at(3, 9), 'impatient'),
      ],
      REF,
    );
    await render(<WeeklyChart stats={stats} />);

    for (const label of ['Śr', 'Cz', 'Pt', 'Sb', 'Nd', 'Pn', 'Wt']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByTestId('bar-2026-10-27-calm')).toBeTruthy();
    expect(screen.getByTestId('bar-2026-10-27-frustrated')).toBeTruthy();
    expect(screen.queryByTestId('bar-2026-10-27-impatient')).toBeNull();
    expect(screen.getByTestId('bar-2026-10-24-impatient')).toBeTruthy();
    expect(screen.getByLabelText('Wt: 2 sesji')).toBeTruthy();
  });

  it('pokazuje legendę reakcji bez skali bólu', async () => {
    await render(<WeeklyChart stats={computeWeeklyStats([], REF)} />);

    expect(screen.getByText('Spokojna obserwacja')).toBeTruthy();
    expect(screen.getByText('Zniecierpliwienie')).toBeTruthy();
    expect(screen.getByText('Walka / Frustracja')).toBeTruthy();
    expect(screen.queryByText(/\/10/)).toBeNull();
  });
});
