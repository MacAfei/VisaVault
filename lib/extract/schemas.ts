import { z } from 'zod';

export const PassportSchema = z.object({
  fullName: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(), // YYYY-MM-DD
  issueDate: z.string().nullable().optional(), // YYYY-MM-DD
  expiryDate: z.string().nullable().optional(), // YYYY-MM-DD
  issuingCountry: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const VisaSchema = z.object({
  holderName: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  region: z.string().nullable().optional(), // e.g. SCHENGEN, UK, USA, JAPAN
  visaType: z.string().nullable().optional(), // TOURIST, BUSINESS, TRANSIT
  entries: z.enum(['SINGLE', 'DOUBLE', 'MULTIPLE', 'MULT']).or(z.string()).nullable().optional(),
  validFrom: z.string().nullable().optional(), // YYYY-MM-DD
  validUntil: z.string().nullable().optional(), // YYYY-MM-DD
  maxStayDays: z.number().or(z.string().transform((v) => parseInt(v, 10))).nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const ResidencePermitSchema = z.object({
  holderName: z.string().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  issuingCountry: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(), // YYYY-MM-DD
  sponsorOrEmployer: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const BankStatementSchema = z.object({
  accountHolderName: z.string().nullable().optional(),
  periodStart: z.string().nullable().optional(), // YYYY-MM-DD
  periodEnd: z.string().nullable().optional(), // YYYY-MM-DD
  closingBalance: z.number().or(z.string().transform((v) => parseFloat(v.replace(/[^0-9.-]/g, '')))).nullable().optional(),
  currency: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const InsuranceSchema = z.object({
  holderName: z.string().nullable().optional(),
  coverageAmount: z.number().or(z.string().transform((v) => parseFloat(v.replace(/[^0-9.-]/g, '')))).nullable().optional(),
  currency: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(), // YYYY-MM-DD
  endDate: z.string().nullable().optional(), // YYYY-MM-DD
  coveredRegions: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const EmploymentLetterSchema = z.object({
  employeeName: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  issueDate: z.string().nullable().optional(), // YYYY-MM-DD
  leaveStart: z.string().nullable().optional(), // YYYY-MM-DD
  leaveEnd: z.string().nullable().optional(), // YYYY-MM-DD
  confidenceNotes: z.string().nullable().optional(),
});

export const FlightBookingSchema = z.object({
  passengerName: z.string().nullable().optional(),
  departureDate: z.string().nullable().optional(), // YYYY-MM-DD
  returnDate: z.string().nullable().optional(), // YYYY-MM-DD
  route: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const HotelBookingSchema = z.object({
  guestName: z.string().nullable().optional(),
  checkIn: z.string().nullable().optional(), // YYYY-MM-DD
  checkOut: z.string().nullable().optional(), // YYYY-MM-DD
  city: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const PhotoSchema = z.object({
  qualityNotes: z.string().nullable().optional(),
  faceVisible: z.boolean().nullable().optional(),
  plainBackground: z.boolean().nullable().optional(),
  glareOrBlur: z.boolean().nullable().optional(),
  looksRecent: z.boolean().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const ApplicationReceiptSchema = z.object({
  country: z.string().nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
  date: z.string().nullable().optional(), // YYYY-MM-DD
  outcome: z.string().nullable().optional(),
  confidenceNotes: z.string().nullable().optional(),
});

export const DocumentSchemas: Record<string, z.ZodType<any>> = {
  PASSPORT: PassportSchema,
  VISA: VisaSchema,
  RESIDENCE_PERMIT: ResidencePermitSchema,
  BANK_STATEMENT: BankStatementSchema,
  INSURANCE: InsuranceSchema,
  EMPLOYMENT_LETTER: EmploymentLetterSchema,
  FLIGHT_BOOKING: FlightBookingSchema,
  HOTEL_BOOKING: HotelBookingSchema,
  PHOTO: PhotoSchema,
  APPLICATION_RECEIPT: ApplicationReceiptSchema,
  REJECTION_LETTER: ApplicationReceiptSchema,
};
