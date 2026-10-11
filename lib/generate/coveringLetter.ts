import { getTodayString } from '../clock';

export interface CoveringLetterData {
  applicantName: string;
  passportNumber: string;
  nationality: string;
  residenceCountry: string;
  destination: string;
  consulateCity?: string;
  travelStartDate: string;
  travelEndDate: string;
  purpose: string;
  employer?: string;
  jobTitle?: string;
  hotelName?: string;
  flightRoute?: string;
}

export function generateCoveringLetter(data: CoveringLetterData): string {
  const today = getTodayString();
  const consulate = data.consulateCity || 'Dubai, United Arab Emirates';

  return `DATE: ${today}

TO:
The Visa Section / Consular Department
Embassy / Consulate General of ${data.destination}
${consulate}

SUBJECT: Application for a Short-Stay Schengen/Tourist Visa - ${data.applicantName.toUpperCase()} (Passport No: ${data.passportNumber})

Honorable Consular Officer,

I, ${data.applicantName}, a citizen of ${data.nationality} currently residing in ${data.residenceCountry}, respectfully submit my application for a short-stay visa to visit ${data.destination} from ${data.travelStartDate} to ${data.travelEndDate}.

1. PURPOSE OF VISIT:
The primary purpose of my visit is ${data.purpose.toLowerCase()}. I intend to explore historical cultural landmarks, architecture, and local arts during this approved annual vacation.

2. EMPLOYMENT & TIES TO COUNTRY OF RESIDENCE:
I am gainfully employed with ${data.employer || 'my employer'} in the role of ${data.jobTitle || 'Professional'}. My employer has sanctioned my official annual leave for the entire duration of the trip, as confirmed in the enclosed No Objection Certificate (NOC). I hold strong personal and economic ties to my country of residence and will promptly resume my professional duties upon return.

3. FINANCIAL SOLVENCY:
I will bear all expenses incurred during this trip, including flights, lodging, local transit, food, and miscellaneous costs. Enclosed is my bank statement for the last 3 months demonstrating consistent savings and regular salary deposits.

4. FLIGHTS & ACCOMMODATION:
- Roundtrip Flights: Confirmed flight bookings (${data.flightRoute || 'Direct roundtrip'}) departing on ${data.travelStartDate} and returning on ${data.travelEndDate}.
- Accommodation: Fully prepaid hotel reservation at ${data.hotelName || 'central accommodation'}.
- Travel Medical Insurance: A comprehensive Schengen-compliant travel insurance certificate with coverage exceeding €30,000 for emergency medical expenses and repatriation.

5. DECLARATION:
I guarantee that I will abide by all laws and immigration guidelines of ${data.destination}. I will exit the territory on or before ${data.travelEndDate}.

Thank you for your time and consideration of my visa application.

Sincerely,

______________________________
${data.applicantName}
Passport No: ${data.passportNumber}
Email: traveler@visavault.internal
`;
}
