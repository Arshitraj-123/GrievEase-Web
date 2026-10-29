'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@grievease/ui';
import { FileEdit, Trash2, ArrowRight, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function GrievanceDraftsPage() {
  const router = useRouter();
  const { t } = useAccessibility();
  const [draft, setDraft] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDraft = async () => {
    try {
      setLoading(true);
      const res = await api.getDraft();
      setDraft(res);
    } catch {
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraft();
  }, []);

  const handleDiscard = async () => {
    if (!confirm('Are you sure you want to discard this autosaved draft?')) return;
    try {
      await api.cancelDraft();
      setDraft(null);
    } catch {}
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-xl mx-auto py-6">
        <Link
          href="/app/grievances"
          className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          ← Back to Grievances
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Autosaved Drafts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-side autosaved complaints can be resumed on any device.
          </p>
        </div>

        {loading ? (
          <div className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ) : !draft || !draft.title ? (
          <Card className="p-8 text-center space-y-3">
            <FileEdit className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active draft found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Any complaint you begin composing is automatically saved every 30 seconds.
            </p>
            <Link
              href="/app/grievances/new"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow"
            >
              <span>Create New Grievance</span>
            </Link>
          </Card>
        ) : (
          <Card className="p-5 rounded-3xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                  Autosaved Draft
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {draft.title || 'Untitled Draft'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {draft.description || 'No description entered yet.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDiscard}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Discard Draft"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                onClick={() => router.push('/app/grievances/new')}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow"
              >
                <span>Resume Editing</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
}
