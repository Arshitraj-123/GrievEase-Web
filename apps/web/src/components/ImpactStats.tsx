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
    <section id="impact" aria-labelledby="impact-heading" className="px-6 lg:px-12 py-10 bg-white">
      <div
        ref={sectionRef}
        className="max-w-[1300px] mx-auto bg-[#F0FAF7] rounded-[28px] p-7 sm:p-10 border border-[#B0EBDC]/50 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Heading & copy */}
          <div className="xl:col-span-4">
            <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
              VERIFIED IMPACT
            </span>
            <h2
              id="impact-heading"
              className="text-[28px] sm:text-[32px] font-bold text-[#1A1A2E] leading-tight mb-3"
            >
              Real governance for {stats.societyName}
            </h2>
            <p className="text-[13.5px] text-[#4A5568] leading-relaxed max-w-[360px] mb-4">
              Real issues. Real resolutions. Reconciled against our immutable audit ledger.
            </p>
            <a
              href="/transparency"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00846A] hover:underline"
            >
              <span>See live transparency dashboard</span>
              <span>→</span>
            </a>
          </div>

          {/* Right Column: Stat Cards */}
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat 1: Resolved */}
            <div className="bg-white rounded-2xl p-5 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#00B894]/10 flex items-center justify-center text-[#00846A] mx-auto mb-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00846A]" />
              </div>
              <div className="text-[28px] font-extrabold text-[#00846A] tracking-tight leading-none mb-1">
                {resolvedAnimated}
              </div>
              <div className="text-[12px] font-medium text-[#718096]">
                Issues Resolved <br /> This Month
              </div>
            </div>

            {/* Stat 2: Avg Resolution Hours */}
            <div className="bg-white rounded-2xl p-5 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mx-auto mb-2.5">
                <Clock className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="text-[28px] font-extrabold text-[#3B82F6] tracking-tight leading-none mb-1">
                {stats.averageResolutionHours}h
              </div>
              <div className="text-[12px] font-medium text-[#718096]">
                Average Net <br /> Resolution Time
              </div>
            </div>

            {/* Stat 3: Satisfaction */}
            <div className="bg-white rounded-2xl p-5 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-2.5">
                <Smile className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-[28px] font-extrabold text-amber-500 tracking-tight leading-none mb-1">
                {stats.satisfactionScore} ★
              </div>
              <div className="text-[12px] font-medium text-[#718096]">
                Resident Rating <br /> ({stats.ratingCount} reviews)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
