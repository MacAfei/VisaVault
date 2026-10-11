/**
 * Utility to mask sensitive document numbers (Passport, Residence IDs)
 * showing only the last 4 characters.
 */
export function maskDocumentNumber(num?: string | null): string {
  if (!num) return '••••';
  const clean = String(num).trim();
  if (clean.length <= 4) {
    return '••••';
  }
  const last4 = clean.slice(-4);
  return `•••• ${last4}`;
}
