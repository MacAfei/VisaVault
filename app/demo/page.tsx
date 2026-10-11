'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Sparkles,
  Download,
  RotateCcw,
  Clock,
  CheckCircle2,
  PlayCircle,
  Smartphone,
} from 'lucide-react';

const SAMPLES = [
  { name: 'Passport (ICAO Specimen)', path: '/samples/sample_passport.svg', type: 'PASSPORT' },
  { name: 'Schengen Visa Sticker', path: '/samples/sample_visa.svg', type: 'VISA' },
  { name: 'Flight Confirmation Voucher', path: '/samples/sample_flight.svg', type: 'FLIGHT_BOOKING' },
  { name: 'Paris Hotel Voucher', path: '/samples/sample_hotel.svg', type: 'HOTEL_BOOKING' },
  { name: 'Schengen Travel Insurance', path: '/samples/sample_insurance.svg', type: 'INSURANCE' },
  { name: 'Bank Statement (3 Months)', path: '/samples/sample_bank_statement.svg', type: 'BANK_STATEMENT' },
  { name: 'Employer NOC Letter', path: '/samples/sample_employment_letter.svg', type: 'EMPLOYMENT_LETTER' },
  { name: 'UAE Residence Permit Card', path: '/samples/sample_residence_permit.svg', type: 'RESIDENCE_PERMIT' },
  { name: 'ICAO Biometric Photo', path: '/samples/sample_photo.svg', type: 'PHOTO' },
];

export default function DemoHubPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    setCurrentUrl(origin);

    // Generate QR Code data URL with clean black dots
    QRCode.toDataURL(origin, { width: 240, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, []);

  const handleResetDemoData = async () => {
    if (!confirm('Reset demo database to pristine hackathon state with 3 demo moments and 5 agency cases?')) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);

    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reset demo data');
      setResetMessage('Demo database successfully reset to pristine state!');
    } catch (err: any) {
      setResetMessage(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-black bg-zinc-100 border border-zinc-200 px-3 py-0.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Hackathon Judge &amp; Demo Console
          </span>
          <span className="text-xs text-zinc-400 font-mono">VisaVault 2026</span>
        </div>

        <h1 className="text-2xl font-bold text-black tracking-tight">
          Demo Control Center &amp; Live Test Suite
        </h1>

        <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
          Open VisaVault on your mobile device via the QR code below, download clearly marked test documents, or reset database scenarios with 1 click.
        </p>

        {/* Demo Clock Indicator */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 font-mono text-zinc-800">
            <Clock className="w-4 h-4 text-black" />
            <span>Clock Override (DEMO_TODAY): <strong>2026-05-15</strong></span>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-colors disabled:opacity-40"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting Database...' : 'Reset Demo Data to Initial State'}
          </button>
        </div>

        {resetMessage && (
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-300 text-xs text-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-black" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>

      {/* Two Column: QR Code + 90s Demo Script */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: QR Code for Mobile Demo */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-black" />
            <h2 className="text-base font-bold text-black tracking-tight">
              Test on Mobile Device (Camera Uploads)
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Scan with your phone camera to test real-time mobile camera uploads and document scanning:
          </p>

          <div className="p-3 bg-white border border-zinc-200 rounded-xl w-fit mx-auto shadow-sm">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="App QR Code" className="w-44 h-44 object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-zinc-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="text-center">
            <span className="text-[11px] font-mono text-zinc-500 break-all block">
              {currentUrl}
            </span>
          </div>
        </div>

        {/* Right: 90-Second Demo Script */}
        <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-black" />
            <h2 className="text-base font-bold text-black tracking-tight">
              Official 90-Second Demo Walkthrough
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5">
              <div className="font-bold text-black">1. Show Traveler Wallet</div>
              <p className="text-zinc-600">
                Show Rohan Sharma&apos;s wallet with Schengen multiple-entry visa, UAE residence permit, and live expiry alerts.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5">
              <div className="font-bold text-black">2. Demo Moment 1: Fully Covered Trip (France)</div>
              <p className="text-zinc-600">
                Open the France trip: High-contrast verdict &quot;Good to Go! Existing Visa Covers This Trip&quot; with 100% readiness score and pack itinerary plan.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5">
              <div className="font-bold text-black">3. Demo Moment 2: Blocked / Partial Trip (Spain)</div>
              <p className="text-zinc-600">
                Open Spain trip: Highlights critical blockers—stay limit exceeded and visa expiring mid-trip.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5">
              <div className="font-bold text-black">4. Demo Moment 3: Trip with No Visa (Japan)</div>
              <p className="text-zinc-600">
                Open Japan trip: Shows requirements checklist with missing hotel/flight documents and ordered action plan.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5">
              <div className="font-bold text-black">5. Consent &amp; Transmit to Agency</div>
              <p className="text-zinc-600">
                Click &quot;Share with Agency&quot;, review selected documents, check mandatory consent, and submit. Receive Case ID.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-0.5">
              <div className="font-bold text-black">6. Agency Dashboard &amp; Zero-Typing Automation</div>
              <p className="text-zinc-600">
                Switch to Agency Portal: see case appear live in inbox, inspect auto-filled data sheet (with 1-click copy and CSV export), generate WhatsApp fix request, and show the top impact panel with staff time saved!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Downloadable Fake Sample Documents */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
            <Download className="w-4 h-4 text-black" />
            Download Clearly Fictional Sample Test Documents
          </h2>
          <p className="text-xs text-zinc-500">
            All sample documents are watermarked with SPECIMEN / SAMPLE. Use them to test uploads from desktop or phone:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SAMPLES.map((s) => (
            <div
              key={s.path}
              className="p-3.5 rounded-xl border border-zinc-200 bg-white hover:border-black flex items-center justify-between text-xs transition-colors shadow-sm"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-black">{s.name}</span>
                <div className="text-[10px] text-zinc-400 font-mono">{s.type}</div>
              </div>

              <a
                href={s.path}
                download
                className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black transition-colors"
                title="Download specimen"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
