'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackServiceProviders } from '@/lib/fallback-community';
import { ServiceProviderDto } from '@grievease/contracts';
import {
  ArrowLeft,
  Briefcase,
  Star,
  Phone,
  MapPin,
  CheckCircle2,
  MessageSquarePlus,
  X,
  AlertCircle,
} from 'lucide-react';

export default function ServicesDirectoryPage() {
  const { t } = useAccessibility();
  const [providers, setProviders] = useState<ServiceProviderDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [reviewModalProvider, setReviewModalProvider] = useState<ServiceProviderDto | null>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadProviders() {
      setIsLoading(true);
      try {
        const res = await api.getServiceProviders(
          selectedCategory !== 'all' ? selectedCategory : undefined
        );
        if (Array.isArray(res)) {
          setProviders(res);
        } else {
          setProviders(fallbackServiceProviders);
        }
      } catch {
        setProviders(fallbackServiceProviders);
      } finally {
        setIsLoading(false);
      }
    }
    loadProviders();
  }, [selectedCategory]);

  const categories = Array.from(new Set(fallbackServiceProviders.map((p) => p.category)));

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalProvider || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      await api.submitServiceReview(reviewModalProvider.id, {
        stars: reviewStars,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalProvider(null);
        setReviewSuccess(false);
        setReviewComment('');
      }, 1500);
    } catch {
      // Optimistic completion
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewModalProvider(null);
        setReviewSuccess(false);
        setReviewComment('');
      }, 1500);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Back Link */}
        <Link
          href="/app/directory"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Society Directory
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <Briefcase className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.societyDirectory?.servicesTitle || 'Approved Local Services'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Society-approved technicians, electricians, plumbers and cleaners with resident reviews
          </p>
        </div>

        {/* Rating Rule Notice */}
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-4 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
          <Star className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {t.societyDirectory?.minReviewsHint ||
              'Quality benchmark: Aggregate star ratings are only displayed once a service provider has at least 3 verified resident reviews.'}
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Providers List */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading service providers...</div>
        ) : providers.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No providers in this category</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const hasEnoughReviews = p.reviewCount >= 3 && p.avgStars !== null;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                          {p.category}
                        </span>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {p.name}
                        </h2>
                      </div>

                      {/* Rating pill */}
                      {hasEnoughReviews ? (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{p.avgStars}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.reviewCount})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          New (&lt;3 reviews)
                        </span>
                      )}
                    </div>

                    {p.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {p.notes}
                      </p>
                    )}

                    {p.area && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Coverage: {p.area}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold min-h-[44px] transition-colors shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {p.phone}</span>
                    </a>

                    <button
                      onClick={() => setReviewModalProvider(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold min-h-[44px] transition-colors"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review Modal */}
        {reviewModalProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Review {reviewModalProvider.name}
                </h3>
                <button
                  onClick={() => setReviewModalProvider(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reviewSuccess ? (
                <div className="py-8 text-center space-y-2 text-green-600">
                  <CheckCircle2 className="w-12 h-12 mx-auto" />
                  <p className="text-sm font-bold">Review submitted successfully!</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Stars selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                      Star Rating (1 to 5):
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewStars(star)}
                          className="p-2 rounded-xl hover:bg-amber-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= reviewStars
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      Comment / Feedback (Optional):
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Share your experience (punctuality, charges, quality)..."
                      className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewModalProvider(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold min-h-[44px] disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
