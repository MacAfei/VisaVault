import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { buildReadinessAssessment } from '@/lib/readiness/build';
import { getTodayString } from '@/lib/clock';
import { createDemoSeed, type DemoSeed } from '@/lib/mock/seed';
import type {
  CaseIssueRecord,
  CaseMessageRecord,
  CaseRecord,
  CaseStatus,
  CaseStatusHistoryRecord,
  DemoScenario,
  DocumentRecord,
  DocumentType,
  ReadinessResultRecord,
  TravelRecord,
  Traveler,
  TripRecord,
  UserAccount,
  VisaRecord,
} from '@/lib/types';

const STORE_KEY = 'visavault-demo-v1';
const createId = () => globalThis.crypto.randomUUID();
const demoTimestamp = () => `${getTodayString()}T12:00:00.000Z`;

function makeStorage(): StateStorage {
  return {
    getItem(name) {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    },
    removeItem(name) {
      if (typeof window !== 'undefined') window.localStorage.removeItem(name);
    },
    setItem(name, value) {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(name, value);
      } catch {
        try {
          const persisted = JSON.parse(value) as { state: DemoSeed };
          const oldestFirst = [...persisted.state.documents].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt)
          );
          for (const document of oldestFirst) {
            if (!document.thumbnailDataUrl) continue;
            document.thumbnailDataUrl = null;
            value = JSON.stringify(persisted);
            try {
              window.localStorage.setItem(name, value);
              return;
            } catch {
              continue;
            }
          }
        } catch {
          return;
        }
      }
    },
  };
}

interface NewDocument {
  travelerId?: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fields: Record<string, unknown>;
  confidenceNotes?: string | null;
  lowConfidenceFields?: string[];
  thumbnailDataUrl?: string | null;
  previewUrl?: string;
  userEdited?: boolean;
}

export interface DemoStore extends DemoSeed {
  hydrated: boolean;
  lastSubmittedCaseId: string | null;
  setHydrated: (hydrated: boolean) => void;
  setScenario: (scenario: DemoScenario) => void;
  resetDemo: (scenario?: DemoScenario) => void;
  addDocument: (input: NewDocument) => DocumentRecord;
  updateDocument: (id: string, fields: Record<string, unknown>, userEdited?: boolean) => void;
  deleteDocument: (id: string) => void;
  addTrip: (input: Omit<TripRecord, 'id' | 'createdAt' | 'travelerIds' | 'status'>) => TripRecord;
  evaluateTrip: (tripId: string) => ReturnType<typeof buildReadinessAssessment> | null;
  addTravelRecord: (input: Omit<TravelRecord, 'id' | 'createdAt'>) => void;
  deleteTravelRecord: (id: string) => void;
  submitCase: (input: {
    tripId: string;
    sharedDocumentIds: string[];
    consentAccepted: boolean;
    issues?: Array<Record<string, unknown>>;
  }) => CaseRecord;
  setCaseStatus: (caseId: string, status: CaseStatus, note?: string) => void;
  acknowledgeIssue: (issueId: string, acknowledged: boolean) => void;
  addCaseMessage: (caseId: string, from: 'AGENCY' | 'TRAVELER', text: string) => void;
  deleteCase: (caseId: string) => void;
}

