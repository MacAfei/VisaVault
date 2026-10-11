'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scan,
  Briefcase,
  FolderArchive,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const isAgency = pathname.startsWith('/agency') || pathname.startsWith('/company');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-black">
                VisaVault
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-zinc-500 ml-2 tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                Document Scanner &amp; Vault
              </span>
            </div>
          </Link>

          {/* Traveler Navigation Links */}
          {!isAgency && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname === '/'
                    ? 'text-black bg-zinc-100 font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                }`}
              >
                <Scan className="w-4 h-4" />
                Scanner
              </Link>
              <Link
                href="/vault"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/vault')
                    ? 'text-black bg-zinc-100 font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                }`}
              >
                <FolderArchive className="w-4 h-4" />
                Visa Vault
              </Link>
              <Link
                href="/stay-tracker"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/stay-tracker')
                    ? 'text-black bg-zinc-100 font-semibold'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Stay Tracker
              </Link>
            </nav>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/demo"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
            <span className="hidden sm:inline">Judges / </span>Demo Hub
          </Link>

          {isAgency ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Scan className="w-3.5 h-3.5" />
              Traveler Scanner
            </Link>
          ) : (
            <Link
              href="/agency"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Company Portal
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
