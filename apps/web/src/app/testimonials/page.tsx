'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, ShieldCheck, CheckCircle2, MessageSquare, Plus, Lock } from 'lucide-react';
import { Button, Badge, Card, CardContent } from '@grievease/ui';
import { api } from '@/lib/api-client';

export default function TestimonialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPublicTestimonials()
      .then((data) => {
        if (Array.isArray(data) && data.length >= 3) {
          setItems(data);
        } else {
          // If fewer than 3, rule says show placeholder
          setItems(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      alert('Statutory Consent is required before submitting your review.');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitTestimonial({
        quote,
        rating,
        consentGiven: true,
      });
      alert('Thank you! Your testimonial has been submitted for governing committee review.');
      setShowSubmitModal(false);
      setQuote('');
      setConsentGiven(false);
    } catch (err: any) {
      alert(err.message || 'Please log in to submit a resident review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-12 bg-white">
      <div className="max-w-[1200px] mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-[700px] mx-auto space-y-3">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] block">
            VERIFIED COMMUNITY STORIES
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] leading-tight">
            Trusted by Residents &amp; Housing Societies
          </h1>
          <p className="text-sm sm:text-base text-[#4A5568]">
            Real feedback from verified residents, secretaries, and committee chairs across Indian gated communities.
          </p>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setShowSubmitModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Share Your Story
            </Button>
          </div>
        </div>

        {/* Testimonials Reel or Placeholder */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading stories...</div>
        ) : items.length < 3 ? (
          /* Min 3 approved before reel displays rule */
          <div className="p-12 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] text-center max-w-lg mx-auto space-y-3">
            <ShieldCheck className="w-12 h-12 text-teal-600 mx-auto opacity-70" />
            <h3 className="text-base font-bold text-[#1A1A2E]">
              Resident stories will appear here once verified by committee
            </h3>
            <p className="text-xs text-[#4A5568] leading-relaxed">
              To prevent fabricated or unverified claims, GrievEase requires a minimum of 3 committee-approved resident reviews before publishing community feedback.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs hover:border-[#00B894]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex gap-1 text-[#F59E0B]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < (item.rating || 5)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="success" className="text-[10px] gap-1 py-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Resident
                    </Badge>
                  </div>
                  <blockquote className="text-xs sm:text-sm text-[#1A1A2E] leading-relaxed italic mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1A2E]">{item.author_name}</h4>
                    <p className="text-[11px] text-[#4A5568]">Green Valley Residency</p>
                  </div>
                  <span className="text-[10px] text-teal-600 font-mono">DPDP Consent On File</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Submit Resident Feedback</span>
                </h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitTestimonial} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Star Rating (1-5)</label>
                  <div className="flex items-center gap-1.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-5 h-5 ${s <= rating ? 'fill-current' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Your Story &amp; Experience *</label>
                  <textarea
                    rows={4}
                    required
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Describe how GrievEase improved grievance handling, billing clarity, or society management..."
                    className="w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-900"
                  />
                </div>

                {/* MANDATORY CONSENT CHECKBOX */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 border">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                      I consent to GrievEase publishing my feedback, rating, and first name publicly in compliance with the Digital Personal Data Protection Act, 2023.
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-xs font-bold"
                    disabled={submitting || !consentGiven}
                  >
                    Submit for Verification
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
