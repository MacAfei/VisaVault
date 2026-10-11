import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { extractDocumentData } from '@/lib/extract/gemini';
import { buildReadinessAssessment } from '@/lib/readiness/build';
import { getTodayString } from '@/lib/clock';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

const DESTINATION_REGIONS: Record<string, string> = {
  France: 'SCHENGEN',
  Spain: 'SCHENGEN',
  Germany: 'SCHENGEN',
  Italy: 'SCHENGEN',
  Netherlands: 'SCHENGEN',
  Switzerland: 'SCHENGEN',
  'United Kingdom': 'UK',
  'United States': 'USA',
  Japan: 'JAPAN',
  Canada: 'USA',
  Australia: 'USA',
  Singapore: 'JAPAN',
};

// Map file names / keywords to standard document types
function detectDocType(fileName: string, explicitType?: string): string {
  if (explicitType && explicitType !== 'AUTO') return explicitType;
  const lower = fileName.toLowerCase();
  if (lower.includes('passport')) return 'PASSPORT';
  if (lower.includes('visa')) return 'VISA';
  if (lower.includes('residence') || lower.includes('permit') || lower.includes('emirates')) return 'RESIDENCE_PERMIT';
  if (lower.includes('flight') || lower.includes('ticket') || lower.includes('boarding') || lower.includes('air')) return 'FLIGHT_BOOKING';
  if (lower.includes('hotel') || lower.includes('booking') || lower.includes('stay') || lower.includes('voucher')) return 'HOTEL_BOOKING';
  if (lower.includes('insurance') || lower.includes('policy') || lower.includes('medical')) return 'INSURANCE';
  if (lower.includes('bank') || lower.includes('statement') || lower.includes('financial')) return 'BANK_STATEMENT';
  if (lower.includes('noc') || lower.includes('employ') || lower.includes('leave') || lower.includes('salary')) return 'EMPLOYMENT_LETTER';
  if (lower.includes('photo') || lower.includes('pic') || lower.includes('image')) return 'PHOTO';
  return 'PASSPORT';
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let destination = 'France';
    let region = 'SCHENGEN';
    let startDate = '2026-06-01';
    let endDate = '2026-06-15';
    let purpose = 'Tourism';
    let presetScenario: string | null = null;
    const uploadedDocs: Array<{ type: string; fileUrl: string; extractedData: any; confidenceNotes?: string }> = [];

    // Traveler lookup
    const traveler = await prisma.traveler.findFirst({
      include: { user: true },
    });
    if (!traveler) {
      return NextResponse.json({ error: 'No traveler record found in database' }, { status: 404 });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      destination = (formData.get('destination') as string) || 'France';
      startDate = (formData.get('startDate') as string) || '2026-06-01';
      endDate = (formData.get('endDate') as string) || '2026-06-15';
      purpose = (formData.get('purpose') as string) || 'Tourism';
      region = DESTINATION_REGIONS[destination] || 'SCHENGEN';

      const files = formData.getAll('files') as File[];
      const docTypes = formData.getAll('docTypes') as string[];

      const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || typeof file.arrayBuffer !== 'function') continue;

        const fileName = file.name || `doc_${i}`;
        const explicitType = docTypes[i] || 'AUTO';
        const docType = detectDocType(fileName, explicitType);
        const mimeType = file.type || 'image/jpeg';

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = `${Date.now()}_${i}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, buffer);

        const base64Data = buffer.toString('base64');
        const fileUrl = `/api/uploads/${safeName}`;

        const extractRes = await extractDocumentData({
          fileName,
          docType,
          mimeType,
          base64Data,
        });

        uploadedDocs.push({
          type: docType,
          fileUrl,
          extractedData: extractRes.extractedData,
          confidenceNotes: extractRes.confidenceNotes,
        });
      }
    } else {
      // JSON body (presets or sample documents)
      const body = await req.json();
      destination = body.destination || 'France';
      startDate = body.startDate || '2026-06-01';
      endDate = body.endDate || '2026-06-15';
      purpose = body.purpose || 'Tourism';
      region = DESTINATION_REGIONS[destination] || body.region || 'SCHENGEN';
      presetScenario = body.preset || null;

      // If preset requested, load samples
      const sampleList: Array<{ docType: string; fileName: string; path: string }> = [];

      if (presetScenario === 'france_covered') {
        sampleList.push(
          { docType: 'PASSPORT', fileName: 'sample_passport.svg', path: '/samples/sample_passport.svg' },
          { docType: 'VISA', fileName: 'sample_visa.svg', path: '/samples/sample_visa.svg' },
          { docType: 'FLIGHT_BOOKING', fileName: 'sample_flight.svg', path: '/samples/sample_flight.svg' },
          { docType: 'HOTEL_BOOKING', fileName: 'sample_hotel.svg', path: '/samples/sample_hotel.svg' },
          { docType: 'INSURANCE', fileName: 'sample_insurance.svg', path: '/samples/sample_insurance.svg' }
        );
      } else if (presetScenario === 'spain_blocked') {
        sampleList.push(
          { docType: 'PASSPORT', fileName: 'sample_passport.svg', path: '/samples/sample_passport.svg' },
          { docType: 'VISA', fileName: 'sample_visa.svg', path: '/samples/sample_visa.svg' }
        );
      } else if (presetScenario === 'japan_novisa') {
        sampleList.push(
          { docType: 'PASSPORT', fileName: 'sample_passport.svg', path: '/samples/sample_passport.svg' },
          { docType: 'BANK_STATEMENT', fileName: 'sample_bank_statement.svg', path: '/samples/sample_bank_statement.svg' },
          { docType: 'EMPLOYMENT_LETTER', fileName: 'sample_employment_letter.svg', path: '/samples/sample_employment_letter.svg' }
        );
      } else if (body.samples && Array.isArray(body.samples)) {
        for (const s of body.samples) {
          sampleList.push({
            docType: s.type || detectDocType(s.name || ''),
            fileName: s.name || 'sample.svg',
            path: s.path || `/samples/${s.name}`,
          });
        }
      }

      for (const item of sampleList) {
        let base64Data: string | undefined;
        try {
          const publicPath = path.join(process.cwd(), 'public', item.path.replace(/^\//, ''));
          const fileBytes = await fs.readFile(publicPath);
          base64Data = fileBytes.toString('base64');
        } catch {}

        const extractRes = await extractDocumentData({
          fileName: item.fileName,
          docType: item.docType,
          mimeType: 'image/svg+xml',
          base64Data,
        });

        uploadedDocs.push({
          type: item.docType,
          fileUrl: item.path,
          extractedData: extractRes.extractedData,
          confidenceNotes: extractRes.confidenceNotes,
        });
      }
    }

    // Save all extracted documents into Traveler's Vault so they are immediately available
    const savedDocIds: string[] = [];
    for (const doc of uploadedDocs) {
      // Check if document already exists with identical fileUrl to avoid duplicate spam
      let existing = await prisma.document.findFirst({
        where: {
          travelerId: traveler.id,
          fileUrl: doc.fileUrl,
          supersededById: null,
        },
      });

      if (!existing) {
        existing = await prisma.document.create({
          data: {
            travelerId: traveler.id,
            type: doc.type,
            fileUrl: doc.fileUrl,
            extractedData: JSON.stringify(doc.extractedData || {}),
            confidenceNotes: doc.confidenceNotes || null,
            version: 1,
          },
        });

        // If it's a VISA, save Visa linkage
        if (doc.type === 'VISA' && doc.extractedData) {
          const vData = doc.extractedData;
          await prisma.visa.create({
            data: {
              documentId: existing.id,
              travelerId: traveler.id,
              country: destination.toUpperCase(),
              region: region.toUpperCase(),
              visaType: vData.visaType || 'TOURIST',
              entries: vData.entries || 'MULTIPLE',
              validFrom: vData.validFrom || '2026-01-15',
              validUntil: vData.validUntil || '2026-07-15',
              maxStayDays: vData.maxStayDays || 90,
              stayWindowDays: vData.stayWindowDays || 180,
              status: 'ACTIVE',
            },
          });
        }
      }
      savedDocIds.push(existing.id);
    }

    // Create or find Trip record
    const trip = await prisma.trip.create({
      data: {
        userId: traveler.userId,
        destination,
        region,
        startDate,
        endDate,
        purpose,
        travelerIds: JSON.stringify([traveler.id]),
        status: 'PLANNING',
      },
    });

    // Fetch full active vault for traveler
    const fullVault = await prisma.traveler.findUnique({
      where: { id: traveler.id },
      include: {
        documents: { where: { supersededById: null } },
        visas: true,
        travelRecords: true,
      },
    });

    // Run deterministic readiness evaluation
    const assessment = buildReadinessAssessment(
      trip,
      traveler,
      {
        visas: fullVault?.visas || [],
        documents: fullVault?.documents || [],
        travelRecords: fullVault?.travelRecords || [],
      }
    );

    // Save readiness result
    await prisma.readinessResult.create({
      data: {
        tripId: trip.id,
        verdict: assessment.verdict,
        score: assessment.score,
        itemsJson: JSON.stringify(assessment),
      },
    });

    // Automatically create a Case for the Company Portal so company staff can access all applicant info!
    const caseCount = await prisma.case.count();
    const caseCode = `VV-2026-${String(caseCount + 101).padStart(4, '0')}`;
    const allProblems = [
      ...(assessment.checklist.problems || []),
      ...(assessment.checklist.missing || []),
    ];

    const companyCase = await prisma.case.create({
      data: {
        caseCode,
        tripId: trip.id,
        status: assessment.verdict === 'READY' ? 'READY_TO_SUBMIT' : 'NEW',
        consentAcceptedAt: new Date(),
        consentTextVersion: 'v1.0',
        sharedDocumentIds: JSON.stringify(savedDocIds),
        caseIssues: {
          create: allProblems.map((prob) => ({
            severity: 'severity' in prob ? (prob as any).severity : 'BLOCKER',
            ruleId: prob.id,
            message: prob.title,
            fixSuggestion: prob.fix || prob.description,
          })),
        },
        statusHistory: {
          create: {
            status: assessment.verdict === 'READY' ? 'READY_TO_SUBMIT' : 'NEW',
          },
        },
      },
      include: {
        caseIssues: true,
      },
    });

    return NextResponse.json({
      success: true,
      assessment,
      trip,
      case: companyCase,
      savedDocumentsCount: savedDocIds.length,
      destination,
      region,
      startDate,
      endDate,
    });
  } catch (err: any) {
    console.error('Scan API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error during document scanning' },
      { status: 500 }
    );
  }
}
