'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { t } = useAccessibility();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Register service worker if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Service worker successfully registered
          })
          .catch(() => {
            // SW registration failed silently
          });
      });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if user hasn't explicitly dismissed it this session
      const dismissed = sessionStorage.getItem('grievease_pwa_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('grievease_pwa_dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900 border border-teal-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            G
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{t.pwa.installTitle}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">{t.pwa.installDescription}</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t.pwa.dismissButton}
          className="text-slate-400 hover:text-white p-1 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1 -mt-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>{t.pwa.installButton}</span>
        </button>
        <button
          onClick={handleDismiss}
          className="min-h-[44px] px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
        >
          {t.pwa.dismissButton}
        </button>
      </div>
    </div>
  );
}
