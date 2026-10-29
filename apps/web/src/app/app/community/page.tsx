'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackPolls } from '@/lib/fallback-community';
import { PollListItemDto } from '@grievease/contracts';
import {
  Vote,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  BarChart2,
  Lock,
} from 'lucide-react';

export default function CommunityPollsPage() {
  const { t } = useAccessibility();
  const [polls, setPolls] = useState<PollListItemDto[]>([]);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPolls() {
      setIsLoading(true);
      try {
        const res = await api.getCommunityPolls();
        if (Array.isArray(res)) {
          setPolls(res);
        } else {
          setPolls(fallbackPolls);
        }
      } catch {
        setPolls(fallbackPolls);
      } finally {
        setIsLoading(false);
      }
    }
    loadPolls();
  }, []);

  const openPolls = polls.filter((p) => p.status === 'OPEN');
  const closedPolls = polls.filter((p) => p.status === 'CLOSED');

  const displayedPolls = activeTab === 'OPEN' ? openPolls : closedPolls;

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <Vote className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.communityPolls?.title || 'Community Decisions & Polls'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t.communityPolls?.subtitle || 'Cast your vote securely with verified secret balloting'}
          </p>
        </div>

        {/* Secret Ballot Assurance Banner */}
        <div className="rounded-2xl bg-slate-900 text-white p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Cryptographically Separated Secret Ballots</p>
            <p className="text-slate-300 text-xs mt-0.5">
              {t.communityPolls?.secretBallotNotice ||
                'Voter identities and ballots are stored in separate unlinkable tables. Even admins and DBAs cannot connect you to your choice.'}
            </p>
          </div>
        </div>

        {/* Tabs: Open / Closed */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'OPEN'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{t.communityPolls?.openPollsTab || 'Open Polls'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-white/20 dark:bg-white/10">
              {openPolls.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'CLOSED'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{t.communityPolls?.closedPollsTab || 'Past Polls & Results'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800">
              {closedPolls.length}
            </span>
          </button>
        </div>

        {/* Poll Cards List */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading polls...</div>
        ) : displayedPolls.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
            <Vote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {activeTab === 'OPEN' ? 'No open polls right now' : 'No past polls on record'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Active society voting sessions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedPolls.map((poll) => {
              const isOpen = poll.status === 'OPEN';
              const daysRemaining = Math.max(
                0,
                Math.ceil((new Date(poll.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              );

              return (
                <Link
                  key={poll.id}
                  href={`/app/community/polls/${poll.id}`}
                  className="block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-all hover:shadow-md hover:border-teal-500 dark:hover:border-teal-600 min-h-[44px]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOpen
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isOpen ? 'Active Voting' : 'Closed'}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {poll.voteUnit === 'PER_FLAT' ? '1 Vote Per Flat' : '1 Vote Per Resident'}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                          {poll.ballot === 'SECRET' ? 'Secret Ballot' : 'Open Ballot'}
                        </span>

                        {poll.hasVoted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
                            <CheckCircle2 className="w-3 h-3" />
                            Vote Cast
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {poll.title}
                      </h2>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {poll.description}
                      </p>

                      {/* Turnout & Quorum Progress */}
                      <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Turnout: <strong>{poll.totalTurnout ?? poll.totalVotes ?? 0}</strong> / {poll.totalEligible ?? 120} (
                            {Math.round(((poll.totalTurnout ?? poll.totalVotes ?? 0) / Math.max(1, poll.totalEligible ?? 120)) * 100)}%)
                          </span>
                        </span>

                        {poll.quorumPercent && (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                (poll.isQuorumMet || poll.quorumReached || poll.quorumAchieved) ? 'bg-green-500' : 'bg-amber-500'
                              }`}
                            />
                            <span>
                              Quorum {poll.quorumPercent}% {(poll.isQuorumMet || poll.quorumReached || poll.quorumAchieved) ? '(Achieved)' : '(Pending)'}
                            </span>
                          </span>
                        )}

                        {isOpen && (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Closes today'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
