'use client';

import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Edit3 } from 'lucide-react';
import { maskDocumentNumber } from '@/lib/extract/mask';

interface FieldEditorProps {
  fields: Record<string, any>;
  confidenceNotes?: string | null;
  onSave?: (updatedFields: Record<string, any>) => void;
  isReadOnly?: boolean;
  userEdited?: boolean;
}

export function FieldEditor({
  fields,
  confidenceNotes,
  onSave,
  isReadOnly = false,
  userEdited = false,
}: FieldEditorProps) {
  const [data, setData] = useState<Record<string, any>>(fields);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleFieldChange = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const copyField = (key: string, val: any) => {
    navigator.clipboard.writeText(String(val ?? ''));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllFields = () => {
    const text = Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopyAllSuccess(true);
    setTimeout(() => setCopyAllSuccess(false), 2000);
  };

  const sensitiveKeys = ['passportnumber', 'idnumber', 'referencenumber'];

  return (
    <div className="space-y-4 text-zinc-900">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Extracted Fields Verification
          </span>
          {userEdited && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-black border border-zinc-300">
              User Verified
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={copyAllFields}
          className="flex items-center gap-1.5 text-xs text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-md transition-colors border border-zinc-300 font-semibold"
        >
          {copyAllSuccess ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
          {copyAllSuccess ? 'Copied All' : 'Copy All'}
        </button>
      </div>

      {/* Confidence Notes Alert */}
      {confidenceNotes && (
        <div className="p-3 rounded-lg text-xs flex items-start gap-2.5 border bg-zinc-50 border-zinc-200 text-zinc-700">
          <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-900">Model Analysis: </span>
            <span>{confidenceNotes}</span>
          </div>
        </div>
      )}

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(data).map(([key, val]) => {
          if (key === 'confidenceNotes') return null;

          const isSensitive = sensitiveKeys.includes(key.toLowerCase());
          const displayVal = val !== null && val !== undefined ? String(val) : '';

          return (
            <div
              key={key}
              className="bg-white border border-zinc-200 rounded-xl p-3 focus-within:border-black transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>

                <div className="flex items-center gap-1">
                  {isSensitive && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      ({maskDocumentNumber(displayVal)})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyField(key, displayVal)}
                    className="p-1 text-zinc-400 hover:text-black rounded hover:bg-zinc-100 transition-colors"
                    title="Copy value"
                  >
                    {copiedKey === key ? (
                      <Check className="w-3.5 h-3.5 text-black" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {isReadOnly ? (
                <div className="text-sm font-semibold text-zinc-900 break-words py-1 font-mono">
                  {displayVal || <span className="text-zinc-400 italic font-sans">null</span>}
                </div>
              ) : (
                <input
                  type="text"
                  value={displayVal}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="w-full text-sm font-medium bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:bg-white focus:border-black"
                  placeholder="null"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button if dirty */}
      {!isReadOnly && onSave && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onSave(data);
              setIsDirty(false);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-black hover:bg-zinc-800 text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Save &amp; Confirm Edits
          </button>
        </div>
      )}
    </div>
  );
}
