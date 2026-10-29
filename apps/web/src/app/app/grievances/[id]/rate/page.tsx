'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@grievease/ui';
import { Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

const AVAILABLE_TAGS = [
  'Prompt Response',
  'Satisfactory Fix',
  'Polite Resolver',
  'Clean Work',
  'Followed Up',
  'Took Too Long',
  'Partial Fix',
];

export default function GrievanceRatePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAccessibility();
  const grievanceId = params?.id as string;

  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Prompt Response']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.rateGrievance(grievanceId, {
        stars,
        comment: comment.trim() || undefined,
        tags: selectedTags,
      });
      setSubmitted(true);
      setTimeout(() => {
        router.push(`/app/grievances/${grievanceId}`);
      }, 2000);
    } catch (err) {
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-md mx-auto py-6">
        <Link
          href={`/app/grievances/${grievanceId}`}
          className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1"
        >
          ← Back to Grievance
        </Link>

        {submitted ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t.grievances.ratingSuccess}
            </h2>
            <p className="text-xs text-slate-500">
              Returning to grievance details...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t.grievances.rateExperience}
              </h1>
              <p className="text-xs text-slate-500">
                Your feedback helps maintain society accountability and resolver standards.
              </p>
            </div>

            {/* 1-5 Star Selector */}
            <div className="flex items-center justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isSelected = starVal <= stars;
                return (
                  <button
                    type="button"
                    key={starVal}
                    onClick={() => setStars(starVal)}
                    className="p-1.5 focus:outline-none transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 ${
                        isSelected
                          ? 'text-amber-400 fill-amber-400 drop-shadow'
                          : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Resolution Highlights
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Comment (max 200 chars) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {t.grievances.rateComment}
                </label>
                <span className={`text-[11px] ${comment.length > 200 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {comment.length}/200
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md"
            >
              {submitting ? 'Submitting...' : t.grievances.submitRating}
            </Button>
          </form>
        )}
      </div>
    </ShellLayout>
  );
}
