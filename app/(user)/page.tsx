'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scan,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FolderArchive,
  RefreshCw,
  Send,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  MapPin,
  Calendar,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { VerdictBanner } from '@/components/VerdictBanner';

const ORIGIN_COUNTRIES = [
  { name: 'United Arab Emirates', flag: '🇦🇪', code: 'UAE' },
  { name: 'India', flag: '🇮🇳', code: 'IND' },
  { name: 'United Kingdom', flag: '🇬🇧', code: 'UK' },
  { name: 'United States', flag: '🇺🇸', code: 'USA' },
  { name: 'Saudi Arabia', flag: '🇸🇦', code: 'KSA' },
  { name: 'Qatar', flag: '🇶🇦', code: 'QAT' },
  { name: 'Philippines', flag: '🇵🇭', code: 'PHL' },
  { name: 'Pakistan', flag: '🇵🇰', code: 'PAK' },
  { name: 'Egypt', flag: '🇪🇬', code: 'EGY' },
  { name: 'Canada', flag: '🇨🇦', code: 'CAN' },
  { name: 'Australia', flag: '🇦🇺', code: 'AUS' },
  { name: 'Singapore', flag: '🇸🇬', code: 'SGP' },
];

const DESTINATIONS = [
  { name: 'France', region: 'SCHENGEN', flag: '🇫🇷', desc: 'Schengen Area' },
  { name: 'Spain', region: 'SCHENGEN', flag: '🇪🇸', desc: 'Schengen Area' },
  { name: 'Germany', region: 'SCHENGEN', flag: '🇩🇪', desc: 'Schengen Area' },
  { name: 'Italy', region: 'SCHENGEN', flag: '🇮🇹', desc: 'Schengen Area' },
  { name: 'Switzerland', region: 'SCHENGEN', flag: '🇨🇭', desc: 'Schengen Area' },
  { name: 'Netherlands', region: 'SCHENGEN', flag: '🇳🇱', desc: 'Schengen Area' },
  { name: 'Greece', region: 'SCHENGEN', flag: '🇬🇷', desc: 'Schengen Area' },
  { name: 'Portugal', region: 'SCHENGEN', flag: '🇵🇹', desc: 'Schengen Area' },
  { name: 'Austria', region: 'SCHENGEN', flag: '🇦🇹', desc: 'Schengen Area' },
  { name: 'Japan', region: 'JAPAN', flag: '🇯🇵', desc: 'Asia' },
  { name: 'United Kingdom', region: 'UK', flag: '🇬🇧', desc: 'United Kingdom' },
  { name: 'United States', region: 'USA', flag: '🇺🇸', desc: 'North America' },
  { name: 'Canada', region: 'USA', flag: '🇨🇦', desc: 'North America' },
  { name: 'Australia', region: 'USA', flag: '🇦🇺', desc: 'Oceania' },
  { name: 'Singapore', region: 'JAPAN', flag: '🇸🇬', desc: 'Asia' },
];

const COUNTRIES = DESTINATIONS;

