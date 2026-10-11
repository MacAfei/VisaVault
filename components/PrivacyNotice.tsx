'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export function PrivacyNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
        <ShieldCheck className="w-4 h-4 text-black shrink-0" />
        <span>{APP_CONFIG.disclaimer}</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs text-zinc-600 flex items-start gap-3">
      <div className="p-1.5 bg-zinc-200 text-zinc-900 rounded-lg shrink-0 mt-0.5">
        <Info className="w-4 h-4" />
      </div>
      <div className="space-y-0.5">
        <span className="font-semibold text-zinc-900">Privacy &amp; Guidance Notice: </span>
        <span>{APP_CONFIG.disclaimer}</span>
      </div>
    </div>
  );
}
