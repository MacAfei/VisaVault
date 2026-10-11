'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Plus,
  Trash2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { inclusiveDays, getTodayString } from '@/lib/clock';

export default function StayTrackerPage() {
  const [region, setRegion] = useState('SCHENGEN');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New record form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState('2026-04-01');
  const [newExitDate, setNewExitDate] = useState('2026-04-12');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadRecords = async () => {
    try {
      const res = await fetch(`/api/travel-records?region=${region}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load travel records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [region]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/travel-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          entryDate: newEntryDate,
          exitDate: newExitDate,
          notes: newNotes,
        }),
      });
      setShowAddForm(false);
      setNewNotes('');
      loadRecords();
    } catch (err) {
      console.error('Error adding record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/travel-records?id=${id}`, { method: 'DELETE' });
      loadRecords();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const stayStats = data?.stayStats || {
    daysUsedAsOfDate: 0,
    daysRemainingAsOfDate: 90,
  };

  const records = (data?.records || []).filter(
    (r: any) => r.region.toUpperCase() === region.toUpperCase()
  );

  const percentUsed = Math.min(100, Math.round((stayStats.daysUsedAsOfDate / 90) * 100));

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Wallet
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-black" />
            Stay Limit Tracker
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track Schengen 90/180-day rolling window stays or single-visit limits based on past travel records.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Entry / Exit Record
        </button>
      </div>

      {/* Region Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Region:</span>
        <div className="flex items-center gap-2">
          {['SCHENGEN', 'UK', 'USA', 'JAPAN'].map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                region === r
                  ? 'bg-black text-white'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:text-black'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Visual Gauge */}
      <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              {region} 90 / 180-Day Allowance Status
            </span>
            <h2 className="text-2xl font-bold text-black mt-1">
              {stayStats.daysUsedAsOfDate} Days Used • {stayStats.daysRemainingAsOfDate} Days Left
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-zinc-400 block font-mono">
              Reference: {getTodayString()}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                stayStats.daysRemainingAsOfDate <= 10
                  ? 'bg-zinc-100 text-black border-zinc-400'
                  : 'bg-black text-white border-black'
              }`}
            >
              {stayStats.daysRemainingAsOfDate <= 10 ? 'Near Limit' : 'Compliant'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
            <span>0 days</span>
            <span>45 days</span>
            <span>90 days (Max limit)</span>
          </div>
        </div>
      </div>

      {/* Inline Add Record Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddRecord}
          className="p-5 rounded-2xl border border-zinc-300 bg-zinc-50 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              Log Travel Entry &amp; Exit in {region}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-zinc-500 hover:text-black font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Entry Date</label>
              <input
                type="date"
                required
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-black font-mono focus:border-black focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Exit Date</label>
              <input
                type="date"
                required
                value={newExitDate}
                onChange={(e) => setNewExitDate(e.target.value)}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-black font-mono focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-zinc-700">Notes / Purpose (e.g. Holiday in Nice)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Vacation in Chamonix, France"
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-black focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-black text-white hover:bg-zinc-800 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      )}

      {/* Timeline of Past Entries/Exits */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-black" />
          Recorded Travel Stays Timeline ({records.length})
        </h2>

        {records.length > 0 ? (
          <div className="space-y-2.5">
            {records.map((rec: any) => {
              const stayDays = rec.exitDate
                ? inclusiveDays(rec.entryDate, rec.exitDate)
                : 1;

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-white flex items-center justify-between text-xs hover:border-black transition-colors shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-sm">
                        {stayDays} Days Stayed
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
                        {rec.region}
                      </span>
                    </div>

                    <div className="font-mono text-zinc-600">
                      {rec.entryDate} → {rec.exitDate || 'Present'}
                    </div>

                    {rec.notes && <div className="text-zinc-500 italic">{rec.notes}</div>}
                  </div>

                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 text-xs">
            No past entry records logged for {region}. Click &quot;Add Entry / Exit Record&quot; above to add one.
          </div>
        )}
      </section>
    </div>
  );
}