const DOC_TYPES = [
  { value: 'AUTO', label: 'Auto-Detect' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'VISA', label: 'Existing Visa Sticker' },
  { value: 'FLIGHT_BOOKING', label: 'Flight Booking / Ticket' },
  { value: 'HOTEL_BOOKING', label: 'Hotel Voucher / Proof of Stay' },
  { value: 'INSURANCE', label: 'Travel Medical Insurance' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement (3 Months)' },
  { value: 'EMPLOYMENT_LETTER', label: 'Employer NOC Letter' },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit Card' },
  { value: 'PHOTO', label: 'ICAO Biometric Photo' },
];

interface StagedFile {
  id: string;
  file?: File;
  name: string;
  size?: number;
  docType: string;
  isPreset?: boolean;
  samplePath?: string;
}

export default function DocumentScannerPage() {
  const router = useRouter();

  // Step 1: Route & Dates
  const [originCountry, setOriginCountry] = useState('United Arab Emirates');
  const [selectedCountry, setSelectedCountry] = useState('France');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-15');
  const [purpose, setPurpose] = useState('Tourism');

  // Step 2: Staged Files
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');

  // Step 3: Scan Results
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // File Upload Handler (accepts multiple files)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newStaged: StagedFile[] = Array.from(files).map((f) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      file: f,
      name: f.name,
      size: f.size,
      docType: 'AUTO',
    }));

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setError(null);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateStagedDocType = (id: string, type: string) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, docType: type } : f))
    );
  };

  // Quick Preset Handlers
  const loadPreset = (presetKey: string, country: string, start: string, end: string) => {
    setSelectedCountry(country);
    setStartDate(start);
    setEndDate(end);

    let samples: Array<{ name: string; type: string; path: string }> = [];
    if (presetKey === 'france_covered') {
      samples = [
        { name: 'sample_passport.svg', type: 'PASSPORT', path: '/samples/sample_passport.svg' },
        { name: 'sample_visa.svg', type: 'VISA', path: '/samples/sample_visa.svg' },
        { name: 'sample_flight.svg', type: 'FLIGHT_BOOKING', path: '/samples/sample_flight.svg' },
        { name: 'sample_hotel.svg', type: 'HOTEL_BOOKING', path: '/samples/sample_hotel.svg' },
        { name: 'sample_insurance.svg', type: 'INSURANCE', path: '/samples/sample_insurance.svg' },
      ];
    } else if (presetKey === 'spain_blocked') {
      samples = [
        { name: 'sample_passport.svg', type: 'PASSPORT', path: '/samples/sample_passport.svg' },
        { name: 'sample_visa.svg', type: 'VISA', path: '/samples/sample_visa.svg' },
      ];
    } else if (presetKey === 'japan_novisa') {
      samples = [
        { name: 'sample_passport.svg', type: 'PASSPORT', path: '/samples/sample_passport.svg' },
        { name: 'sample_bank_statement.svg', type: 'BANK_STATEMENT', path: '/samples/sample_bank_statement.svg' },
        { name: 'sample_employment_letter.svg', type: 'EMPLOYMENT_LETTER', path: '/samples/sample_employment_letter.svg' },
      ];
    } else {
      samples = [
        { name: 'sample_passport.svg', type: 'PASSPORT', path: '/samples/sample_passport.svg' },
        { name: 'sample_flight.svg', type: 'FLIGHT_BOOKING', path: '/samples/sample_flight.svg' },
        { name: 'sample_hotel.svg', type: 'HOTEL_BOOKING', path: '/samples/sample_hotel.svg' },
        { name: 'sample_insurance.svg', type: 'INSURANCE', path: '/samples/sample_insurance.svg' },
        { name: 'sample_bank_statement.svg', type: 'BANK_STATEMENT', path: '/samples/sample_bank_statement.svg' },
        { name: 'sample_employment_letter.svg', type: 'EMPLOYMENT_LETTER', path: '/samples/sample_employment_letter.svg' },
      ];
    }

    const staged: StagedFile[] = samples.map((s) => ({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: s.name,
      docType: s.type,
      isPreset: true,
      samplePath: s.path,
    }));

    setStagedFiles(staged);
    setScanResult(null);
  };

  // Run the full scan & visa eligibility evaluation
  const handleRunScan = async () => {
    setIsScanning(true);
    setError(null);
    setScanProgress('Uploading and parsing documents with multimodal AI...');

    try {
      let res: Response;

      // Check if we have actual File objects or sample presets
      const hasRealFiles = stagedFiles.some((f) => Boolean(f.file));

      if (hasRealFiles) {
        const formData = new FormData();
        formData.append('origin', originCountry);
        formData.append('destination', selectedCountry);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('purpose', purpose);

        stagedFiles.forEach((staged) => {
          if (staged.file) {
            formData.append('files', staged.file);
            formData.append('docTypes', staged.docType);
          }
        });

        res = await fetch('/api/scan', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Preset / sample scan
        setScanProgress('Analyzing validity windows and destination rules...');
        res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: originCountry,
            destination: selectedCountry,
            startDate,
            endDate,
            purpose,
            samples: stagedFiles.map((f) => ({
              name: f.name,
              type: f.docType,
              path: f.samplePath,
            })),
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to scan documents');

      setScanResult(json);
      // Smooth scroll down to results
      setTimeout(() => {
        window.scrollTo({
          top: document.getElementById('scan-results-section')?.offsetTop || 500,
          behavior: 'smooth',
        });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Error executing document scan');
    } finally {
      setIsScanning(false);
    }
  };

  const checklist = scanResult?.assessment?.checklist || {
    good: [],
    missing: [],
    problems: [],
    expiringSoon: [],
  };

  const actionPlan = scanResult?.assessment?.actionPlan || [];
  const isCovered = scanResult?.assessment?.coverage?.verdict === 'COVERED';

  return (
    <div className="space-y-10 pb-16 max-w-4xl mx-auto">
      {/* Scanner Header */}
      <div className="space-y-3 border-b border-zinc-200 pb-6 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-300 bg-zinc-100 text-xs font-bold text-black uppercase tracking-wider">
          <Scan className="w-3.5 h-3.5" />
          Visa Document Scanner &amp; Eligibility Engine
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Scan Documents for Visa Approval
        </h1>

        <p className="text-sm text-zinc-600 max-w-2xl leading-relaxed">
          Upload all documents you have prepared for your trip. The scanner extracts key details, verifies if you already have visa coverage, checks for missing requirements, and tells you whether you are eligible for approval.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-zinc-400 bg-zinc-50 text-black text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-black" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Select Origin, Destination & Travel Dates */}
      <section className="p-6 sm:p-7 rounded-2xl border border-zinc-200 bg-white space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">
              Select Route &amp; Travel Dates
            </h2>
          </div>
          <span className="text-xs text-zinc-400">Required for immigration rules</span>
        </div>

        {/* Row 1: From Country -> Arrow -> Destination Country (STRICTLY ON SAME LINE) */}
        <div className="flex items-center gap-2 sm:gap-4 w-full">
          {/* Origin Country */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <label
              htmlFor="origin-country"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 truncate"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">From Country</span>
            </label>
            <div className="relative">
              <select
                id="origin-country"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full h-14 bg-zinc-50 hover:bg-white border-2 border-zinc-200 focus:border-black focus:bg-white rounded-xl px-3 sm:px-4 pr-9 text-xs sm:text-sm md:text-base font-semibold text-black focus:outline-none transition-all shadow-xs appearance-none cursor-pointer truncate"
              >
                {ORIGIN_COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Arrow Divider (in between on same line) */}
          <div className="shrink-0 flex items-center justify-center pt-5 sm:pt-6">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-black shadow-xs">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </div>
          </div>

          {/* Destination Country */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <label
              htmlFor="destination-country"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 truncate"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">Destination Country</span>
            </label>
            <div className="relative">
              <select
                id="destination-country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-14 bg-zinc-50 hover:bg-white border-2 border-zinc-200 focus:border-black focus:bg-white rounded-xl px-3 sm:px-4 pr-9 text-xs sm:text-sm md:text-base font-semibold text-black focus:outline-none transition-all shadow-xs appearance-none cursor-pointer truncate"
              >
                {DESTINATIONS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name} • {c.desc}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Below that - Departure Date & Arrival Date (STRICTLY ON SAME LINE BELOW) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-1">
          <div className="space-y-1.5">
            <label
              htmlFor="departure-date"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Departure Date</span>
            </label>
            <input
              id="departure-date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-14 bg-zinc-50 hover:bg-white border-2 border-zinc-200 focus:border-black focus:bg-white rounded-xl px-4 text-sm sm:text-base font-mono font-semibold text-black focus:outline-none transition-all shadow-xs cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="arrival-date"
              className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Arrival / Return Date</span>
            </label>
            <input
              id="arrival-date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-14 bg-zinc-50 hover:bg-white border-2 border-zinc-200 focus:border-black focus:bg-white rounded-xl px-4 text-sm sm:text-base font-mono font-semibold text-black focus:outline-none transition-all shadow-xs cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* STEP 2: Upload Documents (Multi-Document Upload Space) */}
      <section className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-black">
              Upload Prepared Travel Documents
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {stagedFiles.length} document{stagedFiles.length === 1 ? '' : 's'} prepared
          </span>
        </div>

        {/* Multi-File Upload Dropzone */}
        <div className="rounded-2xl border-2 border-dashed border-zinc-300 hover:border-black bg-zinc-50 p-8 text-center transition-colors relative cursor-pointer group">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          <div className="space-y-2 pointer-events-none">
            <div className="w-12 h-12 rounded-xl bg-white border border-zinc-300 text-black flex items-center justify-center mx-auto shadow-sm group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-sm text-black block">
                Tap to Select Multiple Documents or Drag &amp; Drop Here
              </span>
              <span className="text-xs text-zinc-500 mt-1 block">
                Passports, visas, flight vouchers, hotel reservations, bank statements, NOC letters, insurance policies (PDF, JPEG, PNG)
              </span>
            </div>
          </div>
        </div>

        {/* Demo Test Presets */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              One-Click Demo Test Presets:
            </span>
            <span className="text-[11px] text-zinc-400">Instantly pre-populate test documents</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => loadPreset('france_covered', 'France', '2026-06-01', '2026-06-12')}
              className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 hover:border-black text-black font-semibold transition-colors"
            >
              Test France (Visa Covered • 100%)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('spain_blocked', 'Spain', '2026-07-01', '2026-08-30')}
              className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 hover:border-black text-black font-semibold transition-colors"
            >
              Test Spain (Stay Limit / Blocker)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('japan_novisa', 'Japan', '2026-10-05', '2026-10-18')}
              className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 hover:border-black text-black font-semibold transition-colors"
            >
              Test Japan (Missing Flight/Hotel)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('standard_6', selectedCountry, startDate, endDate)}
              className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 font-semibold transition-colors"
            >
              Load Full 6-Doc Dossier
            </button>
          </div>
        </div>

        {/* Staged Document List */}
        {stagedFiles.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              Staged Files to Scan &amp; Save ({stagedFiles.length}):
            </span>

            <div className="space-y-2">
              {stagedFiles.map((staged) => (
                <div
                  key={staged.id}
                  className="p-3 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-black shrink-0" />
                    <div>
                      <span className="font-bold text-black block truncate max-w-xs">
                        {staged.name}
                      </span>
                      {staged.size && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {(staged.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={staged.docType}
                      onChange={(e) => updateStagedDocType(staged.id, e.target.value)}
                      className="bg-zinc-50 border border-zinc-300 text-black text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-black font-medium"
                    >
                      {DOC_TYPES.map((dt) => (
                        <option key={dt.value} value={dt.value}>
                          {dt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeStagedFile(staged.id)}
                      className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan Trigger Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning || stagedFiles.length === 0}
            className="w-full py-3.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{scanProgress || 'Scanning & Evaluating Documents...'}</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>Scan &amp; Check Visa Eligibility for {selectedCountry}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* STEP 3: SCAN RESULTS & ELIGIBILITY REPORT */}
      {scanResult && (
        <section id="scan-results-section" className="space-y-6 pt-4 border-t border-zinc-200 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" />
              Scan Results &amp; Visa Eligibility Report
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Saved to Vault • Case {scanResult.case?.caseCode}
            </span>
          </div>

          {/* Main High-Contrast Verdict Banner */}
          <VerdictBanner
            verdict={scanResult.assessment.verdict}
            score={scanResult.assessment.score}
            destination={selectedCountry}
            startDate={startDate}
            endDate={endDate}
            isCovered={isCovered}
            tripId={scanResult.trip?.id || ''}
            summaryMessage={scanResult.assessment.summaryMessage}
            onRecheck={handleRunScan}
            isRechecking={isScanning}
          />

          {/* Summary Box: What is missing vs what is verified */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Verified count */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Verified In Hand
              </span>
              <div className="text-2xl font-bold text-black flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-black" />
                {checklist.good.length} Document{checklist.good.length === 1 ? '' : 's'}
              </div>
              <span className="text-[11px] text-zinc-500">Satisfies consular rules</span>
            </div>

            {/* Missing count */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Missing Required
              </span>
              <div className="text-2xl font-bold text-black flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-black" />
                {checklist.missing.length} Item{checklist.missing.length === 1 ? '' : 's'}
              </div>
              <span className="text-[11px] text-zinc-500">Required before filing</span>
            </div>

            {/* Blockers count */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Blockers / Problems
              </span>
              <div className="text-2xl font-bold text-black flex items-center gap-2">
                <XCircle className="w-5 h-5 text-black" />
                {checklist.problems.length} Issue{checklist.problems.length === 1 ? '' : 's'}
              </div>
              <span className="text-[11px] text-zinc-500">Risk of visa refusal</span>
            </div>
          </div>

          {/* Detailed Consular Requirements Checklist */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Layers className="w-4 h-4 text-black" />
              Consular Document Requirements Checklist
            </h3>

            <div className="space-y-3">
              {/* 1. Missing Documents */}
              {checklist.missing.map((m: any, idx: number) => (
                <div
                  key={`missing-${m.id}-${idx}`}
                  className="p-4 rounded-xl border border-zinc-300 bg-zinc-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-sm">{m.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-black uppercase tracking-wider">
                        Missing
                      </span>
                    </div>
                    <p className="text-zinc-600">{m.description}</p>
                    <p className="text-black font-semibold pt-0.5">Consular Rule: {m.fix}</p>
                  </div>
                </div>
              ))}

              {/* 2. Blockers / Problems */}
              {checklist.problems.map((p: any, idx: number) => (
                <div
                  key={`prob-${p.id}-${idx}`}
                  className="p-4 rounded-xl border border-zinc-300 bg-zinc-50 flex items-start gap-3.5 text-xs"
                >
                  <div className="p-1 rounded-md bg-black text-white shrink-0 mt-0.5">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black text-sm">{p.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white uppercase tracking-wider">
                        Blocker
                      </span>
                    </div>
                    <p className="text-zinc-700">{p.description}</p>
                    <p className="text-black font-semibold pt-0.5">Action: {p.fix}</p>
                  </div>
                </div>
              ))}

              {/* 3. Verified Documents in hand */}
              {checklist.good.map((g: any, idx: number) => (
                <div
                  key={`good-${g.id}-${idx}`}
                  className="p-3.5 rounded-xl border border-zinc-200 bg-white flex items-start gap-3 text-xs"
                >
                  <div className="p-1 rounded-md bg-zinc-100 text-black shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-black">{g.title}</span>
                    <p className="text-zinc-500">{g.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ordered Action Plan for Visa Approval */}
          {actionPlan.length > 0 && (
            <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Clock className="w-4 h-4 text-black" />
                Step-by-Step Requirements for Visa Approval
              </h3>

              <div className="space-y-3">
                {actionPlan.map((item: any, idx: number) => (
                  <div
                    key={`plan-${item.id}-${idx}`}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-md bg-black text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {item.stepNumber}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-black text-sm">{item.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-black uppercase">
                            {item.urgency} Urgency
                          </span>
                        </div>
                        <p className="text-zinc-700">Action: {item.howToFix}</p>
                        <p className="text-zinc-500 text-[11px]">Why it matters: {item.whyThisMatters}</p>
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0 text-right">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                        Target Deadline
                      </span>
                      <span className="text-xs font-mono font-bold text-black">
                        {item.deadline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions: Vault & Company Portal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              href="/vault"
              className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-black transition-colors shadow-sm flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <FolderArchive className="w-4 h-4 text-black" />
                  Visa Vault
                </span>
                <div className="font-bold text-black text-sm">
                  View Saved Documents in Vault
                </div>
                <p className="text-[11px] text-zinc-500">
                  Access boarding pass details, passport numbers, and stay limits.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/agency"
              className="p-5 rounded-2xl border border-zinc-200 bg-black text-white hover:bg-zinc-800 transition-colors shadow-sm flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-white" />
                  Company Portal
                </span>
                <div className="font-bold text-white text-sm">
                  View in Company Operations Portal
                </div>
                <p className="text-[11px] text-zinc-400">
                  Case {scanResult.case?.caseCode} is pre-filled with zero retyping.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
