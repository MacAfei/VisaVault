import { PrismaClient } from '@prisma/client';
import { buildReadinessAssessment } from '../lib/readiness/build';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding VisaVault Database ---');

  // Clear existing data cleanly in foreign-key dependency order
  await prisma.caseStatusHistory.deleteMany();
  await prisma.caseMessage.deleteMany();
  await prisma.caseIssue.deleteMany();
  await prisma.case.deleteMany();
  await prisma.readinessResult.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.travelRecord.deleteMany();
  await prisma.visa.deleteMany();
  await prisma.document.deleteMany();
  await prisma.traveler.deleteMany();
  await prisma.user.deleteMany();

  // 1. Primary User & Traveler
  const user = await prisma.user.create({
    data: {
      id: 'user_rohan',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      role: 'traveler',
    },
  });

  const traveler = await prisma.traveler.create({
    data: {
      id: 'trav_rohan',
      userId: user.id,
      fullName: 'Rohan Arjun Sharma',
      dateOfBirth: '1992-08-14',
      nationality: 'IND',
      countryOfResidence: 'UAE',
    },
  });

  // Additional demo travelers for agency cases
  const userElena = await prisma.user.create({
    data: { id: 'user_elena', name: 'Elena Rostova', email: 'elena@example.com' },
  });
  const travElena = await prisma.traveler.create({
    data: {
      id: 'trav_elena',
      userId: userElena.id,
      fullName: 'Elena Rostova',
      dateOfBirth: '1995-04-12',
      nationality: 'KAZ',
      countryOfResidence: 'UAE',
    },
  });

  const userTariq = await prisma.user.create({
    data: { id: 'user_tariq', name: 'Tariq Mansoor', email: 'tariq@example.com' },
  });
  const travTariq = await prisma.traveler.create({
    data: {
      id: 'trav_tariq',
      userId: userTariq.id,
      fullName: 'Tariq Ahmed Mansoor',
      dateOfBirth: '1988-11-20',
      nationality: 'EGY',
      countryOfResidence: 'UAE',
    },
  });

  const userMei = await prisma.user.create({
    data: { id: 'user_mei', name: 'Mei-Ling Chen', email: 'meiling@example.com' },
  });
  const travMei = await prisma.traveler.create({
    data: {
      id: 'trav_mei',
      userId: userMei.id,
      fullName: 'Mei-Ling Chen',
      dateOfBirth: '1990-07-08',
      nationality: 'TWN',
      countryOfResidence: 'UAE',
    },
  });

  const userCarlos = await prisma.user.create({
    data: { id: 'user_carlos', name: 'Carlos Gomez Mendez', email: 'carlos@example.com' },
  });
  const travCarlos = await prisma.traveler.create({
    data: {
      id: 'trav_carlos',
      userId: userCarlos.id,
      fullName: 'Carlos Gomez Mendez',
      dateOfBirth: '1985-02-14',
      nationality: 'COL',
      countryOfResidence: 'UAE',
    },
  });

  // 2. Documents for Rohan's Vault
  const docPassport = await prisma.document.create({
    data: {
      id: 'doc_passport_rohan',
      travelerId: traveler.id,
      type: 'PASSPORT',
      fileUrl: '/samples/sample_passport.svg',
      extractedData: JSON.stringify({
        fullName: 'ROHAN ARJUN SHARMA',
        passportNumber: 'A87654321',
        nationality: 'IND',
        dateOfBirth: '1992-08-14',
        issueDate: '2018-01-10',
        expiryDate: '2028-01-09',
        issuingCountry: 'IND',
        confidenceNotes: 'MRZ verified. Clear scan, all biographical fields high confidence.',
      }),
      confidenceNotes: 'ICAO MRZ checksum validated. Expiry Jan 2028.',
      userEdited: false,
      version: 1,
    },
  });

  const docVisa = await prisma.document.create({
    data: {
      id: 'doc_visa_rohan',
      travelerId: traveler.id,
      type: 'VISA',
      fileUrl: '/samples/sample_visa.svg',
      extractedData: JSON.stringify({
        holderName: 'ROHAN ARJUN SHARMA',
        passportNumber: 'A87654321',
        country: 'France',
        region: 'SCHENGEN',
        visaType: 'C (TOURISM)',
        entries: 'MULTIPLE',
        validFrom: '2026-01-15',
        validUntil: '2026-07-15',
        maxStayDays: 90,
        referenceNumber: 'FR098765432',
        confidenceNotes: 'Schengen sticker format detected. 90-day multiple-entry tourist visa.',
      }),
      confidenceNotes: 'Schengen sticker format verified. Consular stamp clear.',
      userEdited: false,
      version: 1,
    },
  });

  const visa = await prisma.visa.create({
    data: {
      id: 'visa_schengen_rohan',
      documentId: docVisa.id,
      travelerId: traveler.id,
      passportDocumentId: docPassport.id,
      country: 'France',
      region: 'SCHENGEN',
      visaType: 'C (TOURISM)',
      entries: 'MULTIPLE',
      validFrom: '2026-01-15',
      validUntil: '2026-07-15',
      maxStayDays: 90,
      stayWindowDays: 180,
      status: 'ACTIVE',
    },
  });

  const docResidence = await prisma.document.create({
    data: {
      id: 'doc_res_permit_rohan',
      travelerId: traveler.id,
      type: 'RESIDENCE_PERMIT',
      fileUrl: '/samples/sample_residence_permit.svg',
      extractedData: JSON.stringify({
        holderName: 'ROHAN ARJUN SHARMA',
        idNumber: '784-1992-1234567-1',
        issuingCountry: 'UAE',
        expiryDate: '2027-10-30',
        sponsorOrEmployer: 'CLOUDTECH MIDDLE EAST FZ-LLC',
        confidenceNotes: 'UAE Emirates ID recognized. Valid through late 2027.',
      }),
      confidenceNotes: 'Valid UAE Emirates ID smart card verified.',
      userEdited: false,
      version: 1,
    },
  });

  const docFlight = await prisma.document.create({
    data: {
      id: 'doc_flight_rohan',
      travelerId: traveler.id,
      type: 'FLIGHT_BOOKING',
      fileUrl: '/samples/sample_flight.svg',
      extractedData: JSON.stringify({
        passengerName: 'ROHAN ARJUN SHARMA',
        departureDate: '2026-06-01',
        returnDate: '2026-06-15',
        route: 'DXB to CDG (Roundtrip)',
        confidenceNotes: 'AeroVoyage confirmed e-ticket PNR AV-78901.',
      }),
      userEdited: false,
    },
  });

  const docHotel = await prisma.document.create({
    data: {
      id: 'doc_hotel_rohan',
      travelerId: traveler.id,
      type: 'HOTEL_BOOKING',
      fileUrl: '/samples/sample_hotel.svg',
      extractedData: JSON.stringify({
        guestName: 'ROHAN ARJUN SHARMA',
        checkIn: '2026-06-01',
        checkOut: '2026-06-15',
        city: 'Paris',
        confidenceNotes: 'Le Grand Hôtel Opera voucher confirmed and prepaid for 14 nights.',
      }),
      userEdited: false,
    },
  });

  const docInsurance = await prisma.document.create({
    data: {
      id: 'doc_insurance_rohan',
      travelerId: traveler.id,
      type: 'INSURANCE',
      fileUrl: '/samples/sample_insurance.svg',
      extractedData: JSON.stringify({
        holderName: 'ROHAN ARJUN SHARMA',
        coverageAmount: 50000,
        currency: 'EUR',
        startDate: '2026-06-01',
        endDate: '2026-06-20',
        coveredRegions: 'All Schengen States & EU',
        confidenceNotes: 'Allianz Schengen Travel Certificate. Exceeds standard €30k medical requirement.',
      }),
      userEdited: false,
    },
  });

  const docBank = await prisma.document.create({
    data: {
      id: 'doc_bank_rohan',
      travelerId: traveler.id,
      type: 'BANK_STATEMENT',
      fileUrl: '/samples/sample_bank_statement.svg',
      extractedData: JSON.stringify({
        accountHolderName: 'ROHAN ARJUN SHARMA',
        periodStart: '2026-02-01',
        periodEnd: '2026-05-01',
        closingBalance: 68450,
        currency: 'AED',
        confidenceNotes: 'Full 3-month statement with regular salary credits and official bank seal.',
      }),
      userEdited: false,
    },
  });

  const docEmp = await prisma.document.create({
    data: {
      id: 'doc_emp_rohan',
      travelerId: traveler.id,
      type: 'EMPLOYMENT_LETTER',
      fileUrl: '/samples/sample_employment_letter.svg',
      extractedData: JSON.stringify({
        employeeName: 'ROHAN ARJUN SHARMA',
        employer: 'CLOUDTECH MIDDLE EAST FZ-LLC',
        position: 'Senior Solutions Architect',
        issueDate: '2026-05-02',
        leaveStart: '2026-06-01',
        leaveEnd: '2026-06-15',
        confidenceNotes: 'Official employer NOC with salary, approved leave dates, and HR seal.',
      }),
      userEdited: false,
    },
  });

  const docPhoto = await prisma.document.create({
    data: {
      id: 'doc_photo_rohan',
      travelerId: traveler.id,
      type: 'PHOTO',
      fileUrl: '/samples/sample_photo.svg',
      extractedData: JSON.stringify({
        qualityNotes: 'ICAO biometric compliant photo. Plain off-white background, neutral expression.',
        faceVisible: true,
        plainBackground: true,
        glareOrBlur: false,
        looksRecent: true,
      }),
      userEdited: false,
    },
  });

  // 3. Travel Records for Rohan (demonstrating rolling window usage)
  await prisma.travelRecord.create({
    data: {
      id: 'rec_1',
      travelerId: traveler.id,
      region: 'SCHENGEN',
      entryDate: '2026-02-01',
      exitDate: '2026-02-15',
      notes: 'Ski vacation in Chamonix, France (15 days)',
    },
  });

  await prisma.travelRecord.create({
    data: {
      id: 'rec_2',
      travelerId: traveler.id,
      region: 'SCHENGEN',
      entryDate: '2026-03-10',
      exitDate: '2026-03-25',
      notes: 'Developer summit in Berlin, Germany (16 days)',
    },
  });

  // 4. Three Seeded Trips (The Three Demo Moments)
  const allRohanDocs = [
    docPassport,
    docVisa,
    docResidence,
    docFlight,
    docHotel,
    docInsurance,
    docBank,
    docEmp,
    docPhoto,
  ];

  const travelRecords = await prisma.travelRecord.findMany({
    where: { travelerId: traveler.id },
  });

  // DEMO MOMENT 1: Fully Covered Trip (France, June 2026)
  const tripCovered = await prisma.trip.create({
    data: {
      id: 'trip_demo_covered',
      userId: user.id,
      destination: 'France',
      region: 'SCHENGEN',
      purpose: 'TOURISM',
      startDate: '2026-06-01',
      endDate: '2026-06-12',
      travelerIds: JSON.stringify([traveler.id]),
      status: 'EVALUATED',
    },
  });

  const assessment1 = buildReadinessAssessment(
    tripCovered,
    traveler,
    {
      visas: [visa],
      documents: allRohanDocs,
      travelRecords,
    }
  );

  await prisma.readinessResult.create({
    data: {
      id: 'result_demo_covered',
      tripId: tripCovered.id,
      verdict: assessment1.verdict,
      score: assessment1.score,
      itemsJson: JSON.stringify(assessment1),
    },
  });

  // DEMO MOMENT 2: Trip with Problems / PARTIAL (Spain, July-August 2026)
  const tripPartial = await prisma.trip.create({
    data: {
      id: 'trip_demo_partial',
      userId: user.id,
      destination: 'Spain',
      region: 'SCHENGEN',
      purpose: 'TOURISM',
      startDate: '2026-07-01',
      endDate: '2026-08-30', // Exceeds visa expiry of 2026-07-15 and stay limit!
      travelerIds: JSON.stringify([traveler.id]),
      status: 'EVALUATED',
    },
  });

  const assessment2 = buildReadinessAssessment(
    tripPartial,
    traveler,
    {
      visas: [visa],
      documents: allRohanDocs,
      travelRecords,
    }
  );

  await prisma.readinessResult.create({
    data: {
      id: 'result_demo_partial',
      tripId: tripPartial.id,
      verdict: assessment2.verdict,
      score: assessment2.score,
      itemsJson: JSON.stringify(assessment2),
    },
  });

  // DEMO MOMENT 3: Trip with NO Visa (Japan, October 2026)
  const tripNoVisa = await prisma.trip.create({
    data: {
      id: 'trip_demo_novisa',
      userId: user.id,
      destination: 'Japan',
      region: 'JAPAN',
      purpose: 'TOURISM',
      startDate: '2026-10-05',
      endDate: '2026-10-18',
      travelerIds: JSON.stringify([traveler.id]),
      status: 'PLANNING',
    },
  });

  const assessment3 = buildReadinessAssessment(
    tripNoVisa,
    traveler,
    {
      visas: [visa],
      documents: [docPassport, docResidence, docBank, docEmp, docPhoto], // Missing Japan hotel/flight
      travelRecords,
    }
  );

  await prisma.readinessResult.create({
    data: {
      id: 'result_demo_novisa',
      tripId: tripNoVisa.id,
      verdict: assessment3.verdict,
      score: assessment3.score,
      itemsJson: JSON.stringify(assessment3),
    },
  });

  // 5. Five Sample Agency Cases (Mix of scores 35 to 96 and statuses)
  // Case 1: Rohan Sharma (Japan case, shared)
  const case1 = await prisma.case.create({
    data: {
      id: 'case_1',
      caseCode: 'VV-2026-0042',
      tripId: tripNoVisa.id,
      status: 'NEW',
      consentAcceptedAt: new Date(),
      consentTextVersion: 'v1.0',
      sharedDocumentIds: JSON.stringify([docPassport.id, docResidence.id, docBank.id, docEmp.id, docPhoto.id]),
      createdAt: new Date(),
    },
  });

  await prisma.caseIssue.create({
    data: {
      caseId: case1.id,
      severity: 'WARNING',
      ruleId: 'REQ-JP-HOTEL',
      message: 'Hotel booking confirmation missing from submitted dossier.',
      fixSuggestion: 'Please upload hotel booking for Tokyo & Kyoto before visa submission.',
    },
  });

  await prisma.caseStatusHistory.create({
    data: { caseId: case1.id, status: 'NEW' },
  });

  // Case 2: Elena Rostova (France, NEEDS_FIXES, score 48)
  const tripElena = await prisma.trip.create({
    data: {
      id: 'trip_elena',
      userId: userElena.id,
      destination: 'France',
      region: 'SCHENGEN',
      purpose: 'TOURISM',
      startDate: '2026-07-10',
      endDate: '2026-07-24',
      travelerIds: JSON.stringify([travElena.id]),
      status: 'SHARED',
    },
  });
  await prisma.readinessResult.create({
    data: {
      tripId: tripElena.id,
      verdict: 'NEEDS_ACTION',
      score: 48,
      itemsJson: JSON.stringify({}),
    },
  });

  const case2 = await prisma.case.create({
    data: {
      id: 'case_2',
      caseCode: 'VV-2026-0038',
      tripId: tripElena.id,
      status: 'NEEDS_FIXES',
      consentAcceptedAt: new Date(),
      consentTextVersion: 'v1.0',
      sharedDocumentIds: JSON.stringify([]),
    },
  });

  await prisma.caseIssue.create({
    data: {
      caseId: case2.id,
      severity: 'BLOCKER',
      ruleId: 'REQ-SCH-INSURANCE',
      message: 'Insurance policy coverage is €15,000, which is below the mandatory €30,000 Schengen threshold.',
      fixSuggestion: 'Purchase an updated policy with minimum €30,000 coverage.',
    },
  });

  await prisma.caseIssue.create({
    data: {
      caseId: case2.id,
      severity: 'BLOCKER',
      ruleId: 'REQ-SCH-PASSPORT',
      message: 'Passport expires only 24 days after return date. Schengen requires 90 days validity margin.',
      fixSuggestion: 'Passport renewal required prior to visa filing.',
    },
  });

  await prisma.caseMessage.create({
    data: {
      caseId: case2.id,
      from: 'AGENCY',
      text: 'Hello Elena, we reviewed your dossier. Two blockers were identified: your insurance coverage is below the €30,000 Schengen requirement and your passport requires renewal. Please upload renewed documents so we can proceed.',
    },
  });

  await prisma.caseStatusHistory.create({
    data: { caseId: case2.id, status: 'NEW' },
  });
  await prisma.caseStatusHistory.create({
    data: { caseId: case2.id, status: 'NEEDS_FIXES' },
  });

  // Case 3: Tariq Mansoor (UK, READY_TO_SUBMIT, score 94)
  const tripTariq = await prisma.trip.create({
    data: {
      id: 'trip_tariq',
      userId: userTariq.id,
      destination: 'United Kingdom',
      region: 'UK',
      purpose: 'BUSINESS',
      startDate: '2026-08-01',
      endDate: '2026-08-10',
      travelerIds: JSON.stringify([travTariq.id]),
      status: 'SHARED',
    },
  });
  await prisma.readinessResult.create({
    data: {
      tripId: tripTariq.id,
      verdict: 'READY',
      score: 94,
      itemsJson: JSON.stringify({}),
    },
  });

  const case3 = await prisma.case.create({
    data: {
      id: 'case_3',
      caseCode: 'VV-2026-0035',
      tripId: tripTariq.id,
      status: 'READY_TO_SUBMIT',
      consentAcceptedAt: new Date(),
      consentTextVersion: 'v1.0',
      sharedDocumentIds: JSON.stringify([]),
    },
  });

  await prisma.caseMessage.create({
    data: {
      caseId: case3.id,
      from: 'AGENCY',
      text: 'Tariq, all documents verified successfully. Application form pre-filled and biometric appointment scheduled for August 3.',
    },
  });

  await prisma.caseStatusHistory.create({
    data: { caseId: case3.id, status: 'NEW' },
  });
  await prisma.caseStatusHistory.create({
    data: { caseId: case3.id, status: 'READY_TO_SUBMIT' },
  });

  // Case 4: Mei-Ling Chen (USA, SUBMITTED, score 96)
  const tripMei = await prisma.trip.create({
    data: {
      id: 'trip_mei',
      userId: userMei.id,
      destination: 'United States',
      region: 'USA',
      purpose: 'TOURISM',
      startDate: '2026-09-15',
      endDate: '2026-09-30',
      travelerIds: JSON.stringify([travMei.id]),
      status: 'SHARED',
    },
  });
  await prisma.readinessResult.create({
    data: {
      tripId: tripMei.id,
      verdict: 'READY',
      score: 96,
      itemsJson: JSON.stringify({}),
    },
  });

  const case4 = await prisma.case.create({
    data: {
      id: 'case_4',
      caseCode: 'VV-2026-0029',
      tripId: tripMei.id,
      status: 'SUBMITTED',
      consentAcceptedAt: new Date(),
      consentTextVersion: 'v1.0',
      sharedDocumentIds: JSON.stringify([]),
    },
  });

  await prisma.caseStatusHistory.create({
    data: { caseId: case4.id, status: 'NEW' },
  });
  await prisma.caseStatusHistory.create({
    data: { caseId: case4.id, status: 'READY_TO_SUBMIT' },
  });
  await prisma.caseStatusHistory.create({
    data: { caseId: case4.id, status: 'SUBMITTED' },
  });

  // Case 5: Carlos Mendez (Schengen, NEEDS_FIXES, score 35)
  const tripCarlos = await prisma.trip.create({
    data: {
      id: 'trip_carlos',
      userId: userCarlos.id,
      destination: 'Germany',
      region: 'SCHENGEN',
      purpose: 'TOURISM',
      startDate: '2026-06-20',
      endDate: '2026-07-05',
      travelerIds: JSON.stringify([travCarlos.id]),
      status: 'SHARED',
    },
  });
  await prisma.readinessResult.create({
    data: {
      tripId: tripCarlos.id,
      verdict: 'BLOCKED',
      score: 35,
      itemsJson: JSON.stringify({}),
    },
  });

  const case5 = await prisma.case.create({
    data: {
      id: 'case_5',
      caseCode: 'VV-2026-0021',
      tripId: tripCarlos.id,
      status: 'NEEDS_FIXES',
      consentAcceptedAt: new Date(),
      consentTextVersion: 'v1.0',
      sharedDocumentIds: JSON.stringify([]),
    },
  });

  await prisma.caseIssue.create({
    data: {
      caseId: case5.id,
      severity: 'BLOCKER',
      ruleId: 'REQ-SCH-NAME-MATCH',
      message: 'Name on flight booking ("Carlos Gomez") does not match legal passport ("Carlos Gomez Mendez").',
      fixSuggestion: 'Contact airline to re-issue flight voucher with full legal surname.',
    },
  });

  await prisma.caseIssue.create({
    data: {
      caseId: case5.id,
      severity: 'BLOCKER',
      ruleId: 'REQ-SCH-EMPLOYMENT',
      message: 'Missing employer No Objection Certificate (NOC).',
      fixSuggestion: 'Obtain a signed and stamped letterhead from employer.',
    },
  });

  await prisma.caseStatusHistory.create({
    data: { caseId: case5.id, status: 'NEW' },
  });
  await prisma.caseStatusHistory.create({
    data: { caseId: case5.id, status: 'NEEDS_FIXES' },
  });

  console.log('✅ Successfully seeded VisaVault with:');
  console.log('- 1 Primary Traveler (Rohan Sharma) with 9 documents, 1 Schengen visa, 2 travel records');
  console.log('- 3 Demo Trip Scenarios (Covered, Partial with blockers, New destination with checklist)');
  console.log('- 5 Agency Cases (Scores 35 to 96 with live status workflow & issues)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
