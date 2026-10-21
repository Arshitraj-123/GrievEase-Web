'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight, ArrowRight, Quote } from 'lucide-react';
import { testimonialsContent } from '@/content/testimonials';
import { siteConfig } from '@/config/site';

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const items = testimonialsContent.items;

  useEffect(() => {
    if (!siteConfig.featureFlags.showTestimonials || items.length === 0) return;

    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isHovered, items.length]);

  if (!siteConfig.featureFlags.showTestimonials || items.length === 0) {
    return null;
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartXRef.current = null;
  };

  const current = items[currentIndex];

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="py-20 px-6 lg:px-12 bg-white border-b border-[#E2E8F0]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[650px] mx-auto mb-14">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {testimonialsContent.tag}
          </span>
          <h2
            id="testimonials-heading"
            className="text-[32px] sm:text-[40px] font-extrabold text-[#1A1A2E] leading-tight mb-3"
          >
            {testimonialsContent.heading}
          </h2>
          <p className="text-[15.5px] text-[#4A5568]">
            {testimonialsContent.subtitle}
          </p>
        </div>

        {/* Carousel Card */}
        <div
          className="relative bg-white rounded-3xl p-8 sm:p-14 border border-[#E2E8F0] shadow-[0_4px_30px_rgba(0,0,0,0.06)] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Decorative Background Quote Mark */}
          <div
            className="font-serif text-[120px] text-[#00B894]/10 leading-none absolute top-4 left-6 select-none pointer-events-none"
            aria-hidden="true"
          >
            “
          </div>

          <div className="relative z-10 flex flex-col justify-between min-h-[220px]">
            {/* Stars */}
            <div className="flex gap-1 text-[#F59E0B] mb-4" aria-label={`${current.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < current.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-[17px] sm:text-[20px] text-[#1A1A2E] leading-relaxed font-medium mb-8">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            {/* Author details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B894] to-[#00D4AA] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {current.initials}
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#1A1A2E]">{current.name}</div>
                  <div className="text-[13px] text-[#718096]">
                    {current.role} • {current.flat}, {current.society}
                  </div>
                </div>
              </div>

              {/* Sample Disclaimer Badge */}
              {current.sample && (
                <span className="text-[10px] font-semibold text-[#718096] bg-gray-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
                  Sample resident testimonial
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Controls: Arrows & Dots & See All */}
        <div className="flex items-center justify-between mt-8">
          {/* Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-[#E2E8F0] hover:border-[#00B894] hover:bg-[#F0FAF7] flex items-center justify-center text-[#4A5568] hover:text-[#00B894] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-[#E2E8F0] hover:border-[#00B894] hover:bg-[#F0FAF7] flex items-center justify-center text-[#4A5568] hover:text-[#00B894] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to testimonial ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] ${
                  currentIndex === idx ? 'w-8 bg-[#00B894]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* See All Reviews Link */}
          <Link
            href="/testimonials"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00846A] hover:text-[#00B894] hover:underline"
          >
            <span>See all reviews</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
