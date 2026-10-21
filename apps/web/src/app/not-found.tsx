import React from 'react';
import Link from 'next/link';
import { Building2, Home, Search, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-24 px-6 lg:px-12 bg-white flex items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <div className="max-w-md w-full">
        <div className="w-16 h-16 rounded-3xl bg-[#00B894]/15 text-[#00846A] flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="text-6xl font-extrabold text-[#1A1A2E] mb-2 tracking-tight">404</div>
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-3">Page Not Found</h1>
        <p className="text-sm text-[#4A5568] mb-8 leading-relaxed">
          The requested page or society portal could not be located. It may have moved or the link
          might be outdated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/track"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1A1A2E] text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Track a Complaint</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
