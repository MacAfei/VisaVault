# VisaVault 🛡️✈️
> **AI-Powered Visa Wallet & Consular Readiness Engine**  
> *Built for the Travel Hackathon for Visa Assistance Agencies (12-hour overnight build)*

VisaVault solves the two fundamental friction points in international travel visas:
1. **Traveler Side:** Answers *"Do I already have a visa that covers this trip? If not, what do I need, what is missing in my vault, and what should I do next?"* with deterministic verification (rolling 90/180-day stay counters, entry quotas, dual-passport linkage, passport validity margins).
2. **Agency Side:** Allows travelers to transmit a verified, consent-backed case pack to the visa assistance agency. Agency staff receive structured, pre-extracted, pre-validated data so they **never re-type details from scans** or manually cross-reference basic document criteria.

---

## 🚀 Quick Start & Run Commands

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### 2. Setup & Installation
```bash
# Install dependencies
npm install

# Initialize SQLite database and run Prisma migrations
npx prisma db push

# Seed demo scenarios (1 traveler wallet, 3 demo moments, 5 agency cases)
npx tsx prisma/seed.ts
```

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Unit Tests
```bash
npm test
```
Runs the 16 unit tests across `stayCounter`, `entries`, `matching`, `engine`, and `coverage`.

---

## ⚙️ Environment Variables

