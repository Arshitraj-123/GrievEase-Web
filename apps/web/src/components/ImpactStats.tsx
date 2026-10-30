'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, Smile, Users } from 'lucide-react';
import { getPublicStats, PublicStats } from '@/lib/api';
import { siteConfig } from '@/config/site';

function useAnimatedCounter(targetValue: number, duration: number = 2000, trigger: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * targetValue));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    setCount(0);
    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetValue, duration, trigger]);

  return count;
}

export function ImpactStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [impactVisible, setImpactVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (siteConfig.featureFlags.showImpactStats) {
      getPublicStats().then((data) => {
        if (data) setStats(data);
      });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImpactVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [stats]);

  const resolvedAnimated = useAnimatedCounter(stats?.resolvedThisMonth || 0, 1800, impactVisible);

  if (!siteConfig.featureFlags.showImpactStats || !stats) {
    return null;
  }

  return (
    <section id="impact" aria-labelledby="impact-heading" className="section-fluid bg-white">
      <div
        ref={sectionRef}
        className="container-fluid bg-[#F0FAF7] rounded-[32px] p-8 sm:p-12 border border-[#B0EBDC]/60 relative overflow-hidden shadow-xs"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Heading & copy */}
          <div className="xl:col-span-5">
            <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
              VERIFIED IMPACT
            </span>
            <h2
              id="impact-heading"
              className="fluid-h2 font-bold text-[#1A1A2E] leading-tight mb-3"
            >
              Real governance for {stats.societyName}
            </h2>
            <p className="fluid-body text-[#4A5568] leading-relaxed max-w-[440px] mb-6">
              Real issues. Real resolutions. Every action reconciled against our immutable hash-chained audit ledger with zero third-party telemetry.
            </p>
            <a
              href="/transparency"
              className="inline-flex items-center gap-2 text-base font-bold text-[#00846A] hover:text-[#00B894] hover:underline transition-colors"
            >
              <span>See live transparency dashboard</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* Right Column: Stat Cards */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Stat 1: Resolved */}
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#00B894]/10 flex items-center justify-center text-[#00846A] mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-[#00846A]" />
              </div>
              <div className="text-[34px] sm:text-[38px] font-extrabold text-[#00846A] tracking-tight leading-none mb-1.5">
                {resolvedAnimated}
              </div>
              <div className="text-[13px] font-semibold text-[#718096]">
                Issues Resolved <br /> This Month
              </div>
            </div>

            {/* Stat 2: Avg Resolution Hours */}
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mx-auto mb-3">
                <Clock className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <div className="text-[34px] sm:text-[38px] font-extrabold text-[#3B82F6] tracking-tight leading-none mb-1.5">
                {stats.averageResolutionHours}h
              </div>
              <div className="text-[13px] font-semibold text-[#718096]">
                Average Net <br /> Resolution Time
              </div>
            </div>

            {/* Stat 3: Satisfaction */}
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-3">
                <Smile className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-[34px] sm:text-[38px] font-extrabold text-amber-500 tracking-tight leading-none mb-1.5">
                {stats.satisfactionScore} ★
              </div>
              <div className="text-[13px] font-semibold text-[#718096]">
                Resident Rating <br /> ({stats.ratingCount} reviews)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
