'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  UploadCloud,
  Send,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Lock,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'NEW', label: 'Received' },
  { key: 'NEEDS_FIXES', label: 'Fixes Requested' },
  { key: 'READY_TO_SUBMIT', label: 'Ready to Submit' },
  { key: 'SUBMITTED', label: 'Submitted to Consulate' },
];

export default function TrackCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [caseData, setCaseData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replacement upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('INSURANCE');
  const [isUploading, setIsUploading] = useState(false);

  const loadCase = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const json = await res.json();
      if (json.case) {
        setCaseData(json.case);
        setMessages(json.case.messages || []);
      }
    } catch (err) {
      console.error('Error loading case:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TRAVELER',
          text: replyText.trim(),
        }),
      });

      const json = await res.json();
      if (json.message) {
        setMessages((prev) => [...prev, json.message]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReplacementUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', uploadDocType);

    try {
      const extRes = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });
      const extJson = await extRes.json();

      // Save document to vault
      await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: uploadDocType,
          fileUrl: extJson.fileUrl,
          extractedData: extJson.extractedData,
          confidenceNotes: extJson.confidenceNotes,
        }),
      });

      // Post notification message to agency
      await fetch(`/api/cases/${caseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TRAVELER',
          text: `I have uploaded an updated replacement document (${uploadDocType.replace(/_/g, ' ')}). Please re-inspect my case.`,
        }),
      });

      setShowUploadModal(false);
      loadCase();
    } catch (err) {
      console.error('Error uploading replacement document:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!confirm('Are you sure you want to delete this case and remove all shared files from agency access? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
      router.push('/');
    } catch (err) {
      console.error('Failed to delete case:', err);
      setIsDeleting(false);
    }
  };

  if (isLoading || !caseData) {
    return (
      <div className="py-24 text-center text-zinc-500 text-sm">
        Loading case tracking details...
      </div>
    );
  }

  const currentStatus = caseData.status;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Wallet
      </Link>

      {/* Case Header */}
      <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-400 block">
              Active Assistance Case
            </span>
            <h1 className="text-2xl font-bold text-black tracking-tight">
              Case {caseData.caseCode}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-zinc-500 block font-mono">
              Opened: {new Date(caseData.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-zinc-500">Destination: {caseData.trip?.destination}</span>
          </div>
        </div>

        {/* Workflow Status Progress Timeline */}
        <div className="pt-4 border-t border-zinc-100">
          <div className="grid grid-cols-4 gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="space-y-2 text-center">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isPast
                        ? isCurrent
                          ? 'bg-black'
                          : 'bg-zinc-400'
                        : 'bg-zinc-100'
                    }`}
                  />
                  <span
                    className={`text-[11px] block font-semibold leading-tight ${
                      isCurrent
                        ? 'text-black font-bold'
                        : isPast
                        ? 'text-zinc-700'
                        : 'text-zinc-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Issues Requiring Action */}
      {caseData.caseIssues && caseData.caseIssues.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-black" />
            Case Dossier Notes &amp; Action Items
          </h2>

          <div className="space-y-2 text-xs">
            {caseData.caseIssues.map((iss: any) => (
              <div
                key={iss.id}
                className="p-3.5 rounded-xl border border-zinc-300 bg-zinc-50 flex items-start gap-3"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-black">{iss.message}</div>
                  <div className="text-zinc-600">Suggestion: {iss.fixSuggestion}</div>
                  {iss.agentNote && (
                    <div className="text-black font-semibold pt-1">
                      Staff Note: {iss.agentNote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Replacement Document Upload Action */}
      <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-black flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-black" />
            Need to provide an updated or corrected document?
          </h3>
          <p className="text-xs text-zinc-500">
            Upload replacement insurance, bank statements, or flight bookings directly to this case.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(!showUploadModal)}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-white hover:bg-zinc-100 text-black border border-zinc-300 transition-colors shrink-0"
        >
          {showUploadModal ? 'Close Form' : 'Upload Replacement'}
        </button>
      </div>

      {showUploadModal && (
        <div className="p-5 rounded-2xl border border-zinc-300 bg-white space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
              Document Category:
            </label>
            <select
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              className="text-xs font-bold bg-white border border-zinc-300 text-black rounded-lg px-3 py-1.5 focus:outline-none focus:border-black"
            >
              <option value="INSURANCE">INSURANCE</option>
              <option value="BANK_STATEMENT">BANK STATEMENT</option>
              <option value="FLIGHT_BOOKING">FLIGHT BOOKING</option>
              <option value="HOTEL_BOOKING">HOTEL BOOKING</option>
              <option value="EMPLOYMENT_LETTER">EMPLOYMENT LETTER</option>
              <option value="PASSPORT">PASSPORT</option>
            </select>
          </div>

          <div className="rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center hover:border-black relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleReplacementUpload}
              disabled={isUploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="text-xs text-zinc-600 space-y-1">
              <UploadCloud className="w-6 h-6 text-black mx-auto" />
              <div className="font-semibold text-black">
                {isUploading ? 'Extracting & Updating...' : 'Tap to select corrected document'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Messaging with Agency */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-black" />
          Agency Communication &amp; Fix Requests
        </h2>

        {/* Message Thread */}
        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-3 max-h-[360px] overflow-y-auto">
          {messages.length > 0 ? (
            messages.map((m: any) => {
              const isAgency = m.from === 'AGENCY';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAgency ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-1 leading-relaxed ${
                      isAgency
                        ? 'bg-white text-zinc-900 border border-zinc-200 rounded-tl-sm shadow-sm'
                        : 'bg-black text-white rounded-tr-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] font-bold opacity-75">
                      <span>{isAgency ? 'Agency Specialist' : 'You (Applicant)'}</span>
                      <span className="font-mono">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>{m.text}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-xs text-zinc-400">
              No messages yet in this case thread.
            </div>
          )}
        </div>

        {/* Message Reply Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to visa agency specialist..."
            className="flex-1 bg-white border border-zinc-300 rounded-lg px-4 py-2 text-xs text-black focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={isSending || !replyText.trim()}
            className="px-4 py-2 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </section>

      {/* Privacy Deletion Section */}
      <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Lock className="w-4 h-4 text-zinc-400" />
          <span>You have full ownership of your data under applicable privacy laws.</span>
        </div>

        <button
          onClick={handleDeleteCase}
          disabled={isDeleting}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-100 text-black border border-zinc-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isDeleting ? 'Deleting Case...' : 'Delete My Case and Files'}
        </button>
      </div>
    </div>
  );
}
