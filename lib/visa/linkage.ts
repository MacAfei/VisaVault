export interface PassportLinkageResult {
  linkedPassportDoc?: any;
  currentPassportDoc?: any;
  isLinkedToCurrentPassport: boolean;
  mustCarryBothPassports: boolean;
  passportNumberUsed: string;
}

export function checkPassportLinkage(
  visa: {
    passportDocumentId?: string | null;
    extractedData?: any;
  },
  documents: Array<{
    id: string;
    type: string;
    extractedData: string | Record<string, any>;
    supersededById?: string | null;
  }>
): PassportLinkageResult {
  const passportDocs = documents.filter((d) => d.type === 'PASSPORT');

  // Find the active (not superseded) passport
  const currentPassport = passportDocs.find((d) => !d.supersededById) || passportDocs[0];

  let linkedPassport: any = undefined;
  if (visa.passportDocumentId) {
    linkedPassport = passportDocs.find((d) => d.id === visa.passportDocumentId);
  }

  // If not linked by ID, attempt matching by passportNumber in extracted data
  const visaData =
    typeof visa.extractedData === 'string'
      ? JSON.parse(visa.extractedData || '{}')
      : visa.extractedData || {};

  const visaPassportNum = visaData.passportNumber?.trim()?.toUpperCase() || '';

  if (!linkedPassport && visaPassportNum) {
    linkedPassport = passportDocs.find((d) => {
      const pData =
        typeof d.extractedData === 'string'
          ? JSON.parse(d.extractedData || '{}')
          : d.extractedData || {};
      return pData.passportNumber?.trim()?.toUpperCase() === visaPassportNum;
    });
  }

  const currentPassportData = currentPassport
    ? typeof currentPassport.extractedData === 'string'
      ? JSON.parse(currentPassport.extractedData || '{}')
      : currentPassport.extractedData || {}
    : {};

  const currentPassportNum = currentPassportData.passportNumber?.trim()?.toUpperCase() || '';

  const isLinkedToCurrentPassport =
    !!currentPassport &&
    (!linkedPassport ||
      linkedPassport.id === currentPassport.id ||
      (!!visaPassportNum && visaPassportNum === currentPassportNum));

  const mustCarryBothPassports = !isLinkedToCurrentPassport && !!linkedPassport;

  return {
    linkedPassportDoc: linkedPassport,
    currentPassportDoc: currentPassport,
    isLinkedToCurrentPassport,
    mustCarryBothPassports,
    passportNumberUsed: visaPassportNum || currentPassportNum || 'Unknown',
  };
}
