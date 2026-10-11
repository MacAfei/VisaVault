import { addDaysString, addMonthsString, getTodayString } from '@/lib/clock';
import { buildReadinessAssessment } from '@/lib/readiness/build';
import type {
  CaseIssueRecord,
  CaseMessageRecord,
  CaseRecord,
  CaseStatusHistoryRecord,
  DemoScenario,
  DocumentRecord,
  ReadinessResultRecord,
  TravelRecord,
  Traveler,
  TripRecord,
  UserAccount,
  VisaRecord,
} from '@/lib/types';

export interface DemoSeed {
  users: UserAccount[];
  travelers: Traveler[];
  documents: DocumentRecord[];
  visas: VisaRecord[];
  travelRecords: TravelRecord[];
  trips: TripRecord[];
  readinessResults: ReadinessResultRecord[];
  cases: CaseRecord[];
  caseIssues: CaseIssueRecord[];
  caseMessages: CaseMessageRecord[];
  caseStatusHistory: CaseStatusHistoryRecord[];
  scenario: DemoScenario;
}

const BASE_DATE = getTodayString();
const atDay = (days: number) => addDaysString(BASE_DATE, days);
const now = `${BASE_DATE}T12:00:00.000Z`;

function makeDocument(
  id: string,
  travelerId: string,
  type: DocumentRecord['type'],
  fileName: string,
  data: Record<string, unknown>,
  notes: string | null = null,
  lowConfidenceFields: string[] = []
): DocumentRecord {
  return {
    id,
    travelerId,
    type,
    fileUrl: `/samples/${fileName}`,
    fileName,
    extractedData: JSON.stringify(data),
    confidenceNotes: notes,
    lowConfidenceFields,
    userEdited: false,
    version: 1,
    supersededById: null,
    createdAt: now,
    thumbnailDataUrl: null,
  };
}

function makeVisa(
  id: string,
  documentId: string,
  travelerId: string,
  passportDocumentId: string | null
): VisaRecord {
  return {
    id,
    documentId,
    travelerId,
    passportDocumentId,
    country: 'France',
    region: 'SCHENGEN',
    visaType: 'Short-stay (Type C) tourist',
    entries: 'MULTIPLE',
    validFrom: atDay(-60),
    validUntil: atDay(300),
    maxStayDays: 90,
    stayWindowDays: 180,
    status: 'ACTIVE',
    createdAt: now,
  };
}

