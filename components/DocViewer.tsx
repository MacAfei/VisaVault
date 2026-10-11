'use client';

import React from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';

interface DocViewerProps {
  fileUrl: string;
  docType: string;
  fileName?: string;
}

export function DocViewer({ fileUrl, docType, fileName }: DocViewerProps) {
  const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm flex flex-col h-full min-h-[380px]">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs">
        <div className="flex items-center gap-2 text-zinc-900">
          <FileText className="w-4 h-4 text-black" />
          <span className="font-bold uppercase tracking-wider">{docType.replace(/_/g, ' ')}</span>
          {fileName && <span className="text-zinc-500 font-mono">({fileName})</span>}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-zinc-700 hover:text-black px-2 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Full Screen
          </a>
          <a
            href={fileUrl}
            download
            className="flex items-center gap-1 text-[11px] text-zinc-700 hover:text-black px-2 py-1 rounded bg-white hover:bg-zinc-100 border border-zinc-200 transition-colors"
          >
            <Download className="w-3 h-3" />
            Download
          </a>
        </div>
      </div>

      {/* Viewer Canvas */}
      <div className="flex-1 bg-zinc-50/50 p-3 flex items-center justify-center overflow-auto">
        {isPdf ? (
          <iframe
            src={fileUrl}
            className="w-full h-full min-h-[450px] rounded-lg border border-zinc-200"
            title="PDF Document Preview"
          />
        ) : (
          /* SVG or Image Document */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={docType}
            className="max-h-[500px] w-auto object-contain rounded-lg border border-zinc-200 shadow-sm transition-transform hover:scale-[1.01]"
          />
        )}
      </div>
    </div>
  );
}
