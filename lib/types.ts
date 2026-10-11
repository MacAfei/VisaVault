export type DocumentType =
  | 'PASSPORT'
  | 'VISA'
  | 'RESIDENCE_PERMIT'
  | 'FLIGHT_BOOKING'
  | 'HOTEL_BOOKING'
  | 'INSURANCE'
  | 'BANK_STATEMENT'
  | 'EMPLOYMENT_LETTER'
  | 'PHOTO'
  | 'APPLICATION_RECEIPT'
  | 'REJECTION_LETTER';

export type CaseStatus = 'NEW' | 'NEEDS_FIXES' | 'READY_TO_SUBMIT' | 'SUBMITTED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Traveler {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  travelerId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  extractedData: string;
  confidenceNotes: string | null;
  lowConfidenceFields: string[];
  userEdited: boolean;
  version: number;
  supersededById: string | null;
  createdAt: string;
  thumbnailDataUrl: string | null;
  previewUrl?: string;
}

export interface VisaRecord {
  id: string;
  documentId: string;
  travelerId: string;
  passportDocumentId: string | null;
  country: string;
  region: string;
  visaType: string;
  entries: string;
  validFrom: string;
  validUntil: string;
  maxStayDays: number;
  stayWindowDays: number | null;
  status: string;
  createdAt: string;
}

export interface TravelRecord {
  id: string;
  travelerId: string;
  region: string;
  entryDate: string;
  exitDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TripRecord {
  id: string;
  userId: string;
  travelerId: string;
  destination: string;
  region: string;
  purpose: string;
  startDate: string;
  endDate: string;
  travelerIds: string;
  status: string;
  createdAt: string;
}

export interface ReadinessResultRecord {
  id: string;
  tripId: string;
  verdict: string;
  score: number;
  itemsJson: string;
  generatedAt: string;
}

export interface CaseRecord {
  id: string;
  caseCode: string;
  tripId: string;
  status: CaseStatus;
  consentAcceptedAt: string;
  consentTextVersion: string;
  sharedDocumentIds: string;
  createdAt: string;
}

export interface CaseIssueRecord {
  id: string;
  caseId: string;
  severity: string;
  ruleId: string;
  message: string;
  fixSuggestion: string;
  acknowledgedByAgent: boolean;
  agentNote: string | null;
  createdAt: string;
}

export interface CaseMessageRecord {
  id: string;
  caseId: string;
  from: 'AGENCY' | 'TRAVELER';
  text: string;
  createdAt: string;
}

export interface CaseStatusHistoryRecord {
  id: string;
  caseId: string;
  status: CaseStatus;
  at: string;
}

export type DemoScenario = 'aarav' | 'meera' | 'rohan' | 'sana';