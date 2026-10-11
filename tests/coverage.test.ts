import { describe, it, expect } from 'vitest';
import { evaluateVisaCoverage } from '../lib/visa/coverage';

describe('Visa Coverage Evaluation', () => {
  const dummyPassport = {
    id: 'pass_1',
    type: 'PASSPORT',
    extractedData: {
      fullName: 'ROHAN ARJUN SHARMA',
      passportNumber: 'A87654321',
      expiryDate: '2028-01-09',
      issueDate: '2018-01-10',
    },
  };

  const validVisa = {
    id: 'v_1',
    documentId: 'doc_v1',
    country: 'France',
    region: 'SCHENGEN',
    visaType: 'C (TOURISM)',
    entries: 'MULTIPLE',
    validFrom: '2026-01-15',
    validUntil: '2026-07-15',
    maxStayDays: 90,
    stayWindowDays: 180,
    status: 'ACTIVE',
  };

  it('evaluates COVERED when visa dates, entries, and passport are completely valid', () => {
    const trip = {
      destination: 'France',
      region: 'SCHENGEN',
      startDate: '2026-06-01',
      endDate: '2026-06-12',
    };

    const result = evaluateVisaCoverage(trip, {
      visas: [validVisa],
      documents: [dummyPassport],
      travelRecords: [],
    });

    expect(result.verdict).toBe('COVERED');
    expect(result.reasons.length).toBe(0);
    expect(result.matchedVisa).toBeDefined();
  });

  it('evaluates PARTIAL when passport expires too soon for Schengen 3-month rule', () => {
    const trip = {
      destination: 'France',
      region: 'SCHENGEN',
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    };

    const expiringPassport = {
      id: 'pass_exp',
      type: 'PASSPORT',
      extractedData: {
        fullName: 'ROHAN ARJUN SHARMA',
        passportNumber: 'A87654321',
        expiryDate: '2026-07-10', // Only 25 days after return! (< 90 days required)
        issueDate: '2018-01-10',
      },
    };

    const result = evaluateVisaCoverage(trip, {
      visas: [validVisa],
      documents: [expiringPassport],
      travelRecords: [],
    });

    expect(result.verdict).toBe('PARTIAL');
    const blocker = result.reasons.find((r) => r.ruleId === 'PASSPORT_MARGIN_SCHENGEN_FAIL');
    expect(blocker).toBeDefined();
    expect(blocker?.severity).toBe('BLOCKER');
  });

  it('evaluates NOT_COVERED when no visa matches the destination region', () => {
    const trip = {
      destination: 'Japan',
      region: 'JAPAN',
      startDate: '2026-10-01',
      endDate: '2026-10-15',
    };

    const result = evaluateVisaCoverage(trip, {
      visas: [validVisa], // Only has Schengen visa
      documents: [dummyPassport],
      travelRecords: [],
    });

    expect(result.verdict).toBe('NOT_COVERED');
    expect(result.reasons[0].ruleId).toBe('NO_VISA_FOUND');
  });
});
