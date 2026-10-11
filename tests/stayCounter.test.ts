import { describe, it, expect } from 'vitest';
import { calculateStay, countDaysInWindow, getStayDatesSet } from '../lib/visa/stayCounter';

describe('Schengen 90/180-Day Rolling Stay Counter', () => {
  it('counts single 10-day trip accurately including entry and exit dates', () => {
    const records = [
      {
        region: 'SCHENGEN',
        entryDate: '2026-01-01',
        exitDate: '2026-01-10', // 10 days inclusive: Jan 1 to Jan 10
      },
    ];

    const result = calculateStay({
      pastRecords: records,
      region: 'SCHENGEN',
      maxStayDays: 90,
      stayWindowDays: 180,
      referenceDate: '2026-01-15',
    });

    expect(result.daysUsedAsOfDate).toBe(10);
    expect(result.daysRemainingAsOfDate).toBe(80);
    expect(result.wouldExceedLimit).toBe(false);
  });

  it('detects when planned trip exceeds 90-day allowance in rolling 180-day window', () => {
    // Traveler previously spent 75 days in Schengen
    const records = [
      {
        region: 'SCHENGEN',
        entryDate: '2026-01-01',
        exitDate: '2026-03-16', // 75 days
      },
    ];

    // Traveler plans another 20 days starting April 1
    const result = calculateStay({
      pastRecords: records,
      region: 'SCHENGEN',
      maxStayDays: 90,
      stayWindowDays: 180,
      referenceDate: '2026-04-01',
      plannedTrip: {
        startDate: '2026-04-01',
        endDate: '2026-04-20', // 20 days -> 75 + 20 = 95 days (> 90!)
      },
    });

    expect(result.wouldExceedLimit).toBe(true);
    expect(result.maxDaysReachedDuringTrip).toBeGreaterThan(90);
    expect(result.firstExceededDate).toBeDefined();
  });

  it('allows travel when older visits roll outside the 180-day window', () => {
    // Traveler spent 40 days 200 days ago (outside 180-day window from reference date)
    const records = [
      {
        region: 'SCHENGEN',
        entryDate: '2025-05-01',
        exitDate: '2025-06-09',
      },
    ];

    const result = calculateStay({
      pastRecords: records,
      region: 'SCHENGEN',
      maxStayDays: 90,
      stayWindowDays: 180,
      referenceDate: '2026-05-15',
    });

    // Old trip from May 2025 is more than 180 days before May 2026
    expect(result.daysUsedAsOfDate).toBe(0);
    expect(result.daysRemainingAsOfDate).toBe(90);
  });

  it('handles non-rolling window destinations (e.g. fixed per-trip limit)', () => {
    const result = calculateStay({
      pastRecords: [],
      region: 'JAPAN',
      maxStayDays: 15,
      stayWindowDays: null, // Fixed per-trip limit
      referenceDate: '2026-10-01',
      plannedTrip: {
        startDate: '2026-10-01',
        endDate: '2026-10-20', // 20 days > 15 days
      },
    });

    expect(result.wouldExceedLimit).toBe(true);
    expect(result.tripDurationDays).toBe(20);
  });
});
