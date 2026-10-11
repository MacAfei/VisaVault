'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { VerdictBanner } from '@/components/VerdictBanner';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  ArrowLeft,
  Layers,
  AlertCircle,
} from 'lucide-react';

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [tripData, setTripData] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRechecking, setIsRechecking] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'problems' | 'missing' | 'good'>('all');

  const loadTripData = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/evaluate`, { method: 'POST' });
      const json = await res.json();
      if (json.assessment) {
        setAssessment(json.assessment);
      }

      // Also fetch trip details
      const tripsRes = await fetch('/api/trips');
      const tripsJson = await tripsRes.json();
      const currentTrip = (tripsJson.trips || []).find((t: any) => t.id === tripId);
      if (currentTrip) {
        setTripData(currentTrip);
      }
    } catch (err) {
      console.error('Failed to load trip evaluation:', err);
    } finally {
      setIsLoading(false);
      setIsRechecking(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const handleRecheck = () => {
    setIsRechecking(true);
    loadTripData();
  };

  if (isLoading || !assessment) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-black animate-spin mx-auto" />
        <h2 className="text-base font-bold text-black">Evaluating Immigration &amp; Visa Rules...</h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Running deterministic checks across validity windows, rolling stay limits, and consular requirements.
        </p>
      </div>
    );
  }

  const isCovered = assessment.coverage?.verdict === 'COVERED';
  const isPartial = assessment.coverage?.verdict === 'PARTIAL';
  const hasExistingVisaMatch = isCovered || isPartial;

  const checklist = assessment.checklist || {
    good: [],
    missing: [],
    problems: [],
    expiringSoon: [],
  };

  const actionPlan = assessment.actionPlan || [];

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Wallet
        </Link>

        <span className="text-[11px] text-zinc-400 font-mono">
          Rules verified: {assessment.rulesLastReviewed || '2026-04-15'}
        </span>
      </div>

      {/* Main Verdict Banner */}
      <VerdictBanner
        verdict={assessment.verdict}
        score={assessment.score}
        destination={tripData?.destination || 'Destination'}
        startDate={tripData?.startDate || ''}
        endDate={tripData?.endDate || ''}
        isCovered={isCovered}
        tripId={tripId}
        summaryMessage={assessment.summaryMessage}
        onRecheck={handleRecheck}
        isRechecking={isRechecking}
      />

      {/* Coverage Card (if existing visa was evaluated) */}
      {hasExistingVisaMatch && (
        <section className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black" />
              Existing Visa Evaluation
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isCovered
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-zinc-100 text-zinc-800 border-zinc-300'
              }`}
            >
              {assessment.coverage.verdict}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Matched Visa</span>
              <span className="font-bold text-black text-sm">
                {assessment.coverage.matchedVisa?.visaType || 'Tourist Visa'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Validity Period</span>
              <span className="font-mono text-zinc-900">
                {assessment.coverage.matchedVisa?.validFrom} → {assessment.coverage.matchedVisa?.validUntil}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Entries Available</span>
              <span className="font-bold text-black">
                {assessment.coverage.details.entriesRemaining === 999
                  ? 'Multiple Entries'
                  : `${assessment.coverage.details.entriesRemaining} Left`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Days in Window</span>
              <span className="font-bold text-zinc-900">
                {assessment.coverage.details.daysRemainingInWindow} days remaining
              </span>
            </div>
          </div>

          {/* Specific problems identified on existing visa */}
          {assessment.coverage.reasons && assessment.coverage.reasons.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Evaluation Findings:
              </span>
              {assessment.coverage.reasons.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-zinc-300 bg-zinc-50 flex items-start gap-3 text-xs"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                  <div className="space-y-1">
                    <div className="font-bold text-black">{r.message}</div>
                    <div className="text-zinc-600">Action: {r.fix}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Ordered Action Plan with Deadlines */}
      {actionPlan.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" />
                Ordered Action Plan &amp; Deadlines
              </h2>
              <p className="text-xs text-zinc-500">
                Sequential action steps with target deadlines to guarantee submission readiness
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {actionPlan.map((item: any, idx: number) => (
              <div
                key={`${item.id}-${idx}`}
                className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-black transition-colors shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {item.stepNumber}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-black text-sm">{item.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {item.urgency} Urgency
                      </span>
                    </div>

                    <div className="text-zinc-700">
                      <span className="font-semibold text-black">Action: </span>
                      {item.howToFix}
                    </div>

                    <div className="text-zinc-500">
                      <span className="font-semibold text-zinc-700">Reason: </span>
                      {item.whyThisMatters}
                    </div>
                  </div>
                </div>

                <div className="self-end md:self-center shrink-0 text-right">
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
        </section>
      )}

      {/* Grouped Requirements Checklist */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-black tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-black" />
              Consular Requirements Checklist
            </h2>
            <p className="text-xs text-zinc-500">
              Deterministic verification against {assessment.destination || tripData?.destination} criteria
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'all' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'problems' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Problems ({checklist.problems.length})
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'missing' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Missing ({checklist.missing.length})
            </button>
            <button
              onClick={() => setActiveTab('good')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'good' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Verified ({checklist.good.length})
            </button>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3">
          {/* 1. Problems / Blockers */}
          {(activeTab === 'all' || activeTab === 'problems') &&
            checklist.problems.map((p: any, idx: number) => (
              <div
                key={`${p.id}-${idx}`}
                className="p-4 rounded-xl border border-zinc-300 bg-zinc-50 flex items-start gap-3.5 text-xs shadow-sm"
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

          {/* 2. Missing Documents */}
          {(activeTab === 'all' || activeTab === 'missing') &&
            checklist.missing.map((m: any, idx: number) => (
              <div
                key={`${m.id}-${idx}`}
                className="p-4 rounded-xl border border-zinc-300 bg-zinc-50 flex items-start justify-between gap-3.5 text-xs shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-1 rounded-md bg-zinc-200 text-zinc-900 shrink-0 mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-sm">{m.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 uppercase tracking-wider">
                        Missing
                      </span>
                    </div>
                    <p className="text-zinc-600">{m.description}</p>
                    <p className="text-black font-semibold pt-0.5">Action: {m.fix}</p>
                  </div>
                </div>

                <Link
                  href="/vault/add"
                  className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 font-bold shrink-0 self-center transition-colors"
                >
                  Upload Now
                </Link>
              </div>
            ))}

          {/* 3. Expiring Soon / Warnings */}
          {(activeTab === 'all' || activeTab === 'problems') &&
            checklist.expiringSoon.map((e: any, idx: number) => (
              <div
                key={`${e.id}-${idx}`}
                className="p-4 rounded-xl border border-zinc-200 bg-white flex items-start gap-3.5 text-xs"
              >
                <div className="p-1 rounded-md bg-zinc-100 text-zinc-700 shrink-0 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-black">{e.title}</span>
                  <p className="text-zinc-600">{e.description}</p>
                  <p className="text-black font-semibold pt-0.5">Action: {e.fix}</p>
                </div>
              </div>
            ))}

          {/* 4. Good / Verified */}
          {(activeTab === 'all' || activeTab === 'good') &&
            checklist.good.map((g: any, idx: number) => (
              <div
                key={`${g.id}-${idx}`}
                className="p-4 rounded-xl border border-zinc-200 bg-white flex items-start gap-3.5 text-xs"
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
      </section>

      {/* Share with Agency Floating Banner */}
      <div className="p-6 rounded-2xl border border-zinc-200 bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-white" />
            Ready to hand off to an expert visa agency?
          </h3>
          <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
            Send your structured, pre-extracted case pack with explicit consent to GlobalPass Visa Services. Staff can immediately pre-vet and book your consular submission slot with zero manual typing.
          </p>
        </div>

        <Link
          href={`/share/${tripId}`}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-white text-black hover:bg-zinc-100 shadow transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Share with Agency
        </Link>
      </div>

      <div className="pt-2">
        <PrivacyNotice />
      </div>
    </div>
  );
}
