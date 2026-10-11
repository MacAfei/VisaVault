/**
 * Centralized Clock & Date Utilities
 * MANDATORY: All business logic, validity checks, stay calculations, and reminder logic
 * MUST use getToday() or getTodayString() from this module.
 * Never call `new Date()` directly in business logic!
 */

export function getToday(): Date {
  const override = (process.env.NEXT_PUBLIC_DEMO_TODAY || process.env.DEMO_TODAY || '2026-05-15').trim();
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    const [year, month, day] = override.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }
  return new Date(Date.UTC(2026, 4, 15, 12, 0, 0));
}

export function getTodayString(): string {
  const today = getToday();
  return today.toISOString().split('T')[0];
}

/**
 * Parses YYYY-MM-DD or standard ISO strings into a Date at UTC noon to avoid timezone shift issues
 */
export function parseDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getTime());
  }
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? getToday() : d;
}

export function formatDate(dateInput: string | Date): string {
  const d = parseDate(dateInput);
  return d.toISOString().split('T')[0];
}

/**
 * Returns difference in full days between start and end (end - start).
 * E.g., daysBetween("2026-05-10", "2026-05-15") === 5
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  const d1 = parseDate(start);
  const d2 = parseDate(end);
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Inclusive duration in days. E.g., 2026-05-10 to 2026-05-10 is 1 day.
 */
export function inclusiveDays(start: string | Date, end: string | Date): number {
  return daysBetween(start, end) + 1;
}

export function addDays(dateInput: string | Date, days: number): Date {
  const d = parseDate(dateInput);
  const result = new Date(d.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function addDaysString(dateInput: string | Date, days: number): string {
  return formatDate(addDays(dateInput, days));
}

export function addMonths(dateInput: string | Date, months: number): Date {
  const d = parseDate(dateInput);
  const result = new Date(d.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function addMonthsString(dateInput: string | Date, months: number): string {
  return formatDate(addMonths(dateInput, months));
}

export function isBefore(d1: string | Date, d2: string | Date): boolean {
  return parseDate(d1).getTime() < parseDate(d2).getTime();
}

export function isAfter(d1: string | Date, d2: string | Date): boolean {
  return parseDate(d1).getTime() > parseDate(d2).getTime();
}

export function isSameOrBefore(d1: string | Date, d2: string | Date): boolean {
  return parseDate(d1).getTime() <= parseDate(d2).getTime();
}

export function isSameOrAfter(d1: string | Date, d2: string | Date): boolean {
  return parseDate(d1).getTime() >= parseDate(d2).getTime();
}

export function isBetween(target: string | Date, start: string | Date, end: string | Date): boolean {
  const t = parseDate(target).getTime();
  const s = parseDate(start).getTime();
  const e = parseDate(end).getTime();
  return t >= s && t <= e;
}
