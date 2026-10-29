'use client';

import React, { forwardRef } from 'react';
import { cn } from './utils';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  floatingLabel?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightAction,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const errorId = error && generatedId ? `${generatedId}-error` : undefined;
    const helperId = helperText && generatedId ? `${generatedId}-helper` : undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={generatedId}
              className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {label}
              {required && <span className="text-red-500 ml-1 font-bold">*</span>}
            </label>
          </div>
        )}

        <div className="relative rounded-xl shadow-xs">
          {leftIcon && (
            <div
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 flex items-center justify-center"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            id={generatedId}
            ref={ref}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId || helperId || undefined}
            className={cn(
              'block w-full min-h-[48px] rounded-xl border text-base transition-all font-sans',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed',
              leftIcon ? 'pl-11' : 'pl-4',
              rightAction ? 'pr-12' : 'pr-4',
              'py-2.5 bg-white dark:bg-slate-900',
              error
                ? 'border-red-500 text-red-950 dark:text-red-200 focus:ring-red-500/30 focus:border-red-500 bg-red-50/20'
                : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-teal-500/30 focus:border-teal-600',
              className
            )}
            {...props}
          />

          {rightAction && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
              {rightAction}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
