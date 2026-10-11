'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Layers, MapPin, Eye } from 'lucide-react';
import { daysBetween, getTodayString } from '@/lib/clock';

interface WalletCardProps {
  visa: {
    id: string;
    documentId: string;
    country: string;
    region: string;
    visaType: string;
    entries: string;
    validFrom: string;
    validUntil: string;
    maxStayDays: number;
    status: string;
  };
  daysRemainingInWindow?: number;
  entriesRemaining?: number;
}

export function WalletCard({
  visa,
  daysRemainingInWindow = 59,
  entriesRemaining = 999,
}: WalletCardProps) {
  const today = getTodayString();
  const daysUntilExpiry = daysBetween(today, visa.validUntil);
  const isExpired = daysUntilExpiry <= 0;

  return (
    <div className="rounded-2xl p-5 bg-white border border-zinc-200 hover:border-black transition-all shadow-sm flex flex-col justify-between text-zinc-900">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-black">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider block">
                {visa.region}
              </span>
              <h3 className="text-base font-bold text-black tracking-tight flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                {visa.country}
              </h3>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
              isExpired
                ? 'bg-zinc-200 text-zinc-800 border-zinc-400'
                : 'bg-zinc-100 text-black border-zinc-300'
            }`}
          >
            {isExpired ? 'EXPIRED' : visa.status}
          </span>
        </div>

        {/* Visa Subtype & Details */}
        <div className="space-y-2 py-3 border-y border-zinc-200 text-xs">
          <div className="flex items-center justify-between text-zinc-600">
            <span>Visa Category</span>
            <span className="font-semibold text-zinc-900">{visa.visaType}</span>
          </div>

          <div className="flex items-center justify-between text-zinc-600">
            <span>Validity Window</span>
            <span className="font-mono text-zinc-900 font-medium">
              {visa.validFrom} → {visa.validUntil}
            </span>
          </div>

          <div className="flex items-center justify-between text-zinc-600">
            <span>Entries Permitted</span>
            <span className="font-semibold text-zinc-900 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              {entriesRemaining === 999 ? 'MULTIPLE' : `${entriesRemaining} Left`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-4 mt-2 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
            Days Left in Window
          </span>
          <span className="text-sm font-bold text-black">
            {daysRemainingInWindow} / {visa.maxStayDays} days
          </span>
        </div>

        <Link
          href={`/vault/${visa.documentId}`}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-black hover:text-white text-zinc-900 transition-colors border border-zinc-300"
        >
          <Eye className="w-3.5 h-3.5" />
          View Sticker
        </Link>
      </div>
    </div>
  );
}
