import fs from 'fs';
import path from 'path';

export interface MockResult {
  docType: string;
  data: Record<string, any>;
  confidenceNotes: string;
}

// Load dynamic manifest if available
let manifestCache: any = null;
function getManifest(): any {
  if (manifestCache) return manifestCache;
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'samples', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      manifestCache = JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return manifestCache;
}

export const MOCK_DATABASE: Record<string, MockResult> = {
  // Keyed by file name patterns
  sample_passport: {
    docType: 'PASSPORT',
    data: {
      fullName: 'ROHAN ARJUN SHARMA',
      passportNumber: 'A87654321',
      nationality: 'IND',
      dateOfBirth: '1992-08-14',
      issueDate: '2018-01-10',
      expiryDate: '2028-01-09',
      issuingCountry: 'IND',
      confidenceNotes: 'MRZ verified. Clear scan, all biographical fields high confidence.',
    },
    confidenceNotes: 'High clarity document. ICAO MRZ checksum verified.',
  },
  sample_visa: {
    docType: 'VISA',
    data: {
      holderName: 'ROHAN ARJUN SHARMA',
      passportNumber: 'A87654321',
      country: 'France',
      region: 'SCHENGEN',
      visaType: 'C (TOURISM)',
      entries: 'MULTIPLE',
      validFrom: '2026-01-15',
      validUntil: '2027-07-15',
      maxStayDays: 90,
      referenceNumber: 'FR098765432',
      confidenceNotes: 'Schengen sticker format detected. 90-day multiple-entry tourist visa.',
    },
    confidenceNotes: 'Clear consular sticker with machine-readable lines.',
  },
  sample_residence_permit: {
    docType: 'RESIDENCE_PERMIT',
    data: {
      holderName: 'ROHAN ARJUN SHARMA',
      idNumber: '784-1992-1234567-1',
      issuingCountry: 'UAE',
      expiryDate: '2027-10-30',
      sponsorOrEmployer: 'CLOUDTECH MIDDLE EAST FZ-LLC',
      confidenceNotes: 'UAE Emirates ID smart card recognized. Valid resident.',
    },
    confidenceNotes: 'Valid residence permit valid through late 2027.',
  },
  sample_bank_statement: {
    docType: 'BANK_STATEMENT',
    data: {
      accountHolderName: 'ROHAN ARJUN SHARMA',
      periodStart: '2026-02-01',
      periodEnd: '2026-05-01',
      closingBalance: 68450.0,
      currency: 'AED',
      confidenceNotes: 'Full 3-month statement with regular salary credits and official bank seal.',
    },
    confidenceNotes: '3 months full statement with closing balance AED 68,450 (~EUR 17,200).',
  },
  sample_insurance: {
    docType: 'INSURANCE',
    data: {
      holderName: 'ROHAN ARJUN SHARMA',
      coverageAmount: 50000.0,
      currency: 'EUR',
      startDate: '2026-06-01',
      endDate: '2027-06-20',
      coveredRegions: 'All Schengen States & EU',
      confidenceNotes: 'Allianz Schengen Travel Certificate. Exceeds standard EUR 30k medical requirement.',
    },
    confidenceNotes: 'Compliant with Article 15 of Schengen Visa Code (EUR 50k coverage, medical repatriation).',
  },
  sample_flight: {
    docType: 'FLIGHT_BOOKING',
    data: {
      passengerName: 'ROHAN ARJUN SHARMA',
      departureDate: '2026-06-01',
      returnDate: '2026-06-15',
      route: 'DXB to CDG (Roundtrip)',
      confidenceNotes: 'AeroVoyage confirmed e-ticket PNR AV-78901.',
    },
    confidenceNotes: 'Confirmed roundtrip flights matching planned travel window.',
  },
  sample_hotel: {
    docType: 'HOTEL_BOOKING',
    data: {
      guestName: 'ROHAN ARJUN SHARMA',
      checkIn: '2026-06-01',
      checkOut: '2026-06-15',
      city: 'Paris',
      confidenceNotes: 'Le Grand Hotel Opera voucher confirmed and prepaid for 14 nights.',
    },
    confidenceNotes: 'Full duration Paris accommodation voucher confirmed.',
  },
  sample_employment_letter: {
    docType: 'EMPLOYMENT_LETTER',
    data: {
      employeeName: 'ROHAN ARJUN SHARMA',
      employer: 'CLOUDTECH MIDDLE EAST FZ-LLC',
      position: 'Senior Solutions Architect',
      issueDate: '2026-05-02',
      leaveStart: '2026-06-01',
      leaveEnd: '2026-06-15',
      confidenceNotes: 'Official employer NOC with salary, approved leave dates, and HR seal.',
    },
    confidenceNotes: 'Recent NOC dated May 2026 confirming approved leave.',
  },
  sample_photo: {
    docType: 'PHOTO',
    data: {
      qualityNotes: 'ICAO biometric compliant photo. Plain off-white background, neutral expression.',
      faceVisible: true,
      plainBackground: true,
      glareOrBlur: false,
      looksRecent: true,
      confidenceNotes: 'Passes biometric facial geometry pre-check.',
    },
    confidenceNotes: 'Compliant biometric passport photo.',
  },
};

