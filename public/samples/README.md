# VisaVault Fictional Sample Documents 📁🛡️

> **LEGAL NOTICE & DISCLAIMER:**  
> **All documents, names, numbers, institutions, employers, and addresses in this directory are 100% FICTIONAL and generated exclusively for software testing, OCR verification, and hackathon demonstrations.**  
> Every document carries a prominent, diagonal watermark across the entire page (**"SAMPLE - NOT A REAL DOCUMENT"**) and an official testing footer (**"Fictional demo data for software testing"**).  
> **NEVER ATTEMPT TO USE THESE DOCUMENTS FOR ANY REAL VISA APPLICATION, TRAVEL, OR IDENTIFICATION PURPOSE.**

---

## 📅 Dynamic Date Basis
- **Current BASE_DATE:** `2026-10-11`
- All dates (issuance, validity, statements, flight reservations, leave periods) are calculated relative to `BASE_DATE`.
- To regenerate with a different base date (e.g., today's date), run:
  ```bash
  python scripts/generate_samples.py --base-date YYYY-MM-DD
  ```

---

## 👥 The 4 Fictional Travelers & Test Scenarios

### 1. Aarav Example (`aarav-example/`)
- **Scenario:** Visa fully covers the trip (**"Good to go"**).
- **Nationality / Residence:** Fictional Sampleland resident in the UAE.
- **Dossier:** Passport (valid +6y), multiple-entry Schengen visa (valid -60d to +300d), UAE residence permit (+14m), travel insurance (€50k, covers full stay), flight booking (+30d to +40d), hotel voucher (+30d to +40d), bank statement (healthy closing balance of AED 42,500), employment NOC letter (-10d), photo silhouette.
- **Expected Outcome:** `READY` (Score: 100%). Existing visa covers trip; rolling 90/180 stay allowance satisfied (12 past + 10 planned = 22/90 days used); all documents consistent.

### 2. Meera Sample (`meera-sample/`)
- **Scenario:** Visa valid but problems (**"Partially covered"**).
- **Issues Flagged:**
  1. **Passport expires too soon:** Passport expires in 75 days, violating Schengen requirement of at least 3 months validity beyond intended return.
  2. **Stay allowance exceeded:** 78 days already spent in Schengen in the last 180 days; a 20-day trip (+20d to +40d) reaches 98 days, exceeding the 90-day rolling ceiling.
- **Files:** Includes phone-scanned passport copy (`passport.png`), visa, residence permit, insurance (€40k), flight, hotel, bank statement, employment letter, photo.
- **Expected Outcome:** `PARTIAL / BLOCKED`. Passport renewal required; trip duration must be reduced to avoid overstaying the 90/180 limit.

### 3. Rohan Demo (`rohan-demo/`)
- **Scenario:** No visa, missing documents (**"New application required"**).
- **Issues Flagged:**
  1. **No existing visa document in vault.**
  2. **Deliberately missing mandatory documents:** No travel insurance policy and no employer leave letter (NOC).
  3. **Stale bank statement:** Bank statement ends 55 days ago, violating the standard consular 30-day freshness rule.
- **Files:** Passport, residence permit, flight, hotel, stale bank statement, photo. (No visa, no insurance, no employment letter).
- **Expected Outcome:** `NEW APPLICATION REQUIRED`. Checklist indicates missing insurance, missing employment letter, and requests recent 30-day bank statement.

### 4. Sana Testcase (`sana-testcase/`)
- **Scenario:** Critical inconsistencies (**"Action required"**).
- **Issues Flagged:**
  1. **Spelling mismatch:** Hotel booking issued to `"SANNA TEST-CASE"` while passport is `"SANA TESTCASE"`.
  2. **Incomplete accommodation:** Flight returns on +47d, but hotel check-out is +44d (missing 3 nights of lodging).
  3. **Insufficient insurance:** Coverage is €20,000, failing the Schengen minimum statutory requirement of €30,000.
  4. **Insufficient funds:** Closing bank balance is only AED 450.00, below subsistence requirements.
- **Files:** Passport, residence permit, flight, hotel (phone scan with desk shadow), insurance, bank statement, employment letter, photo.
- **Expected Outcome:** `ACTION REQUIRED / CRITICAL INCONSISTENCIES`. Highlights spelling mismatch, 3-night hotel coverage gap, inadequate insurance coverage, and low bank funds.

---

## 🖼️ Contact Sheet Overview
A high-resolution contact sheet image showing all generated thumbnails side-by-side is located at:
`public/samples/overview.png`
