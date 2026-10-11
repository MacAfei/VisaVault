import { describe, it, expect } from 'vitest';
import { isFuzzyNameMatch, verifyNameConsistency, verifyDateConsistency } from '../lib/rules/matching';

describe('Name and Date Consistency Matching', () => {
  it('tolerates name word order and middle name omissions', () => {
    // Passport: "ROHAN ARJUN SHARMA"
    expect(isFuzzyNameMatch('ROHAN ARJUN SHARMA', 'SHARMA ROHAN')).toBe(true);
    expect(isFuzzyNameMatch('ROHAN ARJUN SHARMA', 'Rohan Sharma')).toBe(true);
    expect(isFuzzyNameMatch('ROHAN ARJUN SHARMA', 'Sharma, Rohan Arjun')).toBe(true);
    expect(isFuzzyNameMatch('ROHAN ARJUN SHARMA', 'Mr. Rohan Sharma')).toBe(true);
  });

  it('strictly flags completely different names as mismatch', () => {
    expect(isFuzzyNameMatch('ROHAN ARJUN SHARMA', 'Carlos Mendez')).toBe(false);
    expect(isFuzzyNameMatch('ROHAN ARJUN SHARMA', 'John Smith')).toBe(false);
    expect(isFuzzyNameMatch('ELENA ROSTOVA', 'Maria Ivanova')).toBe(false);
  });

  it('verifies name consistency across multiple documents and flags culprits', () => {
    const docs = [
      {
        type: 'FLIGHT_BOOKING',
        extractedData: { passengerName: 'Rohan Sharma' },
      },
      {
        type: 'HOTEL_BOOKING',
        extractedData: { guestName: 'Carlos Gomez' }, // Culprit mismatch!
      },
    ];

    const result = verifyNameConsistency('ROHAN ARJUN SHARMA', docs);
    expect(result.isConsistent).toBe(false);
    expect(result.mismatches.length).toBe(1);
    expect(result.mismatches[0].documentType).toBe('HOTEL_BOOKING');
  });

  it('detects flight and hotel dates mismatching declared trip dates', () => {
    const trip = { startDate: '2026-06-01', endDate: '2026-06-15' };
    const docs = [
      {
        type: 'FLIGHT_BOOKING',
        extractedData: { departureDate: '2026-06-05', returnDate: '2026-06-15' }, // 4 days late
      },
    ];

    const result = verifyDateConsistency(trip, docs);
    expect(result.isConsistent).toBe(false);
    expect(result.issues[0].message).toContain('Flight outbound departure');
  });
});