Configuration is handled in `.env.local` (example provided in `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLite database location | `"file:./dev.db"` |
| `GEMINI_API_KEY` | Google Gemini API key for multimodal document OCR | `""` (falls back to mock if empty) |
| `GEMINI_MODEL` | Google Gemini model name | `"gemini-2.5-flash"` |
| `AGENCY_PASSWORD` | Password protecting agency console (`/agency`) | `"visa-vault-agent"` |
| `DEMO_MODE` | Force instant offline demo mock extraction | `"false"` |
| `DEMO_TODAY` | Deterministic clock override date (`YYYY-MM-DD`) | `"2026-05-15"` |

> [!IMPORTANT]
> **Deterministic Clock Logic (`lib/clock.ts`):**  
> All business logic, validity margins, stay limits, and reminder calculations use `getToday()` and `getTodayString()` from `lib/clock.ts`. `new Date()` is never called in business logic. Setting `DEMO_TODAY="2026-05-15"` guarantees all hackathon demo scenarios function identically regardless of the day or time zone.

---

## 🧭 Architecture & Codebase Tour

```
visa-vault/
├── app/
│   ├── layout.tsx                      # Root layout with navbar & privacy notice
│   ├── (user)/
│   │   ├── page.tsx                    # Home: visa wallet cards + alerts + trips
│   │   ├── trips/new/page.tsx          # New trip form with destination presets
│   │   ├── trips/[id]/page.tsx         # Verdict banner + checklist + action plan
│   │   ├── vault/page.tsx              # All documents, grouped, expiry badges
│   │   ├── vault/add/page.tsx          # Scan/upload + Gemini OCR + field editor
│   │   ├── vault/[docId]/page.tsx      # Document detail, versions, linked trips
│   │   ├── stay-tracker/page.tsx       # 90/180 rolling days gauge & timeline
│   │   └── share/[tripId]/page.tsx     # Consent + send to agency + tracking link
│   ├── track/[caseId]/page.tsx         # Applicant case status, WhatsApp requests
│   ├── (agency)/agency/
│   │   ├── login/page.tsx              # Password-protected agency login
│   │   ├── page.tsx                    # Live case inbox (auto-poll) + impact panel
│   │   └── cases/[id]/page.tsx         # Consular data sheet, copy/export, WhatsApp generator, covering letter & itinerary
│   ├── demo/page.tsx                   # Mobile QR code, sample docs, 1-click reset
│   └── api/
│       ├── extract/route.ts            # File/PDF -> structured JSON (Gemini or mock)
│       ├── documents/route.ts          # CRUD for vault documents + versioning
│       ├── trips/route.ts              # Trip creation & list
│       ├── trips/[id]/evaluate/route.ts# Run coverage + requirements
│       ├── share/route.ts              # Create case from trip with consent
│       ├── cases/route.ts              # Agency inbox list + time saved metrics
│       ├── cases/[id]/messages/route.ts# Bi-directional case messaging
│       └── demo/reset/route.ts         # 1-click database reset
├── lib/
│   ├── extract/                        # Multimodal prompts, parse & retry, mock DB
│   ├── visa/
│   │   ├── coverage.ts                 # COVERED / PARTIAL / NOT_COVERED engine
│   │   ├── entries.ts                  # Entries used vs allowed
│   │   ├── stayCounter.ts              # 90/180 rolling window stay algorithm
│   │   └── linkage.ts                  # Dual passport & visa linking
│   ├── rules/
│   │   ├── engine.ts                   # Deterministic requirements evaluator
│   │   ├── matching.ts                 # Fuzzy name & date consistency
│   │   └── destinations/               # schengen.json, uk.json, usa.json, japan.json
│   ├── readiness/build.ts              # Verdict + score + checklist + action plan
│   ├── reminders/expiry.ts             # Passport, visa & permit lead time alerts
│   ├── generate/                       # Consular covering letter & itinerary
│   ├── clock.ts                        # Centralized DEMO_TODAY clock
│   ├── db.ts                           # Prisma singleton client
│   └── config.ts                       # Assumptions for staff time saved
├── prisma/
│   ├── schema.prisma                   # Full SQLite schema
│   └── seed.ts                         # 3 demo moments & 5 agency cases
├── tests/                              # Vitest suite (16 unit tests)
├── public/samples/                     # Watermarked specimen mock documents
├── .env.example
└── README.md
```

---

## 🎯 The Three Seeded Demo Moments

The seeded data (`prisma/seed.ts`) configures traveler **Rohan Sharma** (`IND` citizen, `UAE` resident) with:
1. **Demo Moment 1: Fully Covered Trip (France, June 2026)**
   - **Verdict:** `READY` (Score: **100%**)
   - **Explanation:** Existing Schengen multiple-entry visa covers the travel dates, entries remaining, stay days fit well within the 90/180-day window, passport valid until 2028.
2. **Demo Moment 2: Visa Valid but Blocked (Spain, July–August 2026)**
   - **Verdict:** `BLOCKED` (Score: **55%**)
   - **Explanation:** Visa expires on `2026-07-15`, but trip returns `2026-08-30` (visa expires mid-trip). Furthermore, planned stay exceeds the 90-day rolling allowance.
3. **Demo Moment 3: New Application Required (Japan, October 2026)**
   - **Verdict:** `NOT_COVERED / NEEDS_ACTION` (Score: **73%**)
   - **Explanation:** No active Japanese visa. Displays full requirements checklist, flags missing flight/hotel vouchers, and generates an ordered action plan with deadlines.

---

## ⏱️ 90-Second Hackathon Demo Script

1. **Traveler Wallet (`/`):**  
   Show Rohan Sharma's wallet with active Schengen Visa (59 days left in window), UAE Residence Permit, and live expiry notifications (Passport expiring within 6 months).
2. **Trip Covered by Visa (`/trips/trip_demo_covered`):**  
   Click the France trip. Highlight the green **READY (100%)** banner, showing validity dates, entries, and action plan: *"Good to Go! Existing Visa Covers This Trip"*.
3. **Trip with Problems (`/trips/trip_demo_partial`):**  
   Click the Spain trip. Highlight the red **BLOCKED** banner: clearly pinpoints that the visa expires before the return date and stay limits would be breached.
4. **Trip with No Visa (`/trips/trip_demo_novisa`):**  
   Click the Japan trip. Highlight the requirements checklist showing missing accommodation and flight vouchers, plus the ordered action plan with target deadlines.
5. **Share with Agency with Consent (`/share/trip_demo_novisa`):**  
   Click *"Share with Agency"*. Show the document selector, review the pre-vetted issues that will be shared, check the required consent checkbox, and click Submit. Receive Case ID (e.g. `VV-2026-0048`).
6. **Agency Dashboard (`/agency`):**  
   Switch to the Agency Portal (credentials: `visa-vault-agent`). Show the case appearing live in the inbox! Open the case:
   - **Auto-Filled Data Sheet:** Show pre-extracted fields with 1-click copy per field, bulk copy, and CSV/JSON export (zero manual typing).
   - **Side-by-Side View:** Compare original scan vs extracted fields.
   - **Request Fixes:** Generate a WhatsApp-style message and post it directly to the applicant's tracking page.
   - **Impact Panel:** Point out the estimated **10.4 hours of staff time saved** ($418 labor savings).

---

## 🗺️ How to Add a Destination's Rules

To add a new country or consular jurisdiction (e.g., Canada, Australia, Singapore):
1. Create a JSON rule file in `lib/rules/destinations/<destination_id>.json`:
```json
{
  "destination": "Australia",
  "region": "AUSTRALIA",
  "lastReviewed": "2026-05-01",
  "sourceComment": "Based on Department of Home Affairs Subclass 600 Visitor Stream guidance.",
  "requiredDocumentTypes": [
    "PASSPORT",
    "BANK_STATEMENT",
    "EMPLOYMENT_LETTER"
  ],
  "requirements": [
    {
      "id": "REQ-AU-PASSPORT-VALIDITY",
      "documentType": "PASSPORT",
      "severity": "BLOCKER",
      "description": "Passport must be valid for intended period of stay.",
      "whyRequired": "Home Affairs regulation for visa grant.",
      "checkFn": "checkPassportValidityGeneral",
      "params": { "warnIfUnderMonths": 6 }
    }
  ]
}
```
2. Register the destination mapping in `lib/rules/engine.ts` inside `getDestinationRules`.
3. Add the country option to `APP_CONFIG.supportedDestinations` in `lib/config.ts`.
4. The engine automatically runs name fuzzy matching, date consistency checks, and document presence checks against that destination.

---

## 🔒 Privacy, Security & Honesty

- **Guidance, Not a Guarantee:** The app explicitly displays the notice: *"Documents are stored for this demo only. This is guidance, not a guarantee of visa approval. Always confirm requirements with the official embassy or consulate."*
- **No False Promises:** Words like *"guaranteed"* or *"will be approved"* are strictly prohibited.
- **Data Minimization & Masking:** Sensitive numbers (Passport, National ID) are masked in lists (`•••• 4321`) and never logged in console outputs.
- **Explicit Consent:** Case sharing requires affirmative applicant consent; consent timestamp and version (`v1.0`) are permanently recorded.
- **Right to Delete:** Applicants can click *"Delete My Case and Files"* on `/track/[caseId]` to delete all shared data pursuant to applicable privacy regulations.
- **Fictional Data Only:** All seed files and sample files in `/public/samples/` are watermarked with `SPECIMEN / SAMPLE` and use fictitious details.

---

## ⚠️ Known Limitations & What is Mocked / Simplified

For the purposes of this 12-hour hackathon build:
1. **Authentication:** The agency portal is protected by `AGENCY_PASSWORD` session verification. A production deployment requires enterprise SSO/SAML, multi-factor authentication (MFA), and role-based access control (RBAC).
2. **File Storage at Rest:** Uploaded files are stored locally in the git-ignored `data/uploads/` directory. Production requires encrypted object storage (e.g., AES-256 GCS / S3 buckets with signed expiring URLs).
3. **Database:** SQLite is used via Prisma for zero-config local portability. Production would use PostgreSQL or Google Cloud SQL with automated failover.
4. **Offline Fallback:** If `GEMINI_API_KEY` is not provided or `DEMO_MODE=true`, the system falls back to realistic mock extraction results keyed by filename or document category to guarantee a flawless live demo without API rate limit risks.
