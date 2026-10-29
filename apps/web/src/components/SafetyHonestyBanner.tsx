'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from './AccessibilityProvider';

interface SafetyHonestyBannerProps {
  className?: string;
  forceShow?: boolean;
}

export function SafetyHonestyBanner({ className = '', forceShow = false }: SafetyHonestyBannerProps) {
  const { t } = useAccessibility();
  const [hasOnlineGuards, setHasOnlineGuards] = useState<boolean>(true);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [emergencyPhone, setEmergencyPhone] = useState<string>('+91-22-2555-0199');

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const res = await api.getOnlineGuardsStatus();
        if (isMounted) {
          setHasOnlineGuards(res.hasOnlineGuards);
          setOnlineCount(res.onlineCount);
        }
      } catch {
        // Fallback for safety honesty if offline
        if (isMounted) {
          setHasOnlineGuards(false);
          setOnlineCount(0);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // 15s heartbeat poll

    // Also get emergency contacts for tap to call
    api.getEmergencyContacts().then((contacts: any[]) => {
      if (contacts && contacts.length > 0) {
        const gate = contacts.find((c: any) => c.category === 'SECURITY' || c.name?.toLowerCase().includes('gate'));
        if (gate && gate.phoneNumber) {
          setEmergencyPhone(gate.phoneNumber);
        }
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (hasOnlineGuards && !forceShow) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border-2 border-red-700 animate-in fade-in duration-200 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-700/80 rounded-xl shrink-0">
          <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-amber-200">
            Safety Warning • In-App Delivery Limit
          </div>
          <p className="text-xs sm:text-sm font-bold leading-tight">
            {t.safetyHonesty?.noGuardsOnline || 'No guard console is online. Call security desk directly now.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <a
          href={`tel:${emergencyPhone}`}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-white text-red-700 hover:bg-amber-50 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
        >
          <PhoneCall className="w-4 h-4 text-red-600" />
          <span>{emergencyPhone}</span>
        </a>
      </div>
    </div>
  );
}