export function createDemoSeed(scenario: DemoScenario = 'aarav'): DemoSeed {
  const users: UserAccount[] = [
    { id: 'user_aarav', name: 'Aarav Example', email: 'aarav@example.test', role: 'traveler' },
    { id: 'user_meera', name: 'Meera Sample', email: 'meera@example.test', role: 'traveler' },
    { id: 'user_rohan', name: 'Rohan Demo', email: 'rohan@example.test', role: 'traveler' },
    { id: 'user_sana', name: 'Sana Testcase', email: 'sana@example.test', role: 'traveler' },
    { id: 'user_elena', name: 'Elena Sample', email: 'elena@example.test', role: 'traveler' },
  ];

  const travelers: Traveler[] = [
    { id: 'trav_aarav', userId: 'user_aarav', fullName: 'Aarav Example', dateOfBirth: '1994-03-15', nationality: 'Sampleland', countryOfResidence: 'United Arab Emirates', createdAt: now },
    { id: 'trav_meera', userId: 'user_meera', fullName: 'Meera Sample', dateOfBirth: '1993-07-19', nationality: 'Sampleland', countryOfResidence: 'United Arab Emirates', createdAt: now },
    { id: 'trav_rohan', userId: 'user_rohan', fullName: 'Rohan Demo', dateOfBirth: '1992-08-14', nationality: 'Sampleland', countryOfResidence: 'United Arab Emirates', createdAt: now },
    { id: 'trav_sana', userId: 'user_sana', fullName: 'Sana Testcase', dateOfBirth: '1991-11-03', nationality: 'Sampleland', countryOfResidence: 'United Arab Emirates', createdAt: now },
    { id: 'trav_elena', userId: 'user_elena', fullName: 'Elena Sample', dateOfBirth: '1995-04-12', nationality: 'Sampleland', countryOfResidence: 'United Arab Emirates', createdAt: now },
  ];

  const documents: DocumentRecord[] = [
    makeDocument('doc_aarav_passport', 'trav_aarav', 'PASSPORT', 'sample_passport.svg', {
      fullName: 'AARAV EXAMPLE', passportNumber: 'XX0000123', nationality: 'Sampleland', dateOfBirth: '1994-03-15',
      issueDate: addMonthsString(BASE_DATE, -36), expiryDate: addMonthsString(BASE_DATE, 72), issuingCountry: 'Sampleland',
    }),
    makeDocument('doc_aarav_visa', 'trav_aarav', 'VISA', 'sample_visa.svg', {
      holderName: 'AARAV EXAMPLE', passportNumber: 'XX0000123', country: 'France', region: 'SCHENGEN',
      visaType: 'Short-stay (Type C) tourist', entries: 'MULTIPLE', validFrom: atDay(-60), validUntil: atDay(300),
      maxStayDays: 90, referenceNumber: 'SAMPLE-VSA-0001234',
    }),
    makeDocument('doc_aarav_residence', 'trav_aarav', 'RESIDENCE_PERMIT', 'sample_residence_permit.svg', {
      holderName: 'AARAV EXAMPLE', idNumber: 'SMP-0000-0012345', issuingCountry: 'United Arab Emirates',
      expiryDate: addMonthsString(BASE_DATE, 14), sponsorOrEmployer: 'Demo Trading LLC',
    }),
    makeDocument('doc_aarav_bank', 'trav_aarav', 'BANK_STATEMENT', 'sample_bank_statement.svg', {
      accountHolderName: 'AARAV EXAMPLE', periodStart: atDay(-99), periodEnd: atDay(-8), closingBalance: 18450.75, currency: 'AED',
    }, 'Demo statement. A small amount of text is blurry; verify the closing balance.', ['closingBalance']),
    makeDocument('doc_aarav_insurance', 'trav_aarav', 'INSURANCE', 'sample_insurance.svg', {
      holderName: 'AARAV EXAMPLE', coverageAmount: 50000, currency: 'EUR', startDate: atDay(29), endDate: atDay(41), coveredRegions: ['Schengen Area'],
    }),
    makeDocument('doc_aarav_employment', 'trav_aarav', 'EMPLOYMENT_LETTER', 'sample_employment_letter.svg', {
      employeeName: 'AARAV EXAMPLE', employer: 'Demo Trading LLC', position: 'Senior Operations Analyst',
      issueDate: atDay(-10), leaveStart: atDay(30), leaveEnd: atDay(40),
    }),
    makeDocument('doc_aarav_flight', 'trav_aarav', 'FLIGHT_BOOKING', 'sample_flight.svg', {
      passengerName: 'AARAV EXAMPLE', departureDate: atDay(30), returnDate: atDay(40), route: 'DXB-CDG-DXB',
    }),
    makeDocument('doc_aarav_hotel', 'trav_aarav', 'HOTEL_BOOKING', 'sample_hotel.svg', {
      guestName: 'AARAV EXAMPLE', checkIn: atDay(30), checkOut: atDay(40), city: 'Paris',
    }),
    makeDocument('doc_meera_passport', 'trav_meera', 'PASSPORT', 'meera_passport.svg', {
      fullName: 'MEERA SAMPLE', passportNumber: 'XX0000456', nationality: 'Sampleland', dateOfBirth: '1993-07-19',
      issueDate: addMonthsString(BASE_DATE, -36), expiryDate: atDay(75), issuingCountry: 'Sampleland',
    }),
    makeDocument('doc_meera_visa', 'trav_meera', 'VISA', 'meera_visa.svg', {
      holderName: 'MEERA SAMPLE', country: 'France', region: 'SCHENGEN', visaType: 'Short-stay (Type C) tourist',
      entries: 'MULTIPLE', validFrom: atDay(-60), validUntil: atDay(300), maxStayDays: 90,
    }),
    makeDocument('doc_rohan_passport', 'trav_rohan', 'PASSPORT', 'rohan_passport.svg', {
      fullName: 'ROHAN DEMO', passportNumber: 'XX0000789', nationality: 'Sampleland', dateOfBirth: '1992-08-14',
      issueDate: addMonthsString(BASE_DATE, -36), expiryDate: addMonthsString(BASE_DATE, 72), issuingCountry: 'Sampleland',
    }),
    makeDocument('doc_rohan_bank', 'trav_rohan', 'BANK_STATEMENT', 'rohan_bank_statement.svg', {
      accountHolderName: 'ROHAN DEMO', periodStart: atDay(-146), periodEnd: atDay(-55), closingBalance: 9700, currency: 'AED',
    }),
    makeDocument('doc_rohan_employment', 'trav_rohan', 'EMPLOYMENT_LETTER', 'sample_employment_letter.svg', {
      employeeName: 'ROHAN DEMO', employer: 'Demo Trading LLC', issueDate: atDay(-10), leaveStart: atDay(30), leaveEnd: atDay(40),
    }),
    makeDocument('doc_sana_passport', 'trav_sana', 'PASSPORT', 'sana_passport.svg', {
      fullName: 'SANA TESTCASE', passportNumber: 'XX0000999', nationality: 'Sampleland', dateOfBirth: '1991-11-03',
      issueDate: addMonthsString(BASE_DATE, -36), expiryDate: addMonthsString(BASE_DATE, 72), issuingCountry: 'Sampleland',
    }),
    makeDocument('doc_sana_visa', 'trav_sana', 'VISA', 'sample_visa.svg', {
      holderName: 'SANA TESTCASE', country: 'France', region: 'SCHENGEN', visaType: 'Short-stay (Type C) tourist',
      entries: 'MULTIPLE', validFrom: atDay(-60), validUntil: atDay(300), maxStayDays: 90,
    }),
    makeDocument('doc_sana_hotel', 'trav_sana', 'HOTEL_BOOKING', 'sana_hotel.svg', {
      guestName: 'SANNA TEST-CASE', checkIn: atDay(30), checkOut: atDay(37), city: 'Paris',
    }),
    makeDocument('doc_sana_flight', 'trav_sana', 'FLIGHT_BOOKING', 'sample_flight.svg', {
      passengerName: 'SANA TESTCASE', departureDate: atDay(30), returnDate: atDay(40), route: 'DXB-CDG-DXB',
    }),
    makeDocument('doc_sana_insurance', 'trav_sana', 'INSURANCE', 'sample_insurance.svg', {
      holderName: 'SANA TESTCASE', coverageAmount: 20000, currency: 'EUR', startDate: atDay(29), endDate: atDay(41), coveredRegions: ['Schengen Area'],
    }),
    makeDocument('doc_elena_passport', 'trav_elena', 'PASSPORT', 'sample_passport.svg', {
      fullName: 'ELENA SAMPLE', passportNumber: 'XX0000321', nationality: 'Sampleland', dateOfBirth: '1995-04-12',
      issueDate: addMonthsString(BASE_DATE, -36), expiryDate: addMonthsString(BASE_DATE, 72), issuingCountry: 'Sampleland',
    }),
  ];

  const visas: VisaRecord[] = [
    makeVisa('visa_aarav', 'doc_aarav_visa', 'trav_aarav', 'doc_aarav_passport'),
    makeVisa('visa_meera', 'doc_meera_visa', 'trav_meera', 'doc_meera_passport'),
    makeVisa('visa_sana', 'doc_sana_visa', 'trav_sana', 'doc_sana_passport'),
  ];

  const travelRecords: TravelRecord[] = [
    { id: 'record_aarav_1', travelerId: 'trav_aarav', region: 'SCHENGEN', entryDate: atDay(-70), exitDate: atDay(-59), notes: 'Demo Schengen visit (12 days)', createdAt: now },
    { id: 'record_meera_1', travelerId: 'trav_meera', region: 'SCHENGEN', entryDate: atDay(-90), exitDate: atDay(-13), notes: 'Demo Schengen visit (78 days)', createdAt: now },
    { id: 'record_sana_1', travelerId: 'trav_sana', region: 'SCHENGEN', entryDate: atDay(-70), exitDate: atDay(-59), notes: 'Demo Schengen visit (12 days)', createdAt: now },
  ];

  const tripDrafts = [
    { id: 'trip_demo_covered', userId: 'user_aarav', travelerId: 'trav_aarav', destination: 'France', region: 'SCHENGEN', purpose: 'TOURISM', startDate: atDay(30), endDate: atDay(40), status: 'PLANNING' },
    { id: 'trip_demo_partial', userId: 'user_meera', travelerId: 'trav_meera', destination: 'Spain', region: 'SCHENGEN', purpose: 'TOURISM', startDate: atDay(30), endDate: atDay(49), status: 'PLANNING' },
    { id: 'trip_demo_novisa', userId: 'user_rohan', travelerId: 'trav_rohan', destination: 'Japan', region: 'JAPAN', purpose: 'TOURISM', startDate: atDay(30), endDate: atDay(40), status: 'PLANNING' },
    { id: 'trip_case_sana', userId: 'user_sana', travelerId: 'trav_sana', destination: 'France', region: 'SCHENGEN', purpose: 'TOURISM', startDate: atDay(30), endDate: atDay(40), status: 'SHARED' },
    { id: 'trip_case_elena', userId: 'user_elena', travelerId: 'trav_elena', destination: 'United Kingdom', region: 'UK', purpose: 'BUSINESS', startDate: atDay(45), endDate: atDay(52), status: 'SHARED' },
  ];

  const trips: TripRecord[] = tripDrafts.map((trip) => ({
    ...trip,
    travelerIds: JSON.stringify([trip.travelerId]),
    createdAt: now,
  }));

  const readinessResults: ReadinessResultRecord[] = trips.map((trip, index) => {
    const traveler = travelers.find((item) => item.id === trip.travelerId)!;
    const assessment = buildReadinessAssessment(trip, traveler, {
      visas: visas.filter((visa) => visa.travelerId === traveler.id),
      documents: documents.filter((document) => document.travelerId === traveler.id),
      travelRecords: travelRecords.filter((record) => record.travelerId === traveler.id),
    });
    const score = [96, 48, 73, 35, 82][index];
    const result = { ...assessment, score };
    return {
      id: `result_${trip.id}`,
      tripId: trip.id,
      verdict: result.verdict,
      score,
      itemsJson: JSON.stringify(result),
      generatedAt: now,
    };
  });

  const cases: CaseRecord[] = trips.map((trip, index) => ({
    id: `case_${index + 1}`,
    caseCode: `VV-DEMO-${String(index + 1).padStart(4, '0')}`,
    tripId: trip.id,
    status: (['NEW', 'NEEDS_FIXES', 'NEW', 'NEEDS_FIXES', 'READY_TO_SUBMIT'] as const)[index],
    consentAcceptedAt: now,
    consentTextVersion: 'demo-v1',
    sharedDocumentIds: JSON.stringify(documents.filter((doc) => doc.travelerId === trip.travelerId).map((doc) => doc.id)),
    createdAt: now,
  }));

  const caseIssues: CaseIssueRecord[] = [
    { id: 'issue_meera_passport', caseId: cases[1].id, severity: 'BLOCKER', ruleId: 'DEMO-PASSPORT-EXPIRY', message: 'Passport expires too soon after the planned return date.', fixSuggestion: 'Renew the passport before submitting the visa application.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
    { id: 'issue_meera_stay', caseId: cases[1].id, severity: 'BLOCKER', ruleId: 'DEMO-STAY-LIMIT', message: 'The planned stay exceeds the remaining Schengen 90/180-day allowance.', fixSuggestion: 'Shorten the trip or wait until prior stay days fall outside the rolling window.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
    { id: 'issue_rohan_visa', caseId: cases[2].id, severity: 'BLOCKER', ruleId: 'DEMO-MISSING-VISA', message: 'No visa is recorded for the destination.', fixSuggestion: 'Apply for the appropriate visa before travel.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
    { id: 'issue_rohan_bank', caseId: cases[2].id, severity: 'WARNING', ruleId: 'DEMO-STALE-BANK', message: 'The bank statement is older than the recommended period.', fixSuggestion: 'Upload a recent bank statement and supporting employment letter.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
    { id: 'issue_sana_match', caseId: cases[3].id, severity: 'BLOCKER', ruleId: 'DEMO-NAME-MISMATCH', message: 'Hotel guest name differs from the passport name.', fixSuggestion: 'Correct the hotel booking so it matches the passport.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
    { id: 'issue_sana_insurance', caseId: cases[3].id, severity: 'BLOCKER', ruleId: 'DEMO-INSURANCE', message: 'Travel insurance coverage is below the required demo threshold.', fixSuggestion: 'Provide an insurance policy with at least EUR 30,000 coverage.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
    { id: 'issue_sana_dates', caseId: cases[3].id, severity: 'WARNING', ruleId: 'DEMO-DATE-MISMATCH', message: 'Hotel checkout is earlier than the flight return date.', fixSuggestion: 'Extend the hotel reservation to cover the full trip.', acknowledgedByAgent: false, agentNote: null, createdAt: now },
  ];

  const caseMessages: CaseMessageRecord[] = [
    { id: 'message_case_1', caseId: cases[0].id, from: 'AGENCY', text: 'Your demo case is in the review queue.', createdAt: now },
    { id: 'message_case_2', caseId: cases[1].id, from: 'AGENCY', text: 'Please review the passport validity and planned stay duration.', createdAt: now },
    { id: 'message_case_3', caseId: cases[2].id, from: 'AGENCY', text: 'Please add a destination visa and recent financial documents.', createdAt: now },
  ];

  const caseStatusHistory: CaseStatusHistoryRecord[] = cases.map((item, index) => ({
    id: `history_${item.id}`,
    caseId: item.id,
    status: item.status,
    at: now,
  }));

  return {
    users,
    travelers,
    documents,
    visas,
    travelRecords,
    trips,
    readinessResults,
    cases,
    caseIssues,
    caseMessages,
    caseStatusHistory,
    scenario,
  };
}
