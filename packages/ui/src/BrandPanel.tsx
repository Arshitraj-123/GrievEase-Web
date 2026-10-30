'use client';

import { cn } from './utils';
import { EscalationIllustration } from './EscalationIllustration';
import { Clock, Shield, Link2, Building2 } from 'lucide-react';

export interface BrandPanelProps {
  className?: string;
  collapsed?: boolean;
}

export function BrandPanel({ className, collapsed = false }: BrandPanelProps) {
  // Mobile / Collapsed strip under the form card
  if (collapsed) {
    return (
      <div
        className={cn(
          'w-full mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-900/90 to-slate-900 text-white border border-teal-500/20 shadow-lg',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-2 text-teal-300">
          <Building2 className="w-4 h-4 shrink-0 text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Why GrievEase?</span>
        </div>
        <p className="text-sm font-semibold text-white mb-3">
          Raise it. Track it. Get it resolved.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
            <Clock className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Guaranteed SLA deadlines</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
            <Shield className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Anonymous filing option</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
            <Link2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Tamper-evident audit log</span>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="font-caveat text-teal-200 text-lg tracking-wide inline-block">
            A better community starts with you
          </span>
        </div>
      </div>
    );
  }

  // Desktop Left Brand Panel
  return (
    <aside
      className={cn(
        'relative hidden lg:flex lg:w-[45%] flex-col justify-between p-8 xl:p-12 text-white bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 overflow-hidden select-none',
        className
      )}
      aria-label="GrievEase Platform Highlights"
    >
      {/* Subtle Geometric Inline SVG Background Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <pattern id="brand-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M0 32V.5H32" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="0.5" cy="0.5" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#brand-grid)" />
      </svg>

      {/* Decorative ambient gradient blooms */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Identity */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/30">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block leading-none">
              Griev<span className="text-teal-300">Ease</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-teal-200/80 font-bold block mt-1">
              Autonomous Society Governance
            </span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="space-y-3 mb-8">
          <h1 className="text-[clamp(1.75rem,1rem+2.4vw,2.75rem)] font-extrabold tracking-tight leading-tight text-white">
            Raise it. Track it.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-300 block">
              Get it resolved.
            </span>
          </h1>
          <p className="text-[clamp(0.875rem,0.75rem+0.5vw,1.125rem)] text-teal-100/90 leading-relaxed max-w-md">
            Autonomous grievance resolution with guaranteed timelines, transparent escalation, and zero lost complaints.
          </p>
        </div>

        {/* Dynamic Escalation Chain Illustration */}
        <div className="mb-8">
          <EscalationIllustration activeLevel={2} />
        </div>
      </div>

      {/* Bottom Trust Points & Handwritten Accent */}
      <div className="relative z-10 space-y-6 pt-4 border-t border-white/10">
        <div className="space-y-3.5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Every complaint has a deadline</h2>
              <p className="text-[11px] text-teal-100/70 leading-normal">
                Strict SLA countdown clocks automatically escalate unaddressed issues up the 4-level chain.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Anonymous option for sensitive issues</h2>
              <p className="text-[11px] text-teal-100/70 leading-normal">
                Cryptographic vault protects resident identity while providing single-use follow-up codes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">A permanent, tamper-evident record</h2>
              <p className="text-[11px] text-teal-100/70 leading-normal">
                Cryptographic SHA-256 hash chains guarantee all status updates and notes cannot be altered.
              </p>
            </div>
          </div>
        </div>

        {/* Handwritten Accent Text - Used once, never overlapping */}
        <div className="pt-2 text-right">
          <span className="font-caveat text-teal-200 text-2xl tracking-wide inline-block transform -rotate-1 select-none">
            A better community starts with you ~
          </span>
        </div>
      </div>
    </aside>
  );
}
