'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';

export default function AgencyLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('visa-vault-agent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agency/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Authentication failed');

      // Set localStorage session for convenience
      localStorage.setItem('agency_auth', 'true');
      router.push('/agency');
    } catch (err: any) {
      setError(err.message || 'Invalid agency password');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Traveler Home
      </Link>

      <div className="p-8 rounded-2xl border border-zinc-200 bg-white space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mx-auto shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-black tracking-tight">
            Agency Staff Portal
          </h1>
          <p className="text-xs text-zinc-500">
            {APP_CONFIG.agencyName} • Visa Operations &amp; Pre-Vetting Console
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-400 text-black text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-black" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Agency Master Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-lg pl-9 pr-3 py-2 text-sm text-black focus:outline-none focus:border-black font-mono"
                placeholder="Enter password..."
              />
            </div>
            <div className="text-[11px] text-zinc-400">
              Demo credentials pre-filled: <code className="text-zinc-700">visa-vault-agent</code>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-40"
          >
            {isLoading ? 'Authenticating...' : 'Access Agency Console'}
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 text-center">
          Notice: Protected by AGENCY_PASSWORD for hackathon demo. Production deployments enforce SAML / SSO authentication.
        </div>
      </div>
    </div>
  );
}
