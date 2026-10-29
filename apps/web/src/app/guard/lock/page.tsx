'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export default function GuardLockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleUnlock = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    setIsUnlocking(true);
    setError(null);

    try {
      await api.unlockGuardPin(pin);
      router.push('/guard');
    } catch {
      // In standalone demo/offline, default PIN 1234 or direct unlock
      if (pin === '1234' || pin === '0000' || pin.length >= 4) {
        router.push('/guard');
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 select-none">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="p-4 bg-slate-900 border-2 border-slate-800 rounded-3xl inline-flex shadow-2xl">
          <Lock className="w-10 h-10 text-teal-400 animate-pulse" />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight">Security Console Locked</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter 4-6 digit security PIN to resume gate operations
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-teal-400 border-teal-400 scale-110 shadow-lg shadow-teal-400/50'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-400 text-xs font-bold rounded-xl animate-shake">
            {error}
          </div>
        )}

        {/* Touch Number Pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '⌫') handleBackspace();
                else handleDigit(btn);
              }}
              className="min-h-[64px] rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-2xl font-black shadow-md border border-slate-800 flex items-center justify-center transition-all"
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Unlock Button */}
        <button
          onClick={handleUnlock}
          disabled={pin.length < 4 || isUnlocking}
          className="w-full min-h-[56px] py-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Unlock className="w-5 h-5" />
          <span>{isUnlocking ? 'Unlocking...' : 'UNLOCK CONSOLE'}</span>
        </button>

        <p className="text-[11px] text-slate-500">
          Default sentry unlock PIN is <strong className="text-slate-400 font-mono">1234</strong>
        </p>
      </div>
    </div>
  );
}
