import { getTodayString, daysBetween, isBefore } from '../clock';
import { EXPIRY_LEAD_TIMES } from '../config';

export interface ExpiryAlert {
  id: string;
  documentType: 'PASSPORT' | 'VISA' | 'RESIDENCE_PERMIT';
  documentId: string;
  title: string;
  expiryDate: string;
  daysRemaining: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  suggestedAction: string;
}

export function getExpiryAlerts(vault: {
  documents: Array<{
    id: string;
    type: string;
    extractedData: string | Record<string, any>;
    supersededById?: string | null;
  }>;
  visas: Array<{
    id: string;
    documentId: string;
    country: string;
    validUntil: string;
    status: string;
  }>;
}): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];
  const todayStr = getTodayString();

  const getDocData = (doc: any) => {
    return typeof doc.extractedData === 'string'
      ? JSON.parse(doc.extractedData || '{}')
      : doc.extractedData || {};
  };

  // 1. Passports
  const passports = vault.documents.filter(
    (d) => d.type === 'PASSPORT' && !d.supersededById
  );

  for (const p of passports) {
    const data = getDocData(p);
    if (data.expiryDate) {
      const days = daysBetween(todayStr, data.expiryDate);
      if (days <= EXPIRY_LEAD_TIMES.PASSPORT) {
        const isExpired = days <= 0;
        alerts.push({
          id: `ALERT-PASS-${p.id}`,
          documentType: 'PASSPORT',
          documentId: p.id,
          title: isExpired ? 'Passport Has Expired' : 'Passport Expiring Soon',
          expiryDate: data.expiryDate,
          daysRemaining: days,
          severity: isExpired ? 'CRITICAL' : days <= 90 ? 'CRITICAL' : 'WARNING',
          message: isExpired
            ? `Your passport expired on ${data.expiryDate}. All international travel is blocked.`
            : `Your passport expires in ${days} days (${data.expiryDate}). Most countries require at least 6 months validity.`,
          suggestedAction: 'Apply for a passport renewal immediately.',
        });
      }
    }
  }

  // 2. Visas
  for (const v of vault.visas) {
    if (v.validUntil) {
      const days = daysBetween(todayStr, v.validUntil);
      if (days <= EXPIRY_LEAD_TIMES.VISA) {
        const isExpired = days <= 0;
        alerts.push({
          id: `ALERT-VISA-${v.id}`,
          documentType: 'VISA',
          documentId: v.documentId,
          title: isExpired ? `Visa for ${v.country} Has Expired` : `Visa for ${v.country} Expiring Soon`,
          expiryDate: v.validUntil,
          daysRemaining: days,
          severity: isExpired ? 'WARNING' : 'INFO',
          message: isExpired
            ? `Your ${v.country} visa expired on ${v.validUntil}.`
            : `Your ${v.country} visa expires in ${days} days (${v.validUntil}).`,
          suggestedAction: isExpired ? 'Archive or re-apply if future travel is planned.' : 'Plan any final entry before expiry.',
        });
      }
    }
  }

  // 3. Residence Permits
  const permits = vault.documents.filter(
    (d) => d.type === 'RESIDENCE_PERMIT' && !d.supersededById
  );

  for (const rp of permits) {
    const data = getDocData(rp);
    if (data.expiryDate) {
      const days = daysBetween(todayStr, data.expiryDate);
      if (days <= EXPIRY_LEAD_TIMES.RESIDENCE_PERMIT) {
        const isExpired = days <= 0;
        alerts.push({
          id: `ALERT-RP-${rp.id}`,
          documentType: 'RESIDENCE_PERMIT',
          documentId: rp.id,
          title: isExpired ? 'Residence Permit Expired' : 'Residence Permit Expiring Soon',
          expiryDate: data.expiryDate,
          daysRemaining: days,
          severity: isExpired ? 'CRITICAL' : 'WARNING',
          message: isExpired
            ? `Your residence permit expired on ${data.expiryDate}.`
            : `Your residence permit expires in ${days} days (${data.expiryDate}).`,
          suggestedAction: 'Contact your employer or immigration sponsor for visa renewal.',
        });
      }
    }
  }

  // Sort by daysRemaining ascending (most urgent first)
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
