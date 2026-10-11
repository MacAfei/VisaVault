import { describe, it, expect } from 'vitest';
import { calculateEntries } from '../lib/visa/entries';

describe('Visa Entries Calculation', () => {
  it('correctly calculates single-entry exhaustion', () => {
    const visa = {
      entries: 'SINGLE',
      validFrom: '2026-01-01',
      validUntil: '2026-06-30',
    };

    const pastTrips = [
      {
        region: 'SCHENGEN',
        entryDate: '2026-02-10',
        exitDate: '2026-02-20',
      },
    ];

    const result = calculateEntries(visa, pastTrips);
    expect(result.allowed).toBe(1);
    expect(result.used).toBe(1);
    expect(result.remaining).toBe(0);
    expect(result.isExhausted).toBe(true);
  });

  it('correctly tracks multiple-entry visas without artificial exhaustion', () => {
    const visa = {
      entries: 'MULTIPLE',
      validFrom: '2026-01-01',
      validUntil: '2026-12-31',
    };

    const pastTrips = [
      { region: 'SCHENGEN', entryDate: '2026-02-01', exitDate: '2026-02-10' },
      { region: 'SCHENGEN', entryDate: '2026-04-01', exitDate: '2026-04-10' },
    ];

    const result = calculateEntries(visa, pastTrips);
    expect(result.entriesType).toBe('MULTIPLE');
    expect(result.used).toBe(2);
    expect(result.isExhausted).toBe(false);
  });

  it('ignores past travel records outside of visa validity window', () => {
    const visa = {
      entries: 'SINGLE',
      validFrom: '2026-06-01',
      validUntil: '2026-12-31',
    };

    const pastTrips = [
      {
        region: 'SCHENGEN',
        entryDate: '2026-01-10', // Before visa was valid
        exitDate: '2026-01-20',
      },
    ];

    const result = calculateEntries(visa, pastTrips);
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(1);
    expect(result.isExhausted).toBe(false);
  });
});
