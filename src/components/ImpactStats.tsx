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

  const resolvedAnimated = useAnimatedCounter(stats?.issuesResolvedThisMonth || 0, 1800, impactVisible);
  const satisfactionAnimated = useAnimatedCounter(stats?.residentSatisfactionPct || 0, 1600, impactVisible);
  const residentsAnimated = useAnimatedCounter(stats?.activeResidents || 0, 2000, impactVisible);

  if (!siteConfig.featureFlags.showImpactStats || !stats) {
    return null;
  }

  return (
    <section id="impact" aria-labelledby="impact-heading" className="px-6 lg:px-12 py-10 bg-white">
      <div
        ref={sectionRef}
        className="max-w-[1300px] mx-auto bg-[#F0FAF7] rounded-[28px] p-7 sm:p-10 border border-[#B0EBDC]/50 relative overflow-hidden"
      >
        {/* Decorative Silhouette placed far to the bottom-right so it never touches or overlaps the left column text */}
        <div
          className="hidden md:block absolute -bottom-2 -right-4 w-72 h-28 opacity-15 pointer-events-none select-none"
          aria-hidden="true"
        >
          <svg className="w-full h-full text-[#00B894]" viewBox="0 0 320 120" fill="currentColor">
            <circle cx="40" cy="50" r="14" />
            <path d="M20,120 C20,85 30,75 40,75 C50,75 60,85 60,120 Z" />
            <circle cx="85" cy="45" r="16" />
            <path d="M60,120 C60,80 72,70 85,70 C98,70 110,80 110,120 Z" />
            <circle cx="130" cy="54" r="12" />
            <path d="M112,120 C112,88 120,80 130,80 C140,80 148,88 148,120 Z" />
            <circle cx="170" cy="48" r="15" />
            <path d="M148,120 C148,82 158,72 170,72 C182,72 192,82 192,120 Z" />
            <circle cx="215" cy="56" r="12" />
            <path d="M198,120 C198,90 205,82 215,82 C225,82 232,90 232,120 Z" />
          </svg>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Heading & copy (clear of silhouettes) */}
          <div className="xl:col-span-4">
            <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
              OUR IMPACT
            </span>
            <h2
              id="impact-heading"
              className="text-[28px] sm:text-[32px] font-bold text-[#1A1A2E] leading-tight mb-3"
            >
              Building stronger communities together
            </h2>
            <p className="text-[13.5px] text-[#4A5568] leading-relaxed max-w-[360px]">
              Real issues. Real people. Real solutions. GrievEase is making residential living better,
              one resolution at a time.
            </p>
          </div>

          {/* Right Column: 4 Stat Cards in a row with distinct icons */}
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stat 1: CheckCircle2 */}
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

            {/* Stat 2: Clock */}
            <div className="bg-white rounded-2xl p-5 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mx-auto mb-2.5">
                <Clock className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div className="text-[28px] font-extrabold text-[#3B82F6] tracking-tight leading-none mb-1">
                {stats.avgResolutionDays}d
              </div>
              <div className="text-[12px] font-medium text-[#718096]">
                Avg. Resolution <br /> Time
              </div>
            </div>

            {/* Stat 3: Smile */}
            <div className="bg-white rounded-2xl p-5 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-2.5">
                <Smile className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-[28px] font-extrabold text-amber-500 tracking-tight leading-none mb-1">
                {satisfactionAnimated}%
              </div>
              <div className="text-[12px] font-medium text-[#718096]">
                Resident <br /> Satisfaction
              </div>
            </div>

            {/* Stat 4: Users */}
            <div className="bg-white rounded-2xl p-5 text-center border border-[#E2E8F0]/80 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto mb-2.5">
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-[28px] font-extrabold text-indigo-500 tracking-tight leading-none mb-1">
                {residentsAnimated}+
              </div>
              <div className="text-[12px] font-medium text-[#718096]">
                Active <br /> Residents
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
