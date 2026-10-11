'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plane,
  Calendar,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const DESTINATIONS = [
  { name: 'France', region: 'SCHENGEN', desc: 'Schengen Area • Paris, Nice, Lyon' },
  { name: 'Spain', region: 'SCHENGEN', desc: 'Schengen Area • Madrid, Barcelona' },
  { name: 'Germany', region: 'SCHENGEN', desc: 'Schengen Area • Berlin, Munich' },
  { name: 'United Kingdom', region: 'UK', desc: 'UKVI Standard Visitor • London' },
  { name: 'United States', region: 'USA', desc: 'US B1/B2 Visitor Visa • New York' },
  { name: 'Japan', region: 'JAPAN', desc: 'MOFA Short-Stay Tourism • Tokyo, Kyoto' },
];

export default function NewTripPage() {
  const router = useRouter();

  const [destination, setDestination] = useState('France');
  const [region, setRegion] = useState('SCHENGEN');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-12');
  const [purpose, setPurpose] = useState('TOURISM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (dest: typeof DESTINATIONS[0]) => {
    setDestination(dest.name);
    setRegion(dest.region);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          region,
          startDate,
          endDate,
          purpose,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create trip');

      router.push(`/trips/${json.trip.id}`);
    } catch (err: any) {
      setError(err.message || 'Error creating trip');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 text-zinc-900">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Wallet
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight flex items-center gap-2.5">
          <Plane className="w-7 h-7 text-black" />
          Plan New Trip &amp; Check Readiness
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600">
          Enter your planned travel details. VisaVault will instantly determine if your existing vault covers the trip or generate a complete requirements checklist.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-zinc-100 border border-zinc-300 text-black text-xs">
          {error}
        </div>
      )}

      {/* Preset Destinations Quick Select */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          Quick Select Destination:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DESTINATIONS.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => handleSelectPreset(d)}
              className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                destination === d.name
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-white border-zinc-200 text-zinc-800 hover:border-black'
              }`}
            >
              <div className="font-bold">{d.name}</div>
              <div className={destination === d.name ? 'text-zinc-300 text-[10px]' : 'text-zinc-500 text-[10px]'}>
                {d.region}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-5 shadow-sm"
      >
        {/* Destination & Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Destination Country
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-3 py-2 text-sm text-black focus:outline-none focus:bg-white focus:border-black"
                placeholder="e.g. France, Japan"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Immigration Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:bg-white focus:border-black font-semibold"
            >
              <option value="SCHENGEN">SCHENGEN (Europe 29 States)</option>
              <option value="UK">UNITED KINGDOM</option>
              <option value="USA">UNITED STATES</option>
              <option value="JAPAN">JAPAN</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-black" />
              Departure Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:bg-white focus:border-black font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-black" />
              Return Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:bg-white focus:border-black font-mono"
            />
          </div>
        </div>

        {/* Purpose */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Purpose of Visit
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['TOURISM', 'BUSINESS', 'TRANSIT'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  purpose === p
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-black'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Evaluating Immigration Rules...' : 'Run Trip Readiness Evaluation'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
