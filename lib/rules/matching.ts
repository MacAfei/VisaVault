import { parseDate, isBefore, isAfter, daysBetween } from '../clock';

/**
 * Normalizes a full name into a cleaned set of name tokens,
 * stripping titles and punctuation.
 */
export function tokenizeName(name: string): string[] {
  if (!name) return [];
  const clean = name
    .toLowerCase()
    .replace(/[,\/.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const ignoredTitles = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'master']);
  return clean.split(' ').filter((t) => t.length > 0 && !ignoredTitles.has(t));
}

/**
 * Fuzzy name matcher that tolerates word order variation (Surname First vs Given First),
 * middle name omission, and case differences, but strictly flags genuine mismatches.
 */
export function isFuzzyNameMatch(nameA: string, nameB: string): boolean {
  const tokensA = tokenizeName(nameA);
  const tokensB = tokenizeName(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return true;

  // Exact match
  if (tokensA.join(' ') === tokensB.join(' ')) return true;

  // Count common tokens
  const setB = new Set(tokensB);
  const common = tokensA.filter((t) => setB.has(t));

  // If one name is short (e.g. 2 words) and both are in the longer name, it's a match
  const minLen = Math.min(tokensA.length, tokensB.length);
  if (common.length >= minLen && minLen >= 2) {
    return true;
  }

  // Jaccard similarity threshold for longer compound names
  const totalUnique = new Set([...tokensA, ...tokensB]).size;
  const similarity = common.length / totalUnique;
  return similarity >= 0.5;
}

export interface NameCheckResult {
  isConsistent: boolean;
  baselineName: string;
  mismatches: Array<{
    documentType: string;
    extractedName: string;
    baselineName: string;
  }>;
}

export function verifyNameConsistency(
  baselineName: string,
  documents: Array<{ type: string; extractedData: any }>
): NameCheckResult {
  const mismatches: NameCheckResult['mismatches'] = [];

  for (const doc of documents) {
    const data =
      typeof doc.extractedData === 'string'
        ? JSON.parse(doc.extractedData || '{}')
        : doc.extractedData || {};

    const extractedName =
      data.fullName ||
      data.holderName ||
      data.passengerName ||
      data.guestName ||
      data.accountHolderName ||
      data.employeeName;

    if (extractedName && typeof extractedName === 'string') {
      const match = isFuzzyNameMatch(baselineName, extractedName);
      if (!match) {
        mismatches.push({
          documentType: doc.type,
          extractedName,
          baselineName,
        });
      }
    }
  }

  return {
    isConsistent: mismatches.length === 0,
    baselineName,
    mismatches,
  };
}

export interface DateCheckResult {
  isConsistent: boolean;
  issues: Array<{
    documentType: string;
    message: string;
  }>;
}

export function verifyDateConsistency(
  trip: { startDate: string; endDate: string },
  documents: Array<{ type: string; extractedData: any }>
): DateCheckResult {
  const issues: DateCheckResult['issues'] = [];

  for (const doc of documents) {
    const data =
      typeof doc.extractedData === 'string'
        ? JSON.parse(doc.extractedData || '{}')
        : doc.extractedData || {};

    // 1. Flight booking
    if (doc.type === 'FLIGHT_BOOKING') {
      if (data.departureDate && data.departureDate !== trip.startDate) {
        issues.push({
          documentType: doc.type,
          message: `Flight outbound departure (${data.departureDate}) does not match declared trip start (${trip.startDate}).`,
        });
      }
      if (data.returnDate && data.returnDate !== trip.endDate) {
        issues.push({
          documentType: doc.type,
          message: `Flight return date (${data.returnDate}) does not match declared trip return (${trip.endDate}).`,
        });
      }
    }

    // 2. Hotel booking
    if (doc.type === 'HOTEL_BOOKING') {
      if (data.checkIn && data.checkIn !== trip.startDate) {
        issues.push({
          documentType: doc.type,
          message: `Hotel check-in date (${data.checkIn}) does not match trip arrival (${trip.startDate}).`,
        });
      }
      if (data.checkOut && data.checkOut !== trip.endDate) {
        issues.push({
          documentType: doc.type,
          message: `Hotel check-out date (${data.checkOut}) does not match trip departure (${trip.endDate}).`,
        });
      }
    }

    // 3. Insurance coverage
    if (doc.type === 'INSURANCE') {
      if (data.startDate && isAfter(data.startDate, trip.startDate)) {
        issues.push({
          documentType: doc.type,
          message: `Insurance policy starts on ${data.startDate}, after your trip begins on ${trip.startDate}.`,
        });
      }
      if (data.endDate && isBefore(data.endDate, trip.endDate)) {
        issues.push({
          documentType: doc.type,
          message: `Insurance policy expires on ${data.endDate}, before your trip ends on ${trip.endDate}.`,
        });
      }
    }
  }

  return {
    isConsistent: issues.length === 0,
    issues,
  };
}
