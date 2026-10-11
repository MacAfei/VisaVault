import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { maskDocumentNumber } from '@/lib/extract/mask';
import { daysBetween, getTodayString } from '@/lib/clock';
import { calculateStay } from '@/lib/visa/stayCounter';
import { ClearWalletButton } from '@/components/ClearWalletButton';
import {
  FolderArchive,
  FolderPlus,
  History,
  Eye,
  Plane,
  Building,
  Shield,
  CalendarDays,
  Copy,
  ExternalLink,
  Clock,
  ArrowRight,
  Scan,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VaultPage() {
  const traveler = await prisma.traveler.findFirst({
    include: {
      documents: {
        include: {
          visa: true,
          supersededBy: true,
          supersededDocs: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      visas: true,
      travelRecords: true,
    },
  });

  const documents = traveler?.documents || [];
  const today = getTodayString();

  // Active documents
  const activeDocs = documents.filter((d) => !d.supersededById);
  const supersededDocs = documents.filter((d) => d.supersededById);

  // Find key travel documents for Quick Boarding & Border Pass
  const activePassport = activeDocs.find((d) => d.type === 'PASSPORT');
  const activeVisa = traveler?.visas?.find((v) => v.status === 'ACTIVE') || activeDocs.find((d) => d.type === 'VISA');
  const activeFlight = activeDocs.find((d) => d.type === 'FLIGHT_BOOKING');
  const activeHotel = activeDocs.find((d) => d.type === 'HOTEL_BOOKING');
  const activeInsurance = activeDocs.find((d) => d.type === 'INSURANCE');

  // Parse extracted data for quick display (ONLY if actually scanned)
  let passportData: any = null;
  if (activePassport?.extractedData) {
    try {
      passportData = JSON.parse(activePassport.extractedData);
    } catch {}
  }

  let visaData: any = null;
  if (activeVisa) {
    if ('extractedData' in activeVisa && (activeVisa as any).extractedData) {
      try {
        visaData = JSON.parse((activeVisa as any).extractedData);
      } catch {}
    } else {
      visaData = activeVisa;
    }
  }

  let flightData: any = null;
  if (activeFlight?.extractedData) {
    try {
      flightData = JSON.parse(activeFlight.extractedData);
    } catch {}
  }

  let hotelData: any = null;
  if (activeHotel?.extractedData) {
    try {
      hotelData = JSON.parse(activeHotel.extractedData);
    } catch {}
  }

  let insuranceData: any = null;
  if (activeInsurance?.extractedData) {
    try {
      insuranceData = JSON.parse(activeInsurance.extractedData);
    } catch {}
  }

  // Stay statistics
  const stayStats = calculateStay({
    pastRecords: traveler?.travelRecords || [],
    region: 'SCHENGEN',
    maxStayDays: 90,
    stayWindowDays: 180,
    referenceDate: today,
  });

  // Group active docs by category
  const categories: Record<string, string[]> = {
    'Identity & Travel Documents': ['PASSPORT', 'VISA', 'RESIDENCE_PERMIT'],
    'Travel Logistics & Proof of Stay': ['FLIGHT_BOOKING', 'HOTEL_BOOKING'],
    'Financials & Ties': ['BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'INSURANCE'],
    'Biometrics & Application History': ['PHOTO', 'APPLICATION_RECEIPT', 'REJECTION_LETTER'],
  };

  const getDocExpiryBadge = (extractedDataStr: string) => {
    try {
      const data = JSON.parse(extractedDataStr || '{}');
      const expiry = data.expiryDate || data.validUntil || data.endDate;
      if (!expiry) return null;

      const days = daysBetween(today, expiry);
      if (days <= 0) {
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-black border border-zinc-400">
            Expired ({expiry})
          </span>
        );
      }
      if (days <= 90) {
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300">
            Expires in {days}d ({expiry})
          </span>
        );
      }
      return (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-50 text-zinc-600 border border-zinc-200 font-mono">
          Valid until {expiry}
        </span>
      );
    } catch {
      return null;
    }
  };

  const getDocIdentifier = (extractedDataStr: string) => {
    try {
      const data = JSON.parse(extractedDataStr || '{}');
      const num =
        data.passportNumber ||
        data.idNumber ||
        data.referenceNumber ||
        data.bookingReference ||
        data.pnr ||
        data.closingBalance;
      if (num) {
        return typeof num === 'number'
          ? `${data.currency || ''} ${num.toLocaleString()}`
          : maskDocumentNumber(num);
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8 pb-16 text-zinc-900 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-bold text-black uppercase tracking-wider mb-1">
            <FolderArchive className="w-3 h-3" />
            Client Travel Wallet
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Traveler Document Vault
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1">
            {traveler?.fullName
              ? `Client Profile: ${traveler.fullName} (${traveler.nationality || 'Client'})`
              : 'Personal verified travel wallet'}
            {' • '}
            <span className="font-semibold text-black">
              {activeDocs.length} document{activeDocs.length === 1 ? '' : 's'} stored
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeDocs.length > 0 && <ClearWalletButton />}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-black hover:bg-zinc-800 text-white transition-colors shadow-xs"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan Documents</span>
          </Link>
        </div>
      </div>

      {/* CASE 1: EMPTY STATE (BEFORE USER SCANS DOCUMENTS) */}
      {activeDocs.length === 0 ? (
        <section className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-zinc-200 bg-white text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-300 flex items-center justify-center mx-auto text-black shadow-xs">
            <FolderArchive className="w-8 h-8 text-black" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-black tracking-tight">
              Your Travel Wallet is Empty
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              No travel documents have been scanned yet. Only documents you scan will appear in your client wallet.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <Scan className="w-4 h-4" />
              <span>Go to Document Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* How It Works Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto text-left border-t border-zinc-100 mt-6">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div className="w-6 h-6 rounded-md bg-white border border-zinc-300 flex items-center justify-center text-xs font-bold text-black font-mono">
                1
              </div>
              <h3 className="text-xs font-bold text-black">Scan Documents</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Upload your Passport, Visa, Hotel bookings, Flight tickets, or Bank statements on the Scanner.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div className="w-6 h-6 rounded-md bg-white border border-zinc-300 flex items-center justify-center text-xs font-bold text-black font-mono">
                2
              </div>
              <h3 className="text-xs font-bold text-black">Auto-Saved to Wallet</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Extracted data, biometric validity, and booking references are automatically filed into your personal vault.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
              <div className="w-6 h-6 rounded-md bg-white border border-zinc-300 flex items-center justify-center text-xs font-bold text-black font-mono">
                3
              </div>
              <h3 className="text-xs font-bold text-black">Border Pass &amp; Limits</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Quick access to legal passport numbers, visa expiry dates, and live Schengen 90/180-day stay allowance.
              </p>
            </div>
          </div>
        </section>
      ) : (
        /* CASE 2: POPULATED WALLET (AFTER USER SCANS DOCUMENTS) */
        <>
          {/* QUICK BOARDING PASS & BORDER CHECK ASSISTANT */}
          <section className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-black" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-black">
                  Boarding Pass &amp; Border Check Quick Access
                </h2>
              </div>
              <span className="text-[11px] text-zinc-500">
                Client: <strong className="text-black">{traveler?.fullName}</strong> ({traveler?.nationality || 'Client'})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Active Passport */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Active Passport
                </span>
                <div className="font-mono font-bold text-sm text-black">
                  {passportData?.passportNumber ? maskDocumentNumber(passportData.passportNumber) : 'Not Scanned'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {passportData?.expiryDate ? `Valid until: ${passportData.expiryDate}` : 'Upload passport'}
                </div>
              </div>

              {/* Active Visa / Permit */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Active Visa / Permit
                </span>
                <div className="font-bold text-sm text-black truncate">
                  {visaData
                    ? `${visaData.country || 'SCHENGEN'} ${visaData.visaType || 'VISA'}`
                    : 'No Active Visa'}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  {visaData?.validUntil ? `Valid until: ${visaData.validUntil}` : 'Scan visa sticker'}
                </div>
              </div>

              {/* Flight Confirmation / PNR */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Flight PNR / Route
                </span>
                <div className="font-mono font-bold text-sm text-black truncate">
                  {flightData?.bookingReference || flightData?.pnr || flightData?.route || 'Not Scanned'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {flightData?.departureDate ? `Depart: ${flightData.departureDate}` : 'Upload flight ticket'}
                </div>
              </div>

              {/* Hotel / Stay or Schengen Allowance */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  {hotelData ? 'Accommodation' : 'Schengen Stay Allowance'}
                </span>
                <div className="font-bold text-sm text-black truncate">
                  {hotelData
                    ? (hotelData.hotelName || hotelData.city || 'Hotel Booking')
                    : `${stayStats.daysRemainingAsOfDate} Days Remaining`}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {hotelData
                    ? `Check-in: ${hotelData.checkIn || 'Confirmed'}`
                    : `${stayStats.daysUsedAsOfDate} of 90 days used`}
                </div>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <div className="space-y-8">
            {Object.entries(categories).map(([categoryTitle, docTypes]) => {
              const matchingDocs = activeDocs.filter((d) => docTypes.includes(d.type));
              if (matchingDocs.length === 0) return null;

              return (
                <div key={categoryTitle} className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-black border-l-2 border-black pl-2.5">
                    {categoryTitle} ({matchingDocs.length})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matchingDocs.map((doc) => {
                      const identifier = getDocIdentifier(doc.extractedData);
                      const expiryBadge = getDocExpiryBadge(doc.extractedData);

                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl bg-white border border-zinc-200 hover:border-black transition-all flex flex-col justify-between shadow-xs"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold uppercase tracking-wide text-black">
                                {doc.type.replace(/_/g, ' ')}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {doc.version > 1 && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300">
                                    v{doc.version}
                                  </span>
                                )}
                                {doc.userEdited && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>

                            {identifier && (
                              <div className="text-sm font-bold font-mono text-black">
                                {identifier}
                              </div>
                            )}

                            <div>{expiryBadge}</div>

                            {doc.confidenceNotes && (
                              <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                                {doc.confidenceNotes}
                              </p>
                            )}
                          </div>

                          <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Saved {new Date(doc.createdAt).toLocaleDateString()}
                            </span>

                            <Link
                              href={`/vault/${doc.id}`}
                              className="flex items-center gap-1 text-xs font-semibold text-black hover:underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details &amp; Scan
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Version History / Superseded Documents Section */}
          {supersededDocs.length > 0 && (
            <section className="space-y-3 pt-6 border-t border-zinc-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <History className="w-4 h-4 text-black" />
                Superseded / Archived Document Versions
              </h2>
              <p className="text-xs text-zinc-500">
                Previous versions archived automatically when updated booklet scans were uploaded.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-75">
                {supersededDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-zinc-700">
                        {doc.type.replace(/_/g, ' ')} (Version {doc.version})
                      </span>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Superseded by newer booklet
                      </div>
                    </div>

                    <Link
                      href={`/vault/${doc.id}`}
                      className="px-2.5 py-1 rounded bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                    >
                      View Archive
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
