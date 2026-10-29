'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@grievease/ui';
import { UserPlus, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function CreateOnBehalfPage() {
  const router = useRouter();
  const [residents, setResidents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [areaText, setAreaText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.listUsers({ role: 'RESIDENT' }).catch(() => null),
      api.getCategories().catch(() => null),
    ]).then(([usersRes, catsRes]) => {
      if (usersRes && Array.isArray(usersRes.items)) setResidents(usersRes.items);
      if (Array.isArray(catsRes)) {
        setCategories(catsRes);
        if (catsRes.length > 0) setSelectedCategory(catsRes[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedResident) {
      setError('Please select a resident.');
      return;
    }
    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOnBehalf({
        residentUserId: selectedResident,
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategory,
        priority,
        areaText: areaText.trim() || undefined,
      });

      router.push(`/admin/grievances/${res.id || res.publicId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance on behalf of resident.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Secretary Console">
      <div className="space-y-6 max-w-xl mx-auto py-6">
        <Link
          href="/admin/inbox"
          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inbox</span>
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Grievance On-Behalf
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log an issue reported verbally, over the intercom, or in-person on behalf of a registered resident.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Select Resident *
            </label>
            <select
              required
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none min-h-[44px]"
            >
              <option value="">Choose resident...</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name} ({r.username})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Category *
            </label>
            <select
              required
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold min-h-[44px]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Complaint Title (10-100 chars) *
            </label>
            <input
              type="text"
              required
              minLength={10}
              maxLength={100}
              placeholder="e.g. Lift malfunctioning on 3rd floor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide complete description of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-semibold min-h-[44px]"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Location Area
              </label>
              <input
                type="text"
                placeholder="e.g. Wing A Lobby"
                value={areaText}
                onChange={(e) => setAreaText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs min-h-[44px]"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md mt-2"
          >
            {submitting ? 'Creating...' : 'Submit Grievance on Behalf'}
          </Button>
        </form>
      </div>
    </ShellLayout>
  );
}
