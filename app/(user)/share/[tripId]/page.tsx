'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/config';
import { maskDocumentNumber } from '@/lib/extract/mask';
import confetti from 'canvas-confetti';
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function ShareTripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [vaultDocs, setVaultDocs] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCase, setCreatedCase] = useState<{ caseId: string; caseCode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch evaluation
        const evalRes = await fetch(`/api/trips/${tripId}/evaluate`, { method: 'POST' });
        const evalJson = await evalRes.json();
        setAssessment(evalJson.assessment);

        // Fetch trips
        const tripRes = await fetch('/api/trips');
        const tripJson = await tripRes.json();
        const foundTrip = (tripJson.trips || []).find((t: any) => t.id === tripId);
        setTrip(foundTrip);

        // Fetch documents
        const docsRes = await fetch('/api/documents');
        const docsJson = await docsRes.json();
        const docs = (docsJson.documents || []).filter((d: any) => !d.supersededById);
        setVaultDocs(docs);
        // Default select all active documents
        setSelectedDocIds(docs.map((d: any) => d.id));
      } catch (err) {
        console.error('Error loading share data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      setError('You must confirm consent before transmitting your case pack.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const issues = [
      ...(assessment?.checklist?.problems || []),
      ...(assessment?.checklist?.missing || []),
    ];

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          consentAccepted: true,
          sharedDocumentIds: selectedDocIds,
          issues,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit case pack');

      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setCreatedCase(json);
    } catch (err: any) {
      setError(err.message || 'Error transmitting case pack to agency');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Preparing case pack and consent agreement...
      </div>
    );
  }

  // Success view with Case ID
  if (createdCase) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-black bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-full">
            Case Pack Transmitted Successfully
          </span>
          <h1 className="text-2xl font-bold text-black tracking-tight">
            Case ID: {createdCase.caseCode}
          </h1>
          <p className="text-sm text-zinc-600 max-w-md mx-auto">
            Your structured case pack has been safely received by{' '}
            <strong className="text-black">{APP_CONFIG.agencyName}</strong>. All extracted details and pre-vetted issues are now live in their inbox.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 text-left space-y-1">
          <div className="flex items-center gap-2 text-black font-semibold">
            <Lock className="w-4 h-4 text-black" />
            Your Privacy &amp; Consent Record:
          </div>
          <div>Version: {APP_CONFIG.consentVersion}</div>
          <div>Timestamp: {new Date().toLocaleString()}</div>
          <div>You may view status, upload replacement files, or delete your case anytime at the track link below.</div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/track/${createdCase.caseId}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-black text-white hover:bg-zinc-800 text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            Track My Case Pack
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors"
          >
            Return to Wallet
          </Link>
        </div>
      </div>
    );
  }

  const allProblems = [
    ...(assessment?.checklist?.problems || []),
    ...(assessment?.checklist?.missing || []),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Link
        href={`/trips/${tripId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Trip Readiness
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-black tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-black" />
          Share Case Pack with Visa Agency
        </h1>
        <p className="text-xs text-zinc-500">
          Hand off structured, pre-extracted application data to{' '}
          <strong className="text-black">{APP_CONFIG.agencyName}</strong>. Staff receive pre-vetted data so they never need to manually retype details from scans.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-400 text-black text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-black" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleShareSubmit} className="space-y-6">
        {/* Step 1: Document Selection */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-black" />
              1. Select Documents to Include in Case Pack
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {selectedDocIds.length} of {vaultDocs.length} selected
            </span>
          </div>

          <div className="space-y-2">
            {vaultDocs.map((doc) => {
              const isChecked = selectedDocIds.includes(doc.id);
              let data: any = {};
              try {
                data = JSON.parse(doc.extractedData || '{}');
              } catch {}

              const idNumber = data.passportNumber || data.idNumber || data.referenceNumber;

              return (
                <label
                  key={doc.id}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    isChecked
                      ? 'bg-zinc-50 border-black text-black'
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDoc(doc.id)}
                      className="rounded border-zinc-300 text-black focus:ring-black"
                    />
                    <div>
                      <span className="font-bold uppercase tracking-wide">
                        {doc.type.replace(/_/g, ' ')}
                      </span>
                      {idNumber && (
                        <span className="ml-2 font-mono text-[11px] text-zinc-500">
                          ({maskDocumentNumber(idNumber)})
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono">
                    Version {doc.version}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Step 2: Issues Preview */}
        {allProblems.length > 0 && (
          <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-black" />
              2. Pre-Identified Issues Transmitted to Agency Staff
            </h2>
            <p className="text-xs text-zinc-600">
              These pre-vetted warnings will be flagged on the agency data sheet so staff can help you correct them:
            </p>

            <div className="space-y-2 text-xs">
              {allProblems.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-800 space-y-0.5"
                >
                  <div className="font-bold text-black flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                    {p.title}
                  </div>
                  <div className="text-[11px] text-zinc-600 pl-3">Action: {p.fix}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Explicit Consent Checkbox */}
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black">
            <ShieldCheck className="w-4 h-4 text-black" />
            3. Required Applicant Consent ({APP_CONFIG.consentVersion})
          </div>

          <label className="flex items-start gap-3.5 cursor-pointer text-xs leading-relaxed text-zinc-800">
            <input
              type="checkbox"
              required
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 rounded border-zinc-300 text-black focus:ring-black w-4 h-4 shrink-0"
            />
            <div>
              <span className="font-semibold text-black">
                {APP_CONFIG.consentText}
              </span>
              <p className="text-zinc-500 text-[11px] mt-1">
                You retain complete control over your data. You may inspect status, upload replacement files, or delete your case and files at any time.
              </p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <Link
            href={`/trips/${tripId}`}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={!consentChecked || isSubmitting || selectedDocIds.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg bg-black text-white hover:bg-zinc-800 shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Transmitting Case Pack...' : 'Submit Case Pack with Consent'}
          </button>
        </div>
      </form>
    </div>
  );
}
