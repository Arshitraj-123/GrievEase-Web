'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackDirectoryMembers } from '@/lib/fallback-community';
import { DirectoryMemberCardDto } from '@grievease/contracts';
import {
  BookUser,
  Search,
  Shield,
  Phone,
  Mail,
  Home,
  User,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  Briefcase,
  Lock,
} from 'lucide-react';

export default function DirectoryPage() {
  const { t } = useAccessibility();
  const [query, setQuery] = useState('');
  const [selectedWing, setSelectedWing] = useState<string>('all');
  const [members, setMembers] = useState<DirectoryMemberCardDto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();

    if (cleanQuery.length < 3) {
      setErrorMessage(
        t.societyDirectory?.antiScrapeHint ||
          'Search requires at least 3 characters to protect community privacy.'
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await api.searchDirectory(
        cleanQuery,
        selectedWing !== 'all' ? selectedWing : undefined
      );
      if (res && Array.isArray(res.items)) {
        setMembers(res.items);
      } else {
        // Fallback filter
        const filtered = fallbackDirectoryMembers.filter(
          (m) =>
            m.fullName?.toLowerCase().includes(cleanQuery.toLowerCase()) ||
            m.flatNumber?.toLowerCase().includes(cleanQuery.toLowerCase())
        );
        setMembers(filtered);
      }
    } catch (err: any) {
      const filtered = fallbackDirectoryMembers.filter(
        (m) =>
          m.fullName?.toLowerCase().includes(cleanQuery.toLowerCase()) ||
          m.flatNumber?.toLowerCase().includes(cleanQuery.toLowerCase())
      );
      setMembers(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <BookUser className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.societyDirectory?.title || 'Society Directory'}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.societyDirectory?.subtitle || 'Opt-in resident directory and verified local contacts'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/settings/privacy"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              <span>Privacy Controls</span>
            </Link>
          </div>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/app/emergency"
            className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-200 dark:border-red-900/40 flex items-center justify-between hover:shadow-xs transition-all min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600 text-white">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Contacts</h3>
                <p className="text-xs text-slate-500">Security, Ambulance, Fire, Lift Rescue (Offline Ready)</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            href="/app/directory/services"
            className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-200 dark:border-teal-900/40 flex items-center justify-between hover:shadow-xs transition-all min-h-[44px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-600 text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Local Services &amp; Vendors</h3>
                <p className="text-xs text-slate-500">Electricians, Plumbers, Cleaning with resident reviews</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Search Bar & Wing Filter */}
        <form onSubmit={handleSearch} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={t.societyDirectory?.searchPlaceholder || 'Search by name, flat, or wing (min 3 chars)...'}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-xs transition-colors shrink-0 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search Directory'}
            </button>
          </div>

          {/* Privacy Notice Micro-copy */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              {t.societyDirectory?.antiScrapeHint ||
                'To prevent automated scraping and protect resident privacy, queries require at least 3 characters and results are rate limited.'}
            </span>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Results Grid */}
        {hasSearched && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Search Results ({members.length})
            </h2>

            {members.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-2">
                <BookUser className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching members found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only residents who have explicitly opted into the Directory appear in search results. Check spelling or try searching by flat number.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-sm">
                          {member.fullName ? member.fullName[0] : 'R'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {member.fullName || 'Resident (Name Hidden)'}
                          </h3>
                          {member.residentType && (
                            <span className="text-[11px] font-medium text-slate-400">
                              {member.residentType}
                            </span>
                          )}
                        </div>
                      </div>

                      {member.flatNumber && (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {member.wingName ? `${member.wingName} - ` : ''}{member.flatNumber}
                        </span>
                      )}
                    </div>

                    {/* Contact fields (only if enabled by resident) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      {member.mobile ? (
                        <a
                          href={`tel:${member.mobile}`}
                          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors min-h-[36px]"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{member.mobile}</span>
                        </a>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-300" />
                          <span>Phone number hidden by resident</span>
                        </p>
                      )}

                      {member.email ? (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors min-h-[36px]"
                        >
                          <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{member.email}</span>
                        </a>
                      ) : (
                        <p className="text-slate-400 italic text-[11px] flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-300" />
                          <span>Email hidden by resident</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
