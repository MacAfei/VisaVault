'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocViewer } from '@/components/DocViewer';
import { generateCoveringLetter } from '@/lib/generate/coveringLetter';
import { generateItinerary, ItineraryDay } from '@/lib/generate/itinerary';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
  MessageSquare,
  Layers,
  Send,
  Eye,
} from 'lucide-react';

export default function AgencyCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<any>(null);
  const [traveler, setTraveler] = useState<any>(null);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const [visaHistory, setVisaHistory] = useState<any[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'datasheet' | 'sidebyside' | 'issues' | 'generate' | 'history'>('datasheet');

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);

  // Status state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Fix request state
  const [whatsappText, setWhatsappText] = useState('');
  const [isSendingFixRequest, setIsSendingFixRequest] = useState(false);
  const [fixSentSuccess, setFixSentSuccess] = useState(false);

  // Letter & Itinerary state
  const [coveringLetter, setCoveringLetter] = useState('');
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);

  const loadCaseDetail = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const json = await res.json();
      if (json.case) {
        setCaseData(json.case);
        setTraveler(json.traveler);
        setSharedDocs(json.sharedDocs || []);
        setVisaHistory(json.visaHistory || []);

        // Initialize covering letter and itinerary
        const passportDoc = (json.sharedDocs || []).find((d: any) => d.type === 'PASSPORT');
        let passportData: any = {};
        try {
          passportData = JSON.parse(passportDoc?.extractedData || '{}');
        } catch {}

        const letter = generateCoveringLetter({
          applicantName: traveler?.fullName || json.case.trip?.user?.name || 'Applicant',
          passportNumber: passportData.passportNumber || 'A87654321',
          nationality: traveler?.nationality || 'IND',
          residenceCountry: traveler?.countryOfResidence || 'UAE',
          destination: json.case.trip?.destination || 'Destination',
          travelStartDate: json.case.trip?.startDate || '',
          travelEndDate: json.case.trip?.endDate || '',
          purpose: json.case.trip?.purpose || 'Tourism',
        });
        setCoveringLetter(letter);

        const itin = generateItinerary({
          destination: json.case.trip?.destination || 'Europe',
          startDate: json.case.trip?.startDate || '2026-06-01',
          endDate: json.case.trip?.endDate || '2026-06-15',
        });
        setItineraryDays(itin);

        // Pre-build WhatsApp Fix Request text
        const blockers = (json.case.caseIssues || []).filter((i: any) => i.severity === 'BLOCKER');
        const fixLines = blockers.map((b: any, idx: number) => `${idx + 1}. ${b.message} (Fix: ${b.fixSuggestion})`).join('\n');
        setWhatsappText(
          `*Hello ${traveler?.fullName || 'Client'}*, this is your visa specialist from GlobalPass Visa Services regarding your application for ${json.case.trip?.destination} (Case ${json.case.caseCode}).\n\nOur pre-check identified the following items requiring your attention before consular submission:\n${fixLines || '1. Please review and confirm your dates.'}\n\nYou can upload updated documents directly on your track link: ${typeof window !== 'undefined' ? window.location.origin : ''}/track/${json.case.id}\n\nThank you!`
        );
      }
    } catch (err) {
      console.error('Error loading case detail:', err);
    }
  };

  useEffect(() => {
    loadCaseDetail();
  }, [caseId]);

  // Aggregate all extracted fields across shared documents into flat map
  const aggregateFields = () => {
    const fields: Array<{ category: string; key: string; value: string; docType: string; isEdited: boolean }> = [];

    for (const doc of sharedDocs) {
      let data: any = {};
      try {
        data = JSON.parse(doc.extractedData || '{}');
      } catch {}

      for (const [k, v] of Object.entries(data)) {
        if (k === 'confidenceNotes' || v === null || v === undefined) continue;
        fields.push({
          category: doc.type.replace(/_/g, ' '),
          key: k.replace(/([A-Z])/g, ' $1').trim(),
          value: String(v),
          docType: doc.type,
          isEdited: Boolean(doc.userEdited),
        });
      }
    }
    return fields;
  };

  const fieldsList = aggregateFields();

  const handleCopySingle = (val: string, keyId: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const text = fieldsList.map((f) => `[${f.category}] ${f.key}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopyAllSuccess(true);
    setTimeout(() => setCopyAllSuccess(false), 2000);
  };

  const handleExportJson = () => {
    const exportObj: Record<string, any> = {};
    for (const doc of sharedDocs) {
      try {
        exportObj[doc.type] = JSON.parse(doc.extractedData || '{}');
      } catch {}
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Case_${caseData.caseCode}_ApplicationData.json`;
    a.click();
  };

  const handleExportCsv = () => {
    const header = 'Document,Field,Value\n';
    const rows = fieldsList.map((f) => `"${f.category}","${f.key}","${f.value.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Case_${caseData.caseCode}_ApplicationData.csv`;
    a.click();
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      if (res.ok) {
        setStatusNote('');
        loadCaseDetail();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAcknowledgeIssue = async (issueId: string, currentVal: boolean) => {
    try {
      await fetch(`/api/cases/${caseId}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedByAgent: !currentVal }),
      });
      loadCaseDetail();
    } catch (err) {
      console.error('Error acknowledging issue:', err);
    }
  };

  const handleSendFixRequest = async () => {
    setIsSendingFixRequest(true);
    try {
      await fetch(`/api/cases/${caseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'AGENCY',
          text: whatsappText,
          updateStatusToNeedsFixes: true,
        }),
      });
      setFixSentSuccess(true);
      setTimeout(() => setFixSentSuccess(false), 3000);
      loadCaseDetail();
    } catch (err) {
      console.error('Error sending fix request:', err);
    } finally {
      setIsSendingFixRequest(false);
    }
  };

  if (!caseData) {
    return <div className="py-24 text-center text-zinc-400 text-sm">Loading agency case workspace...</div>;
  }

  const selectedDoc = sharedDocs[selectedDocIndex] || sharedDocs[0];
  let selectedDocData: any = {};
  try {
    selectedDocData = JSON.parse(selectedDoc?.extractedData || '{}');
  } catch {}

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <Link
            href="/agency"
            className="p-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-black font-mono">
                {caseData.caseCode}
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-300 bg-zinc-100 text-black uppercase tracking-wider">
                {caseData.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Applicant: <strong className="text-black">{traveler?.fullName}</strong> ({traveler?.nationality}) • Destination: {caseData.trip?.destination} ({caseData.trip?.startDate} → {caseData.trip?.endDate})
            </p>
          </div>
        </div>

        {/* Status Workflow Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleStatusUpdate('NEEDS_FIXES')}
            disabled={isUpdatingStatus || caseData.status === 'NEEDS_FIXES'}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-100 text-black border border-zinc-300 disabled:opacity-40"
          >
            Request Fixes
          </button>
          <button
            onClick={() => handleStatusUpdate('READY_TO_SUBMIT')}
            disabled={isUpdatingStatus || caseData.status === 'READY_TO_SUBMIT'}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-300 disabled:opacity-40"
          >
            Ready to Submit
          </button>
          <button
            onClick={() => handleStatusUpdate('SUBMITTED')}
            disabled={isUpdatingStatus || caseData.status === 'SUBMITTED'}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-black hover:bg-zinc-800 text-white disabled:opacity-40"
          >
            Mark Submitted
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('datasheet')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'datasheet' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black bg-zinc-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Auto-Filled Data Sheet &amp; Export
        </button>

        <button
          onClick={() => setActiveTab('sidebyside')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'sidebyside' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black bg-zinc-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Side-by-Side Original vs Extraction
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'issues' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black bg-zinc-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Issues &amp; WhatsApp Fix Request ({caseData.caseIssues?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('generate')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'generate' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black bg-zinc-100'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          Covering Letter &amp; Itinerary
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'history' ? 'bg-black text-white' : 'text-zinc-600 hover:text-black bg-zinc-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Visa History &amp; Audit Trail
        </button>
      </div>

      {/* TAB 1: Auto-Filled Application Data Sheet */}
      {activeTab === 'datasheet' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-zinc-200">
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-black" />
                Pre-Filled Consular Application Data Sheet
              </h2>
              <p className="text-xs text-zinc-500">
                Staff never type from scans: 1-click copy per field, bulk copy, or export to CSV/JSON.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-black text-xs font-semibold border border-zinc-300 transition-colors"
              >
                {copyAllSuccess ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                {copyAllSuccess ? 'Copied All' : 'Copy All'}
              </button>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-black text-xs font-semibold border border-zinc-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-black text-xs font-semibold border border-zinc-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 uppercase tracking-wider font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-4">Document Category</th>
                    <th className="py-3 px-4">Field Name</th>
                    <th className="py-3 px-4">Pre-Extracted Value</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {fieldsList.map((f, idx) => {
                    const rowId = `field_${idx}`;
                    return (
                      <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-black whitespace-nowrap">
                          {f.category}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-600 uppercase tracking-wide whitespace-nowrap">
                          {f.key}
                        </td>
                        <td className="py-3 px-4 font-mono text-black break-words">
                          {f.value}
                          {f.isEdited && (
                            <span className="ml-2 text-[10px] font-sans px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
                              Applicant Edited
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleCopySingle(f.value, rowId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-black border border-zinc-200 transition-colors"
                            title="Copy field value"
                          >
                            {copiedKey === rowId ? (
                              <Check className="w-3 h-3 text-black" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-600" />
                            )}
                            <span className="text-[11px] font-semibold">{copiedKey === rowId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: Side-by-Side Original vs Extraction */}
      {activeTab === 'sidebyside' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mr-2 shrink-0">
              Select Document:
            </span>
            {sharedDocs.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                  selectedDocIndex === idx
                    ? 'bg-black text-white'
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {doc.type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Original Scan */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Original Client Scan / Evidence
              </span>
              <DocViewer fileUrl={selectedDoc.fileUrl} docType={selectedDoc.type} />
            </div>

            {/* Right: Extracted Table with Flags */}
            <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Extracted Fields &amp; Confidence Notes
                </span>
                {selectedDoc.userEdited && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300">
                    Applicant Modified
                  </span>
                )}
              </div>

              {selectedDoc.confidenceNotes && (
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                  <span className="font-semibold text-black">Confidence Analysis: </span>
                  {selectedDoc.confidenceNotes}
                </div>
              )}

              <div className="space-y-2 text-xs">
                {Object.entries(selectedDocData).map(([k, v]) => {
                  if (k === 'confidenceNotes') return null;
                  return (
                    <div
                      key={k}
                      className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3"
                    >
                      <span className="font-semibold text-zinc-600 uppercase tracking-wide">
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-black font-bold">{String(v ?? 'null')}</span>
                        <button
                          onClick={() => handleCopySingle(String(v ?? ''), k)}
                          className="p-1 hover:text-black text-zinc-400 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: Issues Panel & WhatsApp Fix Request Generator */}
      {activeTab === 'issues' && (
        <section className="space-y-6">
          {/* Issues Review Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-black" />
              Pre-Vetted Case Issues &amp; Blocker Checklist ({caseData.caseIssues?.length || 0})
            </h2>

            <div className="space-y-2.5">
              {caseData.caseIssues?.map((iss: any) => (
                <div
                  key={iss.id}
                  className="p-4 rounded-xl border border-zinc-300 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-black text-white">
                        {iss.severity}
                      </span>
                      <span className="font-bold text-black text-sm">{iss.message}</span>
                    </div>
                    <div className="text-zinc-600 pl-1">Suggestion: {iss.fixSuggestion}</div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleAcknowledgeIssue(iss.id, iss.acknowledgedByAgent)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-colors ${
                        iss.acknowledgedByAgent
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-zinc-700 border-zinc-300 hover:text-black'
                      }`}
                    >
                      {iss.acknowledgedByAgent ? '✓ Acknowledged' : 'Mark Reviewed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Fix Request Generator */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-black" />
                  Generate WhatsApp-Style Fix Request Message
                </h3>
                <p className="text-xs text-zinc-500">
                  Pre-drafted clear message with bulleted fixes to send directly via WhatsApp or post to applicant portal.
                </p>
              </div>

              {fixSentSuccess && (
                <span className="text-xs text-black font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-black" /> Posted to Applicant!
                </span>
              )}
            </div>

            <textarea
              rows={7}
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs text-black font-mono focus:outline-none focus:border-black leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappText);
                  alert('WhatsApp message copied to clipboard!');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-100 text-black text-xs font-semibold border border-zinc-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy WhatsApp Text
              </button>

              <button
                onClick={handleSendFixRequest}
                disabled={isSendingFixRequest}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingFixRequest ? 'Posting...' : 'Post Fix Request to Applicant'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: Generate Covering Letter & Itinerary */}
      {activeTab === 'generate' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-zinc-200">
            <div>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-black" />
                Embassy Covering Letter &amp; Detailed Itinerary Draft
              </h2>
              <p className="text-xs text-zinc-500">
                Pre-populated from extracted fields. Fully editable and print-ready for consular filing.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-center"
            >
              <Printer className="w-4 h-4" />
              Print Official Documents
            </button>
          </div>

          {/* Editable Covering Letter */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-3 shadow-sm print-page">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Consular Covering Letter Draft
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(coveringLetter);
                  alert('Covering letter copied!');
                }}
                className="text-xs text-black hover:underline flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Text
              </button>
            </div>

            <textarea
              rows={16}
              value={coveringLetter}
              onChange={(e) => setCoveringLetter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-4 text-xs font-mono text-black leading-relaxed focus:outline-none focus:border-black"
            />
          </div>

          {/* Day-by-Day Itinerary Table */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-sm print-page">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              Day-by-Day Schedule of Stay (Itinerary)
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 uppercase tracking-wider font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Planned Activities</th>
                    <th className="py-2.5 px-3">Accommodation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {itineraryDays.map((day) => (
                    <tr key={day.dayIndex} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-3 font-bold text-black font-mono">Day {day.dayIndex}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-600">{day.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-black">{day.city}</td>
                      <td className="py-2.5 px-3 text-zinc-600">{day.activities}</td>
                      <td className="py-2.5 px-3 text-zinc-600">{day.accommodation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: Visa History & Status Audit Trail */}
      {activeTab === 'history' && (
        <section className="space-y-6">
          {/* Visa History */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Layers className="w-4 h-4 text-black" />
              Applicant Prior Visa History
            </h2>

            {visaHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {visaHistory.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-black">{v.country} ({v.region})</span>
                      <span className="text-[10px] font-semibold text-black bg-zinc-200 px-2 py-0.5 rounded">
                        {v.status}
                      </span>
                    </div>
                    <div className="text-zinc-600 font-mono">
                      Validity: {v.validFrom} → {v.validUntil}
                    </div>
                    <div className="text-zinc-600">
                      Entries: {v.entries} • Max stay: {v.maxStayDays} days
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-400 text-xs py-4">No prior visa history on record.</div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white space-y-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Clock className="w-4 h-4 text-black" />
              Case Status History &amp; Audit Trail
            </h2>

            <div className="space-y-2 text-xs">
              {caseData.statusHistory?.map((h: any) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-black" />
                    <span className="font-bold text-black uppercase">{h.status.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-zinc-500 font-mono">
                    {new Date(h.at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
