'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Send,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface VerdictBannerProps {
  verdict: 'READY' | 'ALMOST_READY' | 'NEEDS_ACTION' | 'BLOCKED';
  score: number;
  destination: string;
  startDate: string;
  endDate: string;
  isCovered: boolean;
  tripId?: string;
  summaryMessage: string;
  onRecheck?: () => void;
  isRechecking?: boolean;
}

export function VerdictBanner({
  verdict,
  score,
  destination,
  startDate,
  endDate,
  isCovered,
  tripId,
  summaryMessage,
  onRecheck,
  isRechecking = false,
}: VerdictBannerProps) {
  const getVerdictBadge = () => {
    switch (verdict) {
      case 'READY':
        return 'bg-black text-white border-black';
      case 'ALMOST_READY':
        return 'bg-zinc-200 text-zinc-900 border-zinc-400';
      case 'NEEDS_ACTION':
        return 'bg-zinc-100 text-zinc-900 border-zinc-300';
      case 'BLOCKED':
      default:
        return 'bg-zinc-900 text-white border-black';
    }
  };

  return (
    <div className="rounded-2xl border-2 border-black p-6 bg-white shadow-sm relative overflow-hidden text-black">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Verdict & Headline */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-300 text-black shrink-0">
            {verdict === 'READY' ? (
              <CheckCircle2 className="w-7 h-7 text-black" />
            ) : verdict === 'BLOCKED' ? (
              <XCircle className="w-7 h-7 text-black" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-black" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${getVerdictBadge()}`}
              >
                {verdict.replace('_', ' ')}
              </span>

              {isCovered && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-black" />
                  Existing Visa Applied
                </span>
              )}

              <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {startDate} → {endDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
              {isCovered
                ? 'Good to Go! Existing Visa Covers This Trip'
                : verdict === 'READY'
                ? 'Application Dossier Ready for Filing'
                : verdict === 'BLOCKED'
                ? 'Travel Blocked • Action Required'
                : 'Action Required • Requirements Incomplete'}
            </h1>

            <p className="text-sm text-zinc-700 max-w-2xl leading-relaxed">
              {summaryMessage}
            </p>
          </div>
        </div>

        {/* Right Side: Score Gauge & Actions */}
        <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block">
                Readiness Score
              </span>
              <span className="text-xs text-zinc-400">Based on rule weights</span>
            </div>

            <div className="w-16 h-16 rounded-xl border-2 border-black flex items-center justify-center bg-zinc-50 shadow-inner">
              <span className="text-xl font-black text-black">
                {score}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold ml-0.5">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onRecheck && (
              <button
                onClick={onRecheck}
                disabled={isRechecking}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 transition-colors border border-zinc-300 disabled:opacity-50"
                title="Re-run evaluation engine against vault"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                Re-check
              </button>
            )}

            {tripId && (
              <Link
                href={`/share/${tripId}`}
                className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-black hover:bg-zinc-800 text-white transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Share with Agency
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
