'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from './utils';
import { TextField, TextFieldProps } from './TextField';
import { Eye, EyeOff, Lock, AlertTriangle, Check, X } from 'lucide-react';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'rightAction'> {
  showStrengthMeter?: boolean;
  minStrengthLength?: number;
  userInfoToAvoid?: string[];
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      showStrengthMeter = false,
      minStrengthLength = 10,
      userInfoToAvoid = [],
      value,
      onChange,
      onKeyDown,
      onKeyUp,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [capsLockActive, setCapsLockActive] = useState(false);

    const stringValue = typeof value === 'string' ? value : '';

    // Handle caps-lock detection
    const handleKeyActivity = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLockActive(e.getModifierState('CapsLock'));
      }
    };

    // Strength evaluation
    const hasMinLength = stringValue.length >= minStrengthLength;
    const hasMixedCase = /[a-z]/.test(stringValue) && /[A-Z]/.test(stringValue);
    const hasNumbersOrSymbols = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(stringValue);
    const isCommon =
      ['password', 'password123', 'admin123', 'qwerty', '12345678', 'welcome'].includes(
        stringValue.toLowerCase()
      );
    const containsUserInfo = userInfoToAvoid.some(
      (info) => info && info.length >= 3 && stringValue.toLowerCase().includes(info.toLowerCase())
    );

    let strengthScore = 0;
    if (hasMinLength) strengthScore += 1;
    if (hasMixedCase) strengthScore += 1;
    if (hasNumbersOrSymbols) strengthScore += 1;
    if (!isCommon && !containsUserInfo && stringValue.length > 0) strengthScore += 1;

    const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const strengthColors = [
      'bg-slate-200 dark:bg-slate-700',
      'bg-red-500',
      'bg-amber-500',
      'bg-teal-500',
      'bg-emerald-500',
    ];

    return (
      <div className="w-full space-y-2">
        <TextField
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          leftIcon={<Lock className="w-4 h-4" />}
          onKeyDown={(e) => {
            handleKeyActivity(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            handleKeyActivity(e);
            onKeyUp?.(e);
          }}
          rightAction={
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Caps Lock Alert Banner */}
        {capsLockActive && (
          <div
            role="status"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-fade-in"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Caps Lock is ON</span>
          </div>
        )}

        {/* Live Strength Meter & Checklist */}
        {showStrengthMeter && stringValue.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Password Strength:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {strengthLabels[strengthScore]}
              </span>
            </div>

            {/* 4-Segment Strength Bar */}
            <div className="grid grid-cols-4 gap-1.5 h-1.5">
              {[1, 2, 3, 4].map((seg) => (
                <div
                  key={seg}
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    seg <= strengthScore
                      ? strengthColors[strengthScore]
                      : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              ))}
            </div>

            {/* Live Requirements Checklist */}
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={hasMinLength ? 'text-slate-900 dark:text-white font-medium' : ''}>
                  At least {minStrengthLength} characters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {!isCommon ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={!isCommon ? 'text-slate-900 dark:text-white font-medium' : ''}>
                  Not a common dictionary word
                </span>
              </div>
              {userInfoToAvoid.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {!containsUserInfo ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className={!containsUserInfo ? 'text-slate-900 dark:text-white font-medium' : 'text-red-500 font-medium'}>
                    Does not include your Member ID or flat number
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
