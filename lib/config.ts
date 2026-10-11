/**
 * VisaVault Configuration & Impact Assumptions
 */

export const APP_CONFIG = {
  appName: 'VisaVault',
  agencyName: 'GlobalPass Visa Services',
  consentVersion: 'v1.0',
  consentText:
    'I consent to share these selected documents and extracted details with GlobalPass Visa Services for visa readiness assistance, application pre-vetting, and verification.',
  disclaimer:
    'Documents are stored for this demo only. This is guidance, not a guarantee of visa approval. Always confirm requirements with the official embassy or consulate.',
  supportedDestinations: [
    { code: 'FR', name: 'France', region: 'SCHENGEN' },
    { code: 'DE', name: 'Germany', region: 'SCHENGEN' },
    { code: 'IT', name: 'Italy', region: 'SCHENGEN' },
    { code: 'ES', name: 'Spain', region: 'SCHENGEN' },
    { code: 'GB', name: 'United Kingdom', region: 'UK' },
    { code: 'US', name: 'United States', region: 'USA' },
    { code: 'JP', name: 'Japan', region: 'JAPAN' },
  ],
};

// Configurable expiry lead times in days for alerts
export const EXPIRY_LEAD_TIMES = {
  PASSPORT: 180, // 6 months alert
  VISA: 30, // 1 month alert
  RESIDENCE_PERMIT: 60, // 2 months alert
};

// Document weights for readiness scoring (Total sum = 100)
export const DOCUMENT_WEIGHTS: Record<string, number> = {
  PASSPORT: 30,
  FLIGHT_BOOKING: 15,
  HOTEL_BOOKING: 15,
  INSURANCE: 15,
  BANK_STATEMENT: 15,
  EMPLOYMENT_LETTER: 10,
};

// Staff time saved assumptions (Clearly marked as estimates)
export const IMPACT_CONFIG = {
  minutesSavedPerDocument: 12, // Typing, manual sanity verification, file parsing
  minutesSavedPerBlockerFound: 25, // Preventing consulate rejection, client back-and-forth
  minutesSavedPerCaseBase: 15, // Intake form setup, dossier organization
  hourlyRateUsd: 40, // Estimated agency staff hourly wage
};
