export function getExtractionPrompt(docType: string): string {
  const commonInstructions = `
CRITICAL: Return ONLY a valid JSON object. Do NOT wrap in markdown \`\`\`json code blocks. Do NOT include greetings, commentary, or conversational text.
If any field cannot be read or is missing from the document, set its value to null.
Include a "confidenceNotes" field describing extraction clarity, any ambiguity, or blurry text.
Normalize dates to ISO "YYYY-MM-DD" format where possible.
`;

  switch (docType) {
    case 'PASSPORT':
      return `${commonInstructions}
Extract these exact fields for a PASSPORT:
{
  "fullName": "Full legal name as printed on passport",
  "passportNumber": "Alphanumeric passport number",
  "nationality": "3-letter country code or country name",
  "dateOfBirth": "YYYY-MM-DD",
  "issueDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "issuingCountry": "Issuing state or country code",
  "confidenceNotes": "Notes on readability or MRZ check"
}`;

    case 'VISA':
      return `${commonInstructions}
Extract these exact fields for an ISSUED VISA / STICKER:
{
  "holderName": "Full name of visa holder",
  "passportNumber": "Passport number linked on visa",
  "country": "Country granting the visa (e.g. France, United States)",
  "region": "Jurisdiction or region (SCHENGEN, UK, USA, JAPAN, etc.)",
  "visaType": "Type of visa (TOURIST, BUSINESS, C, B1/B2, etc.)",
  "entries": "SINGLE, DOUBLE, or MULTIPLE",
  "validFrom": "YYYY-MM-DD",
  "validUntil": "YYYY-MM-DD",
  "maxStayDays": 90,
  "referenceNumber": "Visa or sticker reference number",
  "confidenceNotes": "Notes on dates and validity limits"
}`;

    case 'RESIDENCE_PERMIT':
      return `${commonInstructions}
Extract these exact fields for a RESIDENCE PERMIT / ID CARD:
{
  "holderName": "Name of permit holder",
  "idNumber": "National ID or permit number",
  "issuingCountry": "Country of residence (e.g. UAE, UK)",
  "expiryDate": "YYYY-MM-DD",
  "sponsorOrEmployer": "Sponsor, employer, or company name",
  "confidenceNotes": "Notes on validity"
}`;

    case 'BANK_STATEMENT':
      return `${commonInstructions}
Extract these exact fields for a BANK STATEMENT:
{
  "accountHolderName": "Name on the account",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "closingBalance": 68450.00,
  "currency": "Currency code (e.g. AED, USD, EUR, GBP)",
  "confidenceNotes": "Notes on stamped seal, period range, and closing balance"
}`;

    case 'INSURANCE':
      return `${commonInstructions}
Extract these exact fields for a TRAVEL MEDICAL INSURANCE CERTIFICATE:
{
  "holderName": "Insured person's full name",
  "coverageAmount": 50000,
  "currency": "EUR, USD, etc.",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "coveredRegions": "e.g. Schengen States, Worldwide, EU",
  "confidenceNotes": "Notes on minimum €30k coverage compliance and emergency evacuation"
}`;

    case 'EMPLOYMENT_LETTER':
      return `${commonInstructions}
Extract these exact fields for an EMPLOYMENT / NOC LETTER:
{
  "employeeName": "Employee full name",
  "employer": "Company name",
  "position": "Job title",
  "issueDate": "YYYY-MM-DD",
  "leaveStart": "YYYY-MM-DD",
  "leaveEnd": "YYYY-MM-DD",
  "confidenceNotes": "Notes on letterhead, official signature, and leave approval"
}`;

    case 'FLIGHT_BOOKING':
      return `${commonInstructions}
Extract these exact fields for a FLIGHT BOOKING / E-TICKET:
{
  "passengerName": "Passenger name",
  "departureDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD",
  "route": "e.g. DXB to CDG roundtrip",
  "confidenceNotes": "Notes on confirmed PNR status"
}`;

    case 'HOTEL_BOOKING':
      return `${commonInstructions}
Extract these exact fields for a HOTEL RESERVATION / VOUCHER:
{
  "guestName": "Primary guest name",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "city": "City name (e.g. Paris)",
  "confidenceNotes": "Notes on prepaid voucher and guest matching"
}`;

    case 'PHOTO':
      return `${commonInstructions}
Extract these exact fields for a PASSPORT PHOTO:
{
  "qualityNotes": "Summary of photo suitability for visa application",
  "faceVisible": true,
  "plainBackground": true,
  "glareOrBlur": false,
  "looksRecent": true,
  "confidenceNotes": "Compliance with ICAO 35x45mm biometric specs"
}`;

    case 'APPLICATION_RECEIPT':
    case 'REJECTION_LETTER':
      return `${commonInstructions}
Extract these exact fields for a VISA APPLICATION RECEIPT or OUTCOME LETTER:
{
  "country": "Embassy/Consulate country",
  "referenceNumber": "File/tracking number",
  "date": "YYYY-MM-DD",
  "outcome": "Status or outcome (PENDING, APPROVED, REFUSED)",
  "confidenceNotes": "Details on reasons or submission date"
}`;

    default:
      return `${commonInstructions}
Extract all identifying fields as a clean JSON object with keys: "holderName", "documentNumber", "issueDate", "expiryDate", "issuingEntity", "confidenceNotes".`;
  }
}
