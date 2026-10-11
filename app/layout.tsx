import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { PrivacyNotice } from '@/components/PrivacyNotice';

export const metadata: Metadata = {
  title: 'VisaVault • AI Visa Wallet & Readiness Engine',
  description:
    'Traveler visa vault, deterministic readiness checking, and instant agency pre-vetting pack sharing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white text-zinc-950" style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-zinc-200 selection:text-black">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white">
          {children}
        </main>
        <footer className="no-print border-t border-zinc-200 bg-zinc-50 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <PrivacyNotice />
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
              <div>
                VisaVault © 2026 • Travel Hackathon Showcase for Visa Assistance Sponsor
              </div>
              <div>
                Deterministic verification in <code className="text-zinc-800 font-semibold">lib/</code> • Multimodal Gemini extraction in <code className="text-zinc-800 font-semibold">lib/extract/</code>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
