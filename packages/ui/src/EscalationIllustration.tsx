'use client';

import { cn } from './utils';

export interface EscalationIllustrationProps {
  activeLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

const LEVELS = [
  { level: 1, label: 'L1 Secretary', hours: '48h', role: 'First Responder' },
  { level: 2, label: 'L2 Committee', hours: '72h', role: 'Management Review' },
  { level: 3, label: 'L3 Chairman', hours: '96h', role: 'Executive Authority' },
  { level: 4, label: 'L4 Governing Body', hours: '120h', role: 'Final Sovereign Body' },
];

export function EscalationIllustration({
  activeLevel = 2,
  className,
}: EscalationIllustrationProps) {
  return (
    <div
      className={cn(
        'w-full select-none rounded-2xl bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md border border-white/10 shadow-xl',
        className
      )}
      aria-label="Autonomous 4-level grievance resolution escalation chain"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
          Autonomous Escalation Engine
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-200 border border-teal-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping motion-reduce:animate-none" />
          Live SLA Clock
        </span>
      </div>

      {/* SVG Escalation Chain */}
      <div className="relative pt-2 pb-1">
        {/* Track Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-700/80 rounded-full" />

        {/* Animated Progress Gradient Line */}
        <div
          className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-teal-400 via-teal-300 to-amber-400 rounded-full transition-all duration-700"
          style={{
            width: `calc(${((activeLevel - 1) / (LEVELS.length - 1)) * 100}% * (100% - 3rem) / 100)`,
          }}
        />

        {/* Nodes Grid */}
        <div className="relative grid grid-cols-4 gap-1 text-center">
          {LEVELS.map((item) => {
            const isCompleted = item.level < activeLevel;
            const isActive = item.level === activeLevel;
            const isUpcoming = item.level > activeLevel;

            return (
              <div key={item.level} className="flex flex-col items-center group">
                {/* Node Circle */}
                <div
                  className={cn(
                    'relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border-2',
                    isCompleted &&
                      'bg-teal-500 border-teal-400 text-white shadow-md shadow-teal-500/40',
                    isActive &&
                      'bg-teal-400 border-white text-slate-950 ring-4 ring-teal-400/30 shadow-lg shadow-teal-400/50 scale-110',
                    isUpcoming &&
                      'bg-slate-800 border-slate-600 text-slate-400'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>L{item.level}</span>
                  )}

                  {/* Pulse Effect on Active Node (static fallback under reduced motion) */}
                  {isActive && (
                    <span className="absolute -inset-1 rounded-full bg-teal-400/30 animate-pulse motion-reduce:hidden -z-10" />
                  )}
                </div>

                {/* Level Label */}
                <span
                  className={cn(
                    'mt-2 text-[11px] sm:text-xs font-semibold leading-tight line-clamp-1',
                    isActive ? 'text-white font-bold' : 'text-slate-300'
                  )}
                >
                  {item.label.replace(/^L\d\s*/, '')}
                </span>

                {/* SLA Hours Badge */}
                <span
                  className={cn(
                    'mt-0.5 inline-block text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold',
                    isActive
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'text-slate-400'
                  )}
                >
                  {item.hours}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
        <span>Missed SLA &rarr; Instant auto-escalation</span>
        <span className="font-mono text-teal-300">Zero ignored tickets</span>
      </div>
    </div>
  );
}