const initialSeed = createDemoSeed();

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      ...initialSeed,
      hydrated: false,
      lastSubmittedCaseId: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setScenario: (scenario) => set({ scenario }),
      resetDemo: (scenario = get().scenario) =>
        set((state) => ({ ...state, ...createDemoSeed(scenario), hydrated: true, lastSubmittedCaseId: null })),
      addDocument: (input) => {
        const state = get();
        const travelerId = input.travelerId || state.travelers[0]?.id;
        if (!travelerId) throw new Error('No demo traveler is available.');
        const previousVersions = state.documents.filter(
          (document) => document.travelerId === travelerId && document.type === input.type && !document.supersededById
        );
        const version = previousVersions.reduce((latest, document) => Math.max(latest, document.version), 0) + 1;
        const id = createId();
        const timestamp = demoTimestamp();
        const record: DocumentRecord = {
          id,
          travelerId,
          type: input.type,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          extractedData: JSON.stringify(input.fields),
          confidenceNotes: input.confidenceNotes || null,
          lowConfidenceFields: input.lowConfidenceFields || [],
          userEdited: Boolean(input.userEdited),
          version,
          supersededById: null,
          createdAt: timestamp,
          thumbnailDataUrl: input.thumbnailDataUrl || null,
          previewUrl: input.previewUrl,
        };
        set((current) => ({
          documents: [
            ...current.documents.map((document) =>
              previousVersions.some((previous) => previous.id === document.id)
                ? { ...document, supersededById: id }
                : document
            ),
            record,
          ],
          visas: input.type === 'VISA'
            ? [
                ...current.visas,
                {
                  id: createId(),
                  documentId: id,
                  travelerId,
                  passportDocumentId: current.documents.find((document) => document.travelerId === travelerId && document.type === 'PASSPORT' && !document.supersededById)?.id || null,
                  country: String(input.fields.country || 'France'),
                  region: String(input.fields.region || 'SCHENGEN'),
                  visaType: String(input.fields.visaType || 'TOURIST'),
                  entries: String(input.fields.entries || 'MULTIPLE'),
                  validFrom: String(input.fields.validFrom || getTodayString()),
                  validUntil: String(input.fields.validUntil || getTodayString()),
                  maxStayDays: Number(input.fields.maxStayDays || 90),
                  stayWindowDays: Number(input.fields.stayWindowDays || 180),
                  status: 'ACTIVE',
                  createdAt: timestamp,
                },
              ]
            : current.visas,
        }));
        return record;
      },
      updateDocument: (id, fields, userEdited = true) =>
        set((state) => ({
          documents: state.documents.map((document) =>
            document.id === id
              ? { ...document, extractedData: JSON.stringify(fields), userEdited }
              : document
          ),
        })),
      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((document) => document.id !== id),
          visas: state.visas.filter((visa) => visa.documentId !== id),
        })),
      addTrip: (input) => {
        const trip: TripRecord = {
          ...input,
          id: createId(),
          travelerIds: JSON.stringify([input.travelerId]),
          status: 'PLANNING',
          createdAt: demoTimestamp(),
        };
        set((state) => ({ trips: [trip, ...state.trips] }));
        get().evaluateTrip(trip.id);
        return trip;
      },
      evaluateTrip: (tripId) => {
        const state = get();
        const trip = state.trips.find((item) => item.id === tripId);
        if (!trip) return null;
        const traveler = state.travelers.find((item) => item.id === trip.travelerId);
        if (!traveler) return null;
        const assessment = buildReadinessAssessment(trip, traveler, {
          visas: state.visas.filter((visa) => visa.travelerId === traveler.id),
          documents: state.documents.filter((document) => document.travelerId === traveler.id),
          travelRecords: state.travelRecords.filter((record) => record.travelerId === traveler.id),
        });
        const result: ReadinessResultRecord = {
          id: createId(),
          tripId,
          verdict: assessment.verdict,
          score: assessment.score,
          itemsJson: JSON.stringify(assessment),
          generatedAt: demoTimestamp(),
        };
        set((current) => ({
          readinessResults: [result, ...current.readinessResults.filter((item) => item.tripId !== tripId)],
        }));
        return assessment;
      },
      addTravelRecord: (input) =>
        set((state) => ({
          travelRecords: [...state.travelRecords, { ...input, id: createId(), createdAt: demoTimestamp() }],
        })),
      deleteTravelRecord: (id) =>
        set((state) => ({ travelRecords: state.travelRecords.filter((record) => record.id !== id) })),
      submitCase: (input) => {
        if (!input.consentAccepted) throw new Error('Consent is required before sharing a case.');
        const state = get();
        const trip = state.trips.find((item) => item.id === input.tripId);
        if (!trip) throw new Error('Trip not found.');
        const timestamp = demoTimestamp();
        const id = createId();
        const caseRecord: CaseRecord = {
          id,
          caseCode: `VV-DEMO-${String(state.cases.length + 1).padStart(4, '0')}`,
          tripId: trip.id,
          status: 'NEW',
          consentAcceptedAt: timestamp,
          consentTextVersion: 'demo-v1',
          sharedDocumentIds: JSON.stringify(input.sharedDocumentIds),
          createdAt: timestamp,
        };
        const issues: CaseIssueRecord[] = (input.issues || []).map((issue) => ({
          id: createId(),
          caseId: id,
          severity: String(issue.severity || 'BLOCKER'),
          ruleId: String(issue.id || createId()),
          message: String(issue.title || issue.message || 'Review required'),
          fixSuggestion: String(issue.fix || issue.fixSuggestion || issue.description || 'Review this item.'),
          acknowledgedByAgent: false,
          agentNote: null,
          createdAt: timestamp,
        }));
        const history: CaseStatusHistoryRecord = { id: createId(), caseId: id, status: 'NEW', at: timestamp };
        set((current) => ({
          cases: [caseRecord, ...current.cases],
          caseIssues: [...current.caseIssues, ...issues],
          caseStatusHistory: [...current.caseStatusHistory, history],
          lastSubmittedCaseId: id,
        }));
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`${STORE_KEY}:lastCase`, id);
          const channel = new BroadcastChannel('visavault');
          channel.postMessage({ type: 'case-submitted', caseId: id });
          channel.close();
        }
        return caseRecord;
      },
      setCaseStatus: (caseId, status, note) => {
        const timestamp = demoTimestamp();
        set((state) => ({
          cases: state.cases.map((item) => item.id === caseId ? { ...item, status } : item),
          caseStatusHistory: [...state.caseStatusHistory, { id: createId(), caseId, status, at: timestamp }],
          caseMessages: note?.trim()
            ? [...state.caseMessages, { id: createId(), caseId, from: 'AGENCY', text: note.trim(), createdAt: timestamp }]
            : state.caseMessages,
        }));
      },
      acknowledgeIssue: (issueId, acknowledged) =>
        set((state) => ({
          caseIssues: state.caseIssues.map((issue) => issue.id === issueId ? { ...issue, acknowledgedByAgent: acknowledged } : issue),
        })),
      addCaseMessage: (caseId, from, text) =>
        set((state) => ({
          caseMessages: [...state.caseMessages, { id: createId(), caseId, from, text, createdAt: demoTimestamp() }],
        })),
      deleteCase: (caseId) =>
        set((state) => ({
          cases: state.cases.filter((item) => item.id !== caseId),
          caseIssues: state.caseIssues.filter((item) => item.caseId !== caseId),
          caseMessages: state.caseMessages.filter((item) => item.caseId !== caseId),
          caseStatusHistory: state.caseStatusHistory.filter((item) => item.caseId !== caseId),
        })),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(makeStorage),
      skipHydration: true,
      partialize: (state) => ({
        ...state,
        hydrated: false,
        documents: state.documents.map(({ previewUrl, ...document }) => ({
          ...document,
          fileUrl: document.fileUrl.startsWith('blob:')
            ? document.thumbnailDataUrl || '/samples/sample_passport.svg'
            : document.fileUrl,
        })),
      }),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<DemoStore>), hydrated: true }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);

export function notifyDemoTabs(): void {
  if (typeof window === 'undefined') return;
  const channel = new BroadcastChannel('visavault');
  channel.postMessage({ type: 'sync' });
  channel.close();
}

export type DemoEntities = Pick<
  DemoStore,
  | 'users'
  | 'travelers'
  | 'documents'
  | 'visas'
  | 'travelRecords'
  | 'trips'
  | 'readinessResults'
  | 'cases'
  | 'caseIssues'
  | 'caseMessages'
  | 'caseStatusHistory'
  | 'scenario'
>;