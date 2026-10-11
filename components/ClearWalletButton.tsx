'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RefreshCw } from 'lucide-react';

export function ClearWalletButton() {
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear your travel wallet? All scanned documents will be removed so you can test from a clean slate.')) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await fetch('/api/vault/clear', { method: 'POST' });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={isClearing}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 hover:text-black border border-zinc-300 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
      title="Clear all documents and start fresh"
    >
      {isClearing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      <span>Clear Wallet</span>
    </button>
  );
}
