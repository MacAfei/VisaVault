import { describe, it, expect } from 'vitest';
import { evaluateRequirements } from '../lib/rules/engine';

describe('Requirements Engine', () => {
  const traveler = {
    fullName: 'Rohan Arjun Sharma',
    nationality: 'IND',
  };

  const trip = {
    destination: 'France',
    region: 'SCHENGEN',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
  };

  it('flags missing required documents as blockers', () => {
    // Only passport provided
    const docs = [
      {
        id: 'd1',
        type: 'PASSPORT',
        extractedData: {
          fullName: 'Rohan Arjun Sharma',
          passportNumber: 'A87654321',
          expiryDate: '2028-01-09',
          issueDate: '2020-01-01',
        },
      },
    ];

    const report = evaluateRequirements(trip, traveler, docs);

    expect(report.missingDocumentTypes).toContain('FLIGHT_BOOKING');
    expect(report.missingDocumentTypes).toContain('HOTEL_BOOKING');
    expect(report.missingDocumentTypes).toContain('INSURANCE');
    expect(report.blockerCount).toBeGreaterThan(0);
  });

  it('flags insurance coverage below €30,000 for Schengen applications', () => {
    const docs = [
      {
        id: 'd1',
        type: 'PASSPORT',
        extractedData: {
          fullName: 'Rohan Arjun Sharma',
          passportNumber: 'A87654321',
          expiryDate: '2028-01-09',
          issueDate: '2020-01-01',
        },
      },
      {
        id: 'd2',
        type: 'INSURANCE',
        extractedData: {
          holderName: 'Rohan Arjun Sharma',
          coverageAmount: 15000, // Below €30,000!
          currency: 'EUR',
          startDate: '2026-06-01',
          endDate: '2026-06-20',
        },
      },
    ];

    const report = evaluateRequirements(trip, traveler, docs);
    const insIssue = report.items.find((i) => i.id === 'SCH-INS-AMOUNT-FAIL');
    expect(insIssue).toBeDefined();
    expect(insIssue?.status).toBe('FAIL');
    expect(insIssue?.severity).toBe('BLOCKER');
  });
});
