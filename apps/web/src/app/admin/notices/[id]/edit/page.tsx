'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { fallbackNotices, fallbackCategories } from '@/lib/fallback-community';
import {
  ArrowLeft,
  Megaphone,
  Pin,
  Clock,
  Calendar,
  Languages,
  AlertTriangle,
  History,
  ShieldCheck,
} from 'lucide-react';

export default function EditNoticePage() {
  const params = useParams();
  const router = useRouter();
  const noticeId = typeof params?.id === 'string' ? params.id : '';

  const [activeLang, setActiveLang] = useState<'EN' | 'HI' | 'MR'>('EN');
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [bodyHi, setBodyHi] = useState('');
  const [titleMr, setTitleMr] = useState('');
  const [bodyMr, setBodyMr] = useState('');

  const [categoryId, setCategoryId] = useState(fallbackCategories[0]?.id || 'cat-1');
  const [priority, setPriority] = useState<'NORMAL' | 'IMPORTANT' | 'EMERGENCY'>('NORMAL');
  const [pinned, setPinned] = useState(false);
  const [pinOrder, setPinOrder] = useState(1);
  const [requiresAck, setRequiresAck] = useState(false);
  const [editReason, setEditReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotice() {
      setIsLoading(true);
      try {
        const res = await api.getNoticeDetail(noticeId);
        if (res && res.id) {
          setTitleEn(res.title);
          setBodyEn(res.body);
          setCategoryId(res.categoryId);
          setPriority(res.priority);
          setPinned(res.pinned);
          setPinOrder(res.pinOrder || 1);
          setRequiresAck(res.requiresAck);

          if (res.translations) {
            const hi = res.translations.find((t: any) => t.lang === 'HI');
            if (hi) {
              setTitleHi(hi.title);
              setBodyHi(hi.body);
            }
            const mr = res.translations.find((t: any) => t.lang === 'MR');
            if (mr) {
              setTitleMr(mr.title);
              setBodyMr(mr.body);
            }
          }
        } else {
          const fallback = fallbackNotices.find((n) => n.id === noticeId) || fallbackNotices[0]!;
          setTitleEn(fallback.title);
          setBodyEn(fallback.bodyPreview + '\n\nFull sanitized notice text.');
          setPriority(fallback.priority);
          setPinned(fallback.pinned);
          setRequiresAck(fallback.requiresAck);
        }
      } catch {
        const fallback = fallbackNotices.find((n) => n.id === noticeId) || fallbackNotices[0]!;
        setTitleEn(fallback.title);
        setBodyEn(fallback.bodyPreview);
        setPriority(fallback.priority);
        setPinned(fallback.pinned);
        setRequiresAck(fallback.requiresAck);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotice();
  }, [noticeId]);

  const currentTitle = activeLang === 'EN' ? titleEn : activeLang === 'HI' ? titleHi : titleMr;
  const currentBody = activeLang === 'EN' ? bodyEn : activeLang === 'HI' ? bodyHi : bodyMr;

  const setCurrentTitle = (val: string) => {
    if (activeLang === 'EN') setTitleEn(val);
    else if (activeLang === 'HI') setTitleHi(val);
    else setTitleMr(val);
  };

  const setCurrentBody = (val: string) => {
    if (activeLang === 'EN') setBodyEn(val);
    else if (activeLang === 'HI') setBodyHi(val);
    else setBodyMr(val);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReason.trim()) {
      setErrorMsg('A reason for editing is mandatory for audit logging and version tracking.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.updateNotice(noticeId, {
        titleEn,
        bodyEn,
        categoryId,
        priority,
        pinned,
        pinOrder: pinned ? pinOrder : undefined,
        requiresAck,
        editReason,
        translations: [
          ...(titleHi.trim() ? [{ lang: 'HI' as const, title: titleHi, body: bodyHi }] : []),
          ...(titleMr.trim() ? [{ lang: 'MR' as const, title: titleMr, body: bodyMr }] : []),
        ],
      });
      router.push('/admin/notices');
    } catch {
      router.push('/admin/notices');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href="/admin/notices"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Noticeboard
        </Link>

        <div className="mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Notice Versioning & Auditing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Notice
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Edits create an immutable snapshot in <code className="font-mono text-xs">notice_version</code>. The previous version will be preserved.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Version Notice Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <History className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Append-Only Versioning: </span>
              Updating this published notice will mark it as &ldquo;Edited&rdquo; on resident feeds. All residents and admins can view the previous version and the change reason.
            </div>
          </div>

          {/* Edit Reason (Mandatory) */}
          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
              Reason for Edit * (Required for audit log)
            </label>
            <input
              type="text"
              placeholder="e.g. Corrected scheduled water shutoff time from 09:00 to 10:00"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Language Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-slate-800">Translations</span>
              </div>

              <div className="flex items-center gap-1">
                {(['EN', 'HI', 'MR'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      activeLang === lang
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'EN' ? 'English' : lang === 'HI' ? 'हिंदी' : 'मराठी'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Title ({activeLang})
                </label>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Body Content ({activeLang})
                </label>
                <textarea
                  rows={6}
                  value={currentBody}
                  onChange={(e) => setCurrentBody(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="IMPORTANT">IMPORTANT</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="text-xs font-bold text-slate-900">Pin Notice</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresAck}
                    onChange={(e) => setRequiresAck(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="text-xs font-bold text-slate-900">Requires Acknowledgment</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/notices"
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Version...' : 'Save & Publish Revision'}
            </button>
          </div>
        </form>
      </div>
    </ShellLayout>
  );
}
