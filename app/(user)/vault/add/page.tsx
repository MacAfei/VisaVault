'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocViewer } from '@/components/DocViewer';
import { FieldEditor } from '@/components/FieldEditor';
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

const DOC_TYPES = [
  'PASSPORT',
  'VISA',
  'RESIDENCE_PERMIT',
  'FLIGHT_BOOKING',
  'HOTEL_BOOKING',
  'INSURANCE',
  'BANK_STATEMENT',
  'EMPLOYMENT_LETTER',
  'PHOTO',
  'APPLICATION_RECEIPT',
  'REJECTION_LETTER',
];

const PRESET_SAMPLES = [
  { label: 'Passport Scan', file: 'sample_passport.svg', type: 'PASSPORT' },
  { label: 'Schengen Visa', file: 'sample_visa.svg', type: 'VISA' },
  { label: 'Flight Booking', file: 'sample_flight.svg', type: 'FLIGHT_BOOKING' },
  { label: 'Hotel Voucher', file: 'sample_hotel.svg', type: 'HOTEL_BOOKING' },
  { label: 'Travel Insurance', file: 'sample_insurance.svg', type: 'INSURANCE' },
  { label: 'Bank Statement', file: 'sample_bank_statement.svg', type: 'BANK_STATEMENT' },
  { label: 'Employer NOC Letter', file: 'sample_employment_letter.svg', type: 'EMPLOYMENT_LETTER' },
  { label: 'UAE Residence Permit', file: 'sample_residence_permit.svg', type: 'RESIDENCE_PERMIT' },
  { label: 'Passport Photo', file: 'sample_photo.svg', type: 'PHOTO' },
];

export default function AddDocumentPage() {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState('PASSPORT');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);
  const [confidenceNotes, setConfidenceNotes] = useState<string | null>(null);
  const [userEdited, setUserEdited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractionSource, setExtractionSource] = useState<string | null>(null);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds the 10 MB limit. Please select a smaller file.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', selectedType);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');

      setFileUrl(json.fileUrl);
      setFileName(json.fileName);
      setExtractedData(json.extractedData);
      setConfidenceNotes(json.confidenceNotes);
      setExtractionSource(json.source);
      if (json.docType && json.docType !== selectedType) {
        setSelectedType(json.docType);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract document details');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset sample picker handler
  const handleSelectPreset = async (sample: typeof PRESET_SAMPLES[0]) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedType(sample.type);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: sample.file,
          sampleUrl: `/samples/${sample.file}`,
          docType: sample.type,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to parse preset');

      setFileUrl(json.fileUrl);
      setFileName(sample.file);
      setExtractedData(json.extractedData);
      setConfidenceNotes(json.confidenceNotes);
      setExtractionSource(json.source);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error parsing sample document');
    } finally {
      setIsLoading(false);
    }
  };

  // Save to Vault
  const handleSaveToVault = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          fileUrl: fileUrl || '/samples/sample_passport.svg',
          extractedData,
          confidenceNotes,
          userEdited,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save document');

      router.push('/vault');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save document');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto text-zinc-900">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/vault"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Vault
        </Link>

        {extractionSource && (
          <span className="text-[11px] font-semibold text-black bg-zinc-100 border border-zinc-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-black" />
            Extracted via {extractionSource === 'GEMINI' ? 'Gemini Multimodal' : 'Demo Engine'}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
          Add &amp; Verify Document
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600">
          Upload an image or PDF. The multimodal AI extracts structured fields with confidence scores for your review.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-300 text-black text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload & Preset Options */}
      {!extractedData ? (
        <div className="space-y-6">
          {/* Main Upload Box */}
          <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 sm:p-12 text-center hover:border-black transition-colors relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="space-y-3 pointer-events-none">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-black border border-zinc-300 flex items-center justify-center mx-auto">
                {isLoading ? (
                  <RefreshCw className="w-7 h-7 animate-spin text-black" />
                ) : (
                  <UploadCloud className="w-7 h-7 text-black" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-black">
                  {isLoading ? 'Extracting with Gemini Multimodal...' : 'Tap to scan with camera or upload file'}
                </h3>
                <p className="text-xs text-zinc-500">
                  Accepts JPG, PNG, WebP, SVG, and PDF (Max 10 MB)
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 bg-white px-3 py-1 rounded-full border border-zinc-200">
                  <Camera className="w-3.5 h-3.5" /> Camera Enabled
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 bg-white px-3 py-1 rounded-full border border-zinc-200">
                  <FileCheck className="w-3.5 h-3.5" /> PDF OCR
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Sample Picker */}
          <div className="rounded-2xl p-6 bg-white border border-zinc-200 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Or Try Sample Documents (1-Click Demo Testing)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_SAMPLES.map((sample) => (
                <button
                  key={sample.file}
                  type="button"
                  onClick={() => handleSelectPreset(sample)}
                  disabled={isLoading}
                  className="px-3 py-2 text-left rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-black text-xs transition-all disabled:opacity-50"
                >
                  <div className="font-semibold text-zinc-900">{sample.label}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{sample.type}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Review & Verification Split View */
        <div className="space-y-6">
          {/* Document Type Override Bar */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Document Category:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs font-bold bg-white border border-zinc-300 text-black rounded-lg px-3 py-1.5 focus:outline-none focus:border-black"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setFileUrl(null);
              }}
              className="text-xs font-semibold text-zinc-600 hover:text-black transition-colors underline"
            >
              Upload Different File
            </button>
          </div>

          {/* Side-by-side or stacked grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Original Scan */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Original Document
              </span>
              <DocViewer
                fileUrl={fileUrl || '/samples/sample_passport.svg'}
                docType={selectedType}
                fileName={fileName || undefined}
              />
            </div>

            {/* Right: Extracted Fields Review */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
              <FieldEditor
                fields={extractedData}
                confidenceNotes={confidenceNotes}
                userEdited={userEdited}
                onSave={(updated) => {
                  setExtractedData(updated);
                  setUserEdited(true);
                }}
              />

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/vault')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors border border-zinc-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveToVault}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-black hover:bg-zinc-800 text-white transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? 'Saving to Vault...' : 'Save Document to Vault'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
