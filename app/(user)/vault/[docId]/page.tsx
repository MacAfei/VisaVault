import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { DocViewer } from '@/components/DocViewer';
import { FieldEditor } from '@/components/FieldEditor';
import { ArrowLeft, History, Plane } from 'lucide-react';

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      traveler: {
        include: {
          user: {
            include: {
              trips: true,
            },
          },
        },
      },
      visa: true,
      supersededBy: true,
      supersededDocs: true,
    },
  });

  if (!document) {
    notFound();
  }

  let extractedData: Record<string, any> = {};
  try {
    extractedData = JSON.parse(document.extractedData || '{}');
  } catch {
    extractedData = {};
  }

  // Linked trips that might rely on this document
  const trips = document.traveler.user.trips || [];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto text-zinc-900">
      <Link
        href="/vault"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Vault
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-black bg-zinc-100 border border-zinc-300 px-2.5 py-0.5 rounded-full">
              {document.type.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-zinc-500 font-mono">Version {document.version}</span>
            {document.userEdited && (
              <span className="text-[10px] font-semibold text-zinc-800 bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded">
                User Verified
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Document Record #{document.id.slice(-6)}
          </h1>
        </div>

        <div className="text-xs text-zinc-500">
          Holder: <span className="text-black font-semibold">{document.traveler.fullName}</span>
        </div>
      </div>

      {/* Main Grid: Document Preview & Extracted Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Original Scan */}
        <div className="space-y-4">
          <DocViewer fileUrl={document.fileUrl} docType={document.type} />

          {/* Superseded Notice */}
          {document.supersededBy && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-300 text-xs text-zinc-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-black">
                <History className="w-4 h-4 text-black" />
                Archived Document Version
              </div>
              <p className="text-zinc-600">
                This document was archived when a newer version was uploaded.
              </p>
              <Link
                href={`/vault/${document.supersededBy.id}`}
                className="inline-block text-black font-semibold mt-1 underline"
              >
                View Active Version (v{document.supersededBy.version}) →
              </Link>
            </div>
          )}

          {document.supersededDocs && document.supersededDocs.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <span className="font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <History className="w-4 h-4 text-black" />
                Previous Versions Archived:
              </span>
              <ul className="space-y-1">
                {document.supersededDocs.map((prev) => (
                  <li key={prev.id}>
                    <Link
                      href={`/vault/${prev.id}`}
                      className="text-black font-mono underline"
                    >
                      Version {prev.version} (Added {new Date(prev.createdAt).toLocaleDateString()})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Extracted Fields */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm">
            <FieldEditor
              fields={extractedData}
              confidenceNotes={document.confidenceNotes}
              isReadOnly={true}
              userEdited={document.userEdited}
            />
          </div>

          {/* Linked Trips Panel */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-2">
              <Plane className="w-4 h-4 text-black" />
              Trips Linked to this Vault
            </h3>

            <div className="space-y-2">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="p-3 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-semibold text-black">Trip to {trip.destination}</span>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {trip.startDate} → {trip.endDate}
                    </div>
                  </div>
                  <span className="text-black font-semibold underline">Inspect Readiness →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
