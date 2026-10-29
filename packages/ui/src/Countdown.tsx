'use client';

import { useState, useEffect } from 'react';
import { cn } from './utils';
import { Clock } from 'lucide-react';

export interface CountdownProps {
  initialSeconds: number;
  onExpire?: () => void;
  className?: string;
  prefix?: string;
}

export function Countdown({
  initialSeconds,
  onExpire,
  className,
  prefix = 'Unlocks in',
}: CountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    setSecondsLeft(Math.max(0, initialSeconds));
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSeconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  return (
    <span
      role="timer"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-500/20',
        className
      )}
    >
      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse motion-reduce:animate-none" />
      <span>
        {prefix} {formatted}
      </span>
    </span>
  );
}
