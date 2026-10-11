import { isSameOrAfter, isSameOrBefore } from '../clock';

export interface EntryCheckResult {
  allowed: number; // 1, 2, or 999 (unlimited)
  used: number;
  remaining: number;
  isExhausted: boolean;
  entriesType: 'SINGLE' | 'DOUBLE' | 'MULTIPLE';
}

export function calculateEntries(
  visa: {
    entries: string;
    validFrom: string;
    validUntil: string;
  },
  travelRecords: Array<{
    region: string;
    entryDate: string;
    exitDate?: string | null;
  }>
): EntryCheckResult {
  const normEntries = (visa.entries || 'SINGLE').toUpperCase();
  let allowed = 1;
  let entriesType: 'SINGLE' | 'DOUBLE' | 'MULTIPLE' = 'SINGLE';

  if (normEntries.includes('MULT')) {
    allowed = 999;
    entriesType = 'MULTIPLE';
  } else if (normEntries.includes('DOUB') || normEntries === '2') {
    allowed = 2;
    entriesType = 'DOUBLE';
  } else {
    allowed = 1;
    entriesType = 'SINGLE';
  }

  // Count past entries that fell within this visa's validity window
  const used = travelRecords.filter((rec) => {
    return (
      isSameOrAfter(rec.entryDate, visa.validFrom) &&
      isSameOrBefore(rec.entryDate, visa.validUntil)
    );
  }).length;

  const remaining = allowed === 999 ? 999 : Math.max(0, allowed - used);
  const isExhausted = allowed !== 999 && remaining <= 0;

  return {
    allowed,
    used,
    remaining,
    isExhausted,
    entriesType,
  };
}
