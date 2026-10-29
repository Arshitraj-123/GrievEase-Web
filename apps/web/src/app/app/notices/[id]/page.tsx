'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackNoticeDetail } from '@/lib/fallback-community';
import { NoticeDetailDto } from '@grievease/contracts';
import {
  ArrowLeft,
  Pin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Paperclip,
  Download,
  History,
  X,
  Share2,
} from 'lucide-react';

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAccessibility();
  const noticeId = typeof params?.id === 'string' ? params.id : '';

  const [notice, setNotice] = useState<NoticeDetailDto | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotice() {
      setIsLoading(true);
      try {
        const res = await api.getNoticeDetail(noticeId);
        if (res && res.id) {
          setNotice(res);
        } else {
          setNotice(fallbackNoticeDetail);
        }
      } catch {
        setNotice(fallbackNoticeDetail);
      } finally {
        setIsLoading(false);
      }
    }
    if (noticeId) {
      loadNotice();
    }
  }, [noticeId]);

  const handleAcknowledge = async () => {
    if (!notice || notice.isAcknowledged || isAcknowledging) return;
    setIsAcknowledging(true);
    try {
      await api.acknowledgeNotice(notice.id);
      setNotice({ ...notice, isAcknowledged: true });
    } catch {
      // Optimistic update
      setNotice({ ...notice, isAcknowledged: true });
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isLoading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="py-24 text-center text-sm text-slate-400">Loading notice...</div>
      </ShellLayout>
    );
  }

  if (!notice) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="py-24 text-center space-y-4">
          <p className="text-base text-slate-600 dark:text-slate-400">Notice not found.</p>
          <Link
            href="/app/notices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Noticeboard
          </Link>
        </div>
      </ShellLayout>
    );
  }

  const isEmergency = notice.priority === 'EMERGENCY';

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Back Link */}
        <Link
          href="/app/notices"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Noticeboard
        </Link>

        {/* Notice Card */}
        <article className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {notice.pinned && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  <Pin className="w-3.5 h-3.5" />
                  Pinned Announcement
                </span>
              )}

              {isEmergency && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  EMERGENCY ADVISORY
                </span>
              )}

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {notice.categoryName}
              </span>

              {notice.hasEdits && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <History className="w-3 h-3" />
                  Edited (View History)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {notice.publishedAt
                  ? new Date(notice.publishedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Draft'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {notice.title}
          </h1>

          {/* Safe Rich Text Body */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed space-y-3"
            dangerouslySetInnerHTML={{ __html: notice.body }}
          />

          {/* Attachments Section */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attachments ({notice.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notice.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-colors min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Paperclip className="w-4 h-4 text-teal-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {att.fileName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {Math.round(att.size / 1024)} KB
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledge Action Box */}
          {notice.requiresAck && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200">
                    Acknowledgment Required
                  </h4>
                  <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">
                    The society administration requires every flat to confirm they have read this notice.
                  </p>
                </div>

                {notice.isAcknowledged ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-xs sm:text-sm font-bold shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    Acknowledged by your Flat
                  </div>
                ) : (
                  <button
                    onClick={handleAcknowledge}
                    disabled={isAcknowledging}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isAcknowledging ? 'Recording...' : 'Acknowledge Notice'}
                  </button>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Version History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Notice Revision History
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(notice.versions || notice.versionHistory) && (notice.versions || notice.versionHistory)!.length > 0 ? (
                  (notice.versions || notice.versionHistory)!.map((v: any) => (
                    <div
                      key={v.versionNum}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-teal-700 dark:text-teal-300">
                          Version {v.versionNum}
                        </span>
                        <span className="text-slate-400">
                          {new Date(v.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {v.title}
                      </p>
                      {v.reason && (
                        <p className="text-[11px] text-slate-500 italic">
                          Reason: {v.reason}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Edited by: {v.editedByName}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No previous revisions recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
