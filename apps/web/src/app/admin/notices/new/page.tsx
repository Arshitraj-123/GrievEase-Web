'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { fallbackCategories } from '@/lib/fallback-community';
import {
  ArrowLeft,
  Megaphone,
  Pin,
  Clock,
  Calendar,
  Users,
  Paperclip,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Languages,
  ShieldAlert,
} from 'lucide-react';

export default function NewNoticePage() {
  const router = useRouter();

  // Multi-lingual tabs
  const [activeLang, setActiveLang] = useState<'EN' | 'HI'>('EN');
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [bodyHi, setBodyHi] = useState('');

  // Core settings
  const [categoryId, setCategoryId] = useState(fallbackCategories[0]?.id || 'cat-1');
  const [priority, setPriority] = useState<'NORMAL' | 'IMPORTANT' | 'EMERGENCY'>('NORMAL');
  const [audienceType, setAudienceType] = useState<'ALL' | 'WINGS' | 'ROLES'>('ALL');
  const [selectedWings, setSelectedWings] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const [pinOrder, setPinOrder] = useState(1);
  const [requiresAck, setRequiresAck] = useState(false);

  // Schedule & Expiry
  const [publishMode, setPublishMode] = useState<'NOW' | 'SCHEDULED'>('NOW');
  const [scheduledAt, setScheduledAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Attachments mock
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string }>>([]);

  // Preview & Submission
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentTitle = activeLang === 'EN' ? titleEn : titleHi;
  const currentBody = activeLang === 'EN' ? bodyEn : bodyHi;

  const setCurrentTitle = (val: string) => {
    if (activeLang === 'EN') setTitleEn(val);
    else setTitleHi(val);
  };

  const setCurrentBody = (val: string) => {
    if (activeLang === 'EN') setBodyEn(val);
    else setBodyHi(val);
  };

  const handlePublish = async () => {
    if (!titleEn.trim() || !bodyEn.trim()) {
      setErrorMsg('English title and body are required as the base language.');
      setShowConfirmModal(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        categoryId,
        priority,
        pinned,
        pinOrder: pinned ? pinOrder : undefined,
        audienceType,
        targetWings: audienceType === 'WINGS' ? selectedWings : undefined,
        targetRoles: audienceType === 'ROLES' ? selectedRoles : undefined,
        publishAt: publishMode === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        requiresAck,
        titleEn,
        bodyEn,
        translations: [
          ...(titleHi.trim() ? [{ lang: 'HI' as const, title: titleHi, body: bodyHi }] : []),
        ],
      };

      await api.createNotice(payload);
      router.push('/admin/notices');
    } catch {
      // Mock fallback redirect
      router.push('/admin/notices');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Navigation */}
        <Link
          href="/admin/notices"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Noticeboard Management
        </Link>

        {/* Title */}
        <div className="mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
              Notice Authoring & Broadcast
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Draft New Notice
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast messages will reach resident portals immediately or on schedule. High priority notices trigger instant push and banners.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Language Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-slate-800">Translations</span>
            </div>

            <div className="flex items-center gap-1">
              {(['EN', 'HI'] as const).map((lang) => (
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
                  {lang === 'EN' ? 'English (Primary)' : 'हिंदी (Hindi)'}
                  {lang === 'EN' && ' *'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Notice Title ({activeLang})
              </label>
              <input
                type="text"
                placeholder={
                  activeLang === 'EN'
                    ? 'e.g. Scheduled Lift Maintenance & Inspection'
                    : activeLang === 'HI'
                    ? 'उदा. लिफ्ट रखरखाव एवं निरीक्षण'
                    : 'उदा. लिफ्ट दुरुस्ती आणि तपासणी'
                }
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Notice Content ({activeLang})
                </label>
                <span className="text-[11px] text-slate-400">
                  Allowed tags: &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;a&gt;
                </span>
              </div>
              <textarea
                rows={6}
                placeholder={
                  activeLang === 'EN'
                    ? 'Write clear, sanitised rich text here...'
                    : activeLang === 'HI'
                    ? 'यहाँ सूचना का विवरण लिखें...'
                    : 'येथे सूचनेचा तपशील लिहा...'
                }
                value={currentBody}
                onChange={(e) => setCurrentBody(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Audience and Priority Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Targeting & Delivery Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {fallbackCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.nameHi})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="NORMAL">Normal (Standard feed)</option>
                <option value="IMPORTANT">Important (Highlighted in feed)</option>
                <option value="EMERGENCY">Emergency (Persistent top banner until acknowledged)</option>
              </select>
            </div>
          </div>

          {priority === 'EMERGENCY' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Persistent Emergency Banner: </span>
                This notice will display a bright red sticky banner at the top of every resident page until they explicitly acknowledge it. Note: Without external SMS or push services, alerts are delivered in-app upon login/navigation.
              </div>
            </div>
          )}

          {/* Audience Targeting */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Audience Scope
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'ALL', label: 'All Residents', desc: 'Broadcast to entire society' },
                { type: 'WINGS', label: 'Specific Wings', desc: 'Target selected towers' },
                { type: 'ROLES', label: 'By Role', desc: 'Owners or Tenants only' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setAudienceType(item.type as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    audienceType === item.type
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs font-bold text-slate-900">{item.label}</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pinned & Acknowledgment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Pin to Top</span>
                <span className="text-[11px] text-slate-500">
                  Keep notice pinned above regular feed (maximum 3 pinned notices allowed).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Requires Explicit Acknowledgment</span>
                <span className="text-[11px] text-slate-500">
                  Residents must click &ldquo;Acknowledge&rdquo;. Flat-level compliance will be tracked in admin view.
                </span>
              </div>
            </label>
          </div>

          {/* Scheduling & Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Release Mode
              </label>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setPublishMode('NOW')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    publishMode === 'NOW' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('SCHEDULED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    publishMode === 'SCHEDULED' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Schedule for Later
                </button>
              </div>

              {publishMode === 'SCHEDULED' && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Auto-Archive Expiry (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Notices past expiry are automatically archived by scheduled background sweep.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview as Resident</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting || !titleEn.trim() || !bodyEn.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Megaphone className="w-4 h-4" />
            <span>{publishMode === 'NOW' ? 'Publish Notice' : 'Schedule Notice'}</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-slideUp">
              <div className="text-center mb-4">
                <Megaphone className="w-12 h-12 text-teal-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-slate-900">
                  {publishMode === 'NOW' ? 'Confirm Notice Broadcast' : 'Confirm Scheduled Release'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This will queue in-app notifications and trigger live Socket.io events across the society.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-700 space-y-1 mb-5">
                <div><span className="font-semibold">Title:</span> {titleEn}</div>
                <div><span className="font-semibold">Priority:</span> {priority}</div>
                <div><span className="font-semibold">Target:</span> {audienceType}</div>
                <div><span className="font-semibold">Pinned:</span> {pinned ? 'Yes' : 'No'}</div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Broadcasting...' : 'Confirm & Broadcast'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Resident Preview ({activeLang})
                </span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 font-bold"
                >
                  ✕
                </button>
              </div>

              {priority === 'EMERGENCY' && (
                <div className="mb-4 bg-red-600 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>EMERGENCY ALERT: This notice appears as a top sticky banner.</span>
                </div>
              )}

              <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                {currentTitle || 'Notice Title'}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-100">
                <span>Published just now</span>
                <span>•</span>
                <span>General Category</span>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                {currentBody || 'Notice body text will render here...'}
              </div>

              {requiresAck && (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Resident Acknowledgment Required</span>
                  <button disabled className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white opacity-80">
                    Acknowledge Notice
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
