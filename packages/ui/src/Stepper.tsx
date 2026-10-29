'use client';

import { cn } from './utils';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 1-indexed
  className?: string;
  onStepClick?: (stepIndex: number) => void;
}

export function Stepper({ steps, currentStep, className, onStepClick }: StepperProps) {
  const total = steps.length;
  const progressPercent = Math.max(0, Math.min(100, ((currentStep - 1) / Math.max(1, total - 1)) * 100));

  const activeStepItem = steps[currentStep - 1] || steps[0];

  return (
    <div
      role="region"
      aria-label={`Wizard progress: Step ${currentStep} of ${total}`}
      className={cn('w-full select-none space-y-3', className)}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
            Step {currentStep} of {total}
          </span>
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-xs">
            {activeStepItem?.label}
          </span>
        </div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Labelled Dots (Hidden text labels on phone < 400px to ensure clean 360px viewport) */}
      <div className="relative flex justify-between items-center pt-1">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center group relative cursor-default"
              onClick={() => {
                if (isDone && onStepClick) {
                  onStepClick(stepNumber);
                }
              }}
            >
              <div
                className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2',
                  isDone &&
                    'bg-teal-600 border-teal-600 text-white shadow-xs',
                  isCurrent &&
                    'bg-white dark:bg-slate-900 border-teal-600 text-teal-700 dark:text-teal-400 ring-4 ring-teal-500/20 scale-105 font-black',
                  !isDone &&
                    !isCurrent &&
                    'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <span>{stepNumber}</span>}
              </div>

              {/* Label (desktop & tablet) */}
              <span
                className={cn(
                  'hidden md:block mt-1 text-[11px] font-medium text-center truncate max-w-[80px]',
                  isCurrent ? 'text-teal-700 dark:text-teal-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
