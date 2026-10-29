'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import {
  Droplets,
  Zap,
  Trash2,
  Shield,
  ArrowUpDown,
  Car,
  Volume2,
  Wrench,
  HelpCircle,
  AlertTriangle,
  UploadCloud,
  X,
  FileText,
  Lock,
  EyeOff,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'water-supply': <Droplets className="w-6 h-6 text-sky-500" />,
  'electricity': <Zap className="w-6 h-6 text-amber-500" />,
  'cleanliness-garbage': <Trash2 className="w-6 h-6 text-emerald-500" />,
  'security': <Shield className="w-6 h-6 text-indigo-500" />,
  'lifts': <ArrowUpDown className="w-6 h-6 text-purple-500" />,
  'parking': <Car className="w-6 h-6 text-blue-500" />,
  'noise': <Volume2 className="w-6 h-6 text-rose-500" />,
  'maintenance-repairs': <Wrench className="w-6 h-6 text-orange-500" />,
};

interface CategoryOption {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  icon: string;
  requires_photo: boolean;
}

interface EvidenceFile {
  storageKey: string;
  filename: string;
  previewUrl?: string;
  size: number;
}

function NewGrievanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useAccessibility();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [areaTags, setAreaTags] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [areaText, setAreaText] = useState('');
  const [areaTagId, setAreaTagId] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Duplicate Warning Modal
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<string>('');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Categories, Area Tags, QR Slug Pre-fill, and Autosaved Draft
  useEffect(() => {
    // Categories
    api.getCategories()
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          if (!selectedCategory) setSelectedCategory(data[0].id);
        }
      })
      .catch(() => {});

    // Area Tags
    api.getAreaTags()
      .then((tags: any[]) => {
        if (Array.isArray(tags)) {
          setAreaTags(tags);
          const areaSlug = searchParams?.get('area');
          if (areaSlug) {
            const matchedTag = tags.find((t) => t.qr_slug === areaSlug);
            if (matchedTag) {
              setAreaTagId(matchedTag.id);
              setAreaText(matchedTag.name);
            }
          }
        }
      })
      .catch(() => {});

    // Restore Draft
    api.getDraft()
      .then((draft) => {
        if (draft && typeof draft === 'object') {
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
          if (draft.categoryId) setSelectedCategory(draft.categoryId);
          if (draft.priority) setPriority(draft.priority);
          if (draft.areaText) setAreaText(draft.areaText);
          if (draft.areaTagId) setAreaTagId(draft.areaTagId);
          if (draft.isAnonymous !== undefined) setIsAnonymous(draft.isAnonymous);
          setAutosaveStatus('Draft restored from previous session');
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // 2. Autosave every 30s
  useEffect(() => {
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);

    autosaveTimerRef.current = setInterval(() => {
      if (title.trim() || description.trim()) {
        api.saveDraft({
          title,
          description,
          categoryId: selectedCategory,
          priority,
          areaText,
          areaTagId,
          isAnonymous,
        })
          .then(() => {
            setAutosaveStatus(t.grievances.autosavedDraft);
            setTimeout(() => setAutosaveStatus(''), 4000);
          })
          .catch(() => {});
      }
    }, 30000);

    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
  }, [title, description, selectedCategory, priority, areaText, areaTagId, isAnonymous, t]);

  // 3. File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (evidenceList.length + files.length > 10) {
      setUploadError('Maximum 10 evidence files allowed per grievance.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      // Validation
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type === 'video/mp4';
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isVideo && !isPdf) {
        setUploadError(`File "${file.name}" has unsupported type. Use JPG, PNG, WEBP, MP4, or PDF.`);
        continue;
      }

      if (isImage && file.size > 10 * 1024 * 1024) {
        setUploadError(`Image "${file.name}" exceeds 10 MB limit.`);
        continue;
      }
      if (isVideo && file.size > 50 * 1024 * 1024) {
        setUploadError(`Video "${file.name}" exceeds 50 MB limit.`);
        continue;
      }
      if (isPdf && file.size > 10 * 1024 * 1024) {
        setUploadError(`PDF "${file.name}" exceeds 10 MB limit.`);
        continue;
      }

      try {
        const res = await api.uploadEvidence(file);
        setEvidenceList((prev) => [
          ...prev,
          {
            storageKey: res.storageKey,
            filename: file.name,
            size: file.size,
            previewUrl: isImage ? URL.createObjectURL(file) : undefined,
          },
        ]);
      } catch (err: any) {
        setUploadError(`Failed to upload ${file.name}: ${err.message || 'Error'}`);
      }
    }

    setUploading(false);
  };

  const removeEvidence = (storageKey: string) => {
    setEvidenceList((prev) => prev.filter((item) => item.storageKey !== storageKey));
  };

  // 4. Submit Grievance
  const handleSubmit = async (confirmDuplicate: boolean = false) => {
    setFormError(null);

    // Validate title 10-100 chars
    if (title.trim().length < 10 || title.trim().length > 100) {
      setFormError('Title must be between 10 and 100 characters.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please provide a detailed description of the grievance.');
      return;
    }

    if (!selectedCategory) {
      setFormError('Please select a category for your grievance.');
      return;
    }

    // Occurred at cannot be in future
    if (new Date(occurredAt).getTime() > Date.now() + 60000) {
      setFormError('Occurred date/time cannot be in the future.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategory,
        priority,
        areaText: areaText.trim() || undefined,
        areaTagId: areaTagId || undefined,
        occurredAt: new Date(occurredAt).toISOString(),
        isAnonymous,
        confirmDuplicate,
        evidenceKeys: evidenceList.map((e) => e.storageKey),
      };

      const res = await api.submitGrievance(payload);

      // Clean server-side draft
      api.cancelDraft().catch(() => {});

      // Navigate to confirmed screen
      const queryParams = new URLSearchParams();
      if (res.trackingCode) queryParams.set('code', res.trackingCode);
      if (res.expectedResolutionDate) queryParams.set('expected', res.expectedResolutionDate);
      if (res.assignedLevel) queryParams.set('level', res.assignedLevel.toString());

      router.push(`/app/grievances/${res.publicId}/confirmed?${queryParams.toString()}`);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_WARNING') {
        setDuplicateWarning(err.data?.matches || [{ title: 'Similar existing complaint' }]);
      } else {
        setFormError(err.message || 'Failed to submit grievance. Please verify details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (c: CategoryOption) => {
    if (locale === 'hi' && c.name_hi) return c.name_hi;
    if (locale === 'mr' && c.name_mr) return c.name_mr;
    return c.name_en;
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-2xl mx-auto pb-16">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Link
              href="/app/grievances"
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              ← Back to Grievances
            </Link>
            {autosaveStatus && (
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium animate-pulse">
                {autosaveStatus}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.grievances.raiseButton}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.grievances.raiseSubtitle}
          </p>
        </div>

        {formError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. Category 8-Grid (Responsive 2 cols on 360px, 4 cols on tablet+) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {t.grievances.selectCategory} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categories.map((c) => {
              const isSelected = selectedCategory === c.id;
              const iconNode = CATEGORY_ICONS[c.icon] || <HelpCircle className="w-6 h-6 text-slate-400" />;

              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[96px] transition-all group ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 w-fit group-hover:scale-105 transition-transform">
                    {iconNode}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mt-2">
                    {getCategoryName(c)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Title & Description */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t.grievances.titleLabel} <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${title.length < 10 || title.length > 100 ? 'text-amber-500' : 'text-slate-400'}`}>
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              required
              minLength={10}
              maxLength={100}
              placeholder={t.grievances.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.grievances.descriptionLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder={t.grievances.descriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm leading-relaxed"
            />
          </div>
        </div>

        {/* 3. Priority Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {t.grievances.priorityLabel}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {(['NORMAL', 'URGENT', 'EMERGENCY'] as const).map((p) => {
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`min-h-[44px] py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? p === 'EMERGENCY'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                        : p === 'URGENT'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md'
                        : 'bg-teal-600 text-white border-teal-700 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {p === 'NORMAL' && t.grievances.priorityNormal}
                  {p === 'URGENT' && t.grievances.priorityUrgent}
                  {p === 'EMERGENCY' && t.grievances.priorityEmergency}
                </button>
              );
            })}
          </div>
          {priority === 'EMERGENCY' && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              Emergency priority bypasses directly to Committee (Level 2) with Chairman escalation alerts.
            </p>
          )}
        </div>

        {/* 4. Area / Location & Occurred Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.grievances.areaLabel}
            </label>
            <input
              type="text"
              placeholder={t.grievances.areaPlaceholder}
              value={areaText}
              onChange={(e) => setAreaText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.grievances.occurredAtLabel}
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm min-h-[44px]"
            />
          </div>
        </div>

        {/* 5. Photos & Evidence Picker (Images 10MB, Video 50MB, PDF 10MB) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t.grievances.evidenceTitle} ({evidenceList.length}/10)
            </label>
            <span className="text-[11px] text-slate-400">JPG, PNG, WEBP, MP4, PDF</span>
          </div>

          {/* Thumbnails Gallery */}
          {evidenceList.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pb-2">
              {evidenceList.map((item) => (
                <div
                  key={item.storageKey}
                  className="relative group rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800 aspect-square flex items-center justify-center p-1"
                >
                  {item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.filename} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center p-2">
                      <FileText className="w-6 h-6 text-teal-600 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1">{item.filename}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeEvidence(item.storageKey)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{uploadError}</p>
          )}

          <label className="min-h-[48px] px-4 py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center gap-2 cursor-pointer transition-colors group text-xs font-semibold text-slate-600 dark:text-slate-300">
            <UploadCloud className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            <span>{uploading ? 'Sanitizing & Uploading...' : t.grievances.uploadEvidenceBtn}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf"
              className="hidden"
              disabled={uploading || evidenceList.length >= 10}
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* 6. Anonymous Complaint Toggle (Non-Negotiable Anonymity) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.grievances.anonymousMode}
                </span>
                <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                  Zero-PII
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
            {t.grievances.anonymousHelp}
          </p>
        </div>

        {/* 7. Submit Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting || uploading}
            className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>{t.grievances.submitting}</span>
            ) : (
              <>
                <span>{t.grievances.submitBtn}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Duplicate Warning Modal */}
        {duplicateWarning && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.grievances.duplicateWarningTitle}
                </h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.grievances.duplicateWarningDesc}
              </p>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                {duplicateWarning.map((m: any, idx: number) => (
                  <div key={idx} className="font-medium">• {m.title}</div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateWarning(null);
                    handleSubmit(true);
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-all"
                >
                  {t.grievances.submitAnyway}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

export default function NewGrievancePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500">Loading form...</div>}>
      <NewGrievanceForm />
    </React.Suspense>
  );
}