/**
 * Fallback generator for arbitrary uploads in mock mode based on requested or guessed type
 */
export function getMockExtraction(fileName: string, requestedDocType?: string): MockResult {
  const lowerName = fileName.toLowerCase();
  const manifest = getManifest();

  // 1. Check if fileName matches any specific sample file or traveler from manifest.json
  if (manifest && Array.isArray(manifest.documents)) {
    // Look for exact match by filename or path substring
    for (const doc of manifest.documents) {
      const docFileName = (doc.fileName || '').toLowerCase();
      const personSlug = (doc.personSlug || '').toLowerCase();
      const docType = (doc.documentType || '').toUpperCase();

      if (
        (lowerName.includes(personSlug) && (lowerName.includes(docFileName) || (requestedDocType && docType === requestedDocType.toUpperCase()))) ||
        lowerName === docFileName ||
        lowerName.endsWith(`_${docFileName}`)
      ) {
        return {
          docType: doc.documentType,
          data: doc.extracted || {},
          confidenceNotes: `Extracted from manifest for ${doc.person} (${doc.fileName}).`,
        };
      }
    }

    // Look for traveler slug match
    for (const t of manifest.travelers || []) {
      const slug = (t.slug || '').toLowerCase();
      const firstName = slug.split('-')[0];
      if (lowerName.includes(slug) || lowerName.includes(firstName)) {
        const match = (t.documents || []).find((d: any) =>
          (requestedDocType && d.documentType === requestedDocType.toUpperCase()) ||
          lowerName.includes((d.documentType || '').toLowerCase()) ||
          lowerName.includes((d.fileName || '').toLowerCase())
        );
        if (match) {
          return {
            docType: match.documentType,
            data: match.extracted || {},
            confidenceNotes: `Extracted from manifest for ${t.name} (${match.fileName}).`,
          };
        }
      }
    }
  }

  // 2. Check internal MOCK_DATABASE by filename keywords
  for (const [key, mock] of Object.entries(MOCK_DATABASE)) {
    const rawKey = key.replace('sample_', '');
    if (lowerName.includes(rawKey) || lowerName.includes(key)) {
      return mock;
    }
  }

  // 3. Fallback by document type
  const targetType = (requestedDocType || 'PASSPORT').toUpperCase();
  const matchedKey = Object.keys(MOCK_DATABASE).find((k) => MOCK_DATABASE[k].docType === targetType);
  if (matchedKey) {
    return MOCK_DATABASE[matchedKey];
  }

  return MOCK_DATABASE['sample_passport'];
}
