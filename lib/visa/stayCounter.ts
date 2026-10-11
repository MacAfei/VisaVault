import {
  parseDate,
  formatDate,
  addDaysString,
  getTodayString,
  isSameOrBefore,
  isBefore,
  inclusiveDays,
} from '../clock';

export interface StayRecord {
  region: string;
  entryDate: string;
  exitDate?: string | null;
}

export interface RollingWindowCheck {
  daysUsedAsOfDate: number; // In the window ending on checkDate
  daysRemainingAsOfDate: number; // Max allowed - daysUsedAsOfDate
  wouldExceedLimit: boolean;
  maxDaysReachedDuringTrip: number;
  firstExceededDate?: string;
  tripDurationDays?: number;
  pastTripsCount: number;
}

/**
 * Expand a list of travel records into a Set of individual stay dates ("YYYY-MM-DD")
 */
export function getStayDatesSet(
  records: StayRecord[],
  regionFilter?: string
): Set<string> {
  const stayDates = new Set<string>();

  for (const rec of records) {
    if (regionFilter && rec.region.toUpperCase() !== regionFilter.toUpperCase()) {
      continue;
    }

    const start = rec.entryDate;
    const end = rec.exitDate || getTodayString();

    let curr = start;
    while (isSameOrBefore(curr, end)) {
      stayDates.add(curr);
      curr = addDaysString(curr, 1);
    }
  }

  return stayDates;
}

/**
 * Counts how many days within [referenceDate - (windowDays - 1), referenceDate] are in the given date set.
 */
export function countDaysInWindow(
  dateSet: Set<string>,
  referenceDate: string,
  windowDays = 180
): number {
  let count = 0;
  const startWindow = addDaysString(referenceDate, -(windowDays - 1));

  let curr = startWindow;
  while (isSameOrBefore(curr, referenceDate)) {
    if (dateSet.has(curr)) {
      count++;
    }
    curr = addDaysString(curr, 1);
  }

  return count;
}

/**
 * Evaluates whether a planned trip respects rolling window limitations (e.g. 90/180 Schengen rule).
 */
export function calculateStay(options: {
  pastRecords: StayRecord[];
  region?: string;
  maxStayDays?: number; // e.g. 90
  stayWindowDays?: number | null; // e.g. 180 for rolling, null for fixed per-trip limit
  referenceDate?: string; // usually trip startDate or getTodayString()
  plannedTrip?: {
    startDate: string;
    endDate: string;
  };
}): RollingWindowCheck {
  const {
    pastRecords,
    region = 'SCHENGEN',
    maxStayDays = 90,
    stayWindowDays = 180,
    referenceDate = getTodayString(),
    plannedTrip,
  } = options;

  const pastStayDates = getStayDatesSet(pastRecords, region);

  // 1. Current days used as of referenceDate
  const windowDays = stayWindowDays || 180;
  const daysUsedAsOfDate = countDaysInWindow(pastStayDates, referenceDate, windowDays);
  const daysRemainingAsOfDate = Math.max(0, maxStayDays - daysUsedAsOfDate);

  if (!plannedTrip) {
    return {
      daysUsedAsOfDate,
      daysRemainingAsOfDate,
      wouldExceedLimit: daysUsedAsOfDate > maxStayDays,
      maxDaysReachedDuringTrip: daysUsedAsOfDate,
      pastTripsCount: pastRecords.length,
    };
  }

  // 2. Evaluate planned trip
  const tripDuration = inclusiveDays(plannedTrip.startDate, plannedTrip.endDate);

  // If there is NO rolling window (e.g. Japan or UK single visit limit), simple duration check
  if (!stayWindowDays) {
    const wouldExceed = tripDuration > maxStayDays;
    return {
      daysUsedAsOfDate,
      daysRemainingAsOfDate,
      wouldExceedLimit: wouldExceed,
      maxDaysReachedDuringTrip: tripDuration,
      firstExceededDate: wouldExceed ? addDaysString(plannedTrip.startDate, maxStayDays) : undefined,
      tripDurationDays: tripDuration,
      pastTripsCount: pastRecords.length,
    };
  }

  // Rolling window simulation: simulate day by day of the planned trip
  const combinedStayDates = new Set(pastStayDates);
  let maxUsage = 0;
  let firstExceeded: string | undefined = undefined;

  let currentTripDate = plannedTrip.startDate;
  while (isSameOrBefore(currentTripDate, plannedTrip.endDate)) {
    combinedStayDates.add(currentTripDate);
    const usageOnDay = countDaysInWindow(combinedStayDates, currentTripDate, windowDays);

    if (usageOnDay > maxUsage) {
      maxUsage = usageOnDay;
    }

    if (usageOnDay > maxStayDays && !firstExceeded) {
      firstExceeded = currentTripDate;
    }

    currentTripDate = addDaysString(currentTripDate, 1);
  }

  return {
    daysUsedAsOfDate,
    daysRemainingAsOfDate,
    wouldExceedLimit: maxUsage > maxStayDays,
    maxDaysReachedDuringTrip: maxUsage,
    firstExceededDate: firstExceeded,
    tripDurationDays: tripDuration,
    pastTripsCount: pastRecords.length,
  };
}
