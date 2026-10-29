'use client';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from './utils';
import { Clipboard, Check } from 'lucide-react';

export interface CodeInputProps {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  allowAlpha?: boolean;
  label?: string;
  error?: string | null;
}

export function CodeInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = false,
  className,
  allowAlpha = true,
  label,
  error,
}: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [pastedFeedback, setPastedFeedback] = useState(false);

  // Normalize string to length array
  const chars = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const updateChars = (newChars: string[]) => {
    const combined = newChars.join('').slice(0, length);
    onChange?.(combined);
    if (combined.length === length) {
      onComplete?.(combined);
    }
  };

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) return;

    const filtered = allowAlpha
      ? rawVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      : rawVal.replace(/\D/g, '');

    if (!filtered) return;

    const newChars = [...chars];
    const lastChar = filtered[filtered.length - 1];
    if (lastChar) {
      newChars[index] = lastChar;
      updateChars(newChars);
    }

    // Auto-advance to next input
    if (index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!chars[index] && index > 0) {
        // Move back and clear previous
        const newChars = [...chars];
        newChars[index - 1] = '';
        updateChars(newChars);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newChars = [...chars];
        newChars[index] = '';
        updateChars(newChars);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const clean = allowAlpha
      ? pastedText.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, length)
      : pastedText.replace(/\D/g, '').slice(0, length);

    const newChars = Array.from({ length }, (_, i) => clean[i] || '');
    updateChars(newChars);

    // Focus last filled or next input
    const nextIdx = Math.min(clean.length, length - 1);
    inputsRef.current[nextIdx]?.focus();

    setPastedFeedback(true);
    setTimeout(() => setPastedFeedback(false), 2000);
  };

  const handleClipboardClick = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = allowAlpha
            ? text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, length)
            : text.replace(/\D/g, '').slice(0, length);

          const newChars = Array.from({ length }, (_, i) => clean[i] || '');
          updateChars(newChars);

          const nextIdx = Math.min(clean.length, length - 1);
          inputsRef.current[nextIdx]?.focus();

          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch {}
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex items-center justify-between">
        {label && (
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={handleClipboardClick}
          className="text-xs text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 font-semibold min-h-[32px] px-2 py-1 rounded-lg"
        >
          {pastedFeedback ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Pasted!</span>
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste from clipboard</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of Boxes */}
      <div
        className={cn(
          'grid gap-1.5 sm:gap-2',
          length === 10 ? 'grid-cols-5 sm:grid-cols-10' : length === 6 ? 'grid-cols-6' : 'grid-cols-4'
        )}
      >
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode={allowAlpha ? 'text' : 'numeric'}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            maxLength={1}
            disabled={disabled}
            value={chars[idx] || ''}
            onChange={(e) => handleInputChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${idx + 1} of ${length}`}
            className={cn(
              'h-12 w-full text-center font-mono text-lg font-black rounded-xl border transition-all select-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-red-500 bg-red-50/20 text-red-900 focus:ring-red-400 focus:border-red-500'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-400 focus:border-teal-600 focus:ring-teal-500/30'
            )}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
