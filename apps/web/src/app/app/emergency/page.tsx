'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackEmergencyContacts } from '@/lib/fallback-community';
import { EmergencyContactDto } from '@grievease/contracts';
import {
  PhoneCall,
  Shield,
  Flame,
  Activity,
  Zap,
  Droplets,
  Building,
  Phone,
  AlertTriangle,
  ArrowLeft,
  WifiOff,
} from 'lucide-react';

export default function EmergencyContactsPage() {
  const { t } = useAccessibility();
  const [contacts, setContacts] = useState<EmergencyContactDto[]>(fallbackEmergencyContacts);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Monitor online/offline status
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try fetching from API; if offline or fails, fallback remains active immediately
    api.getEmergencyContacts()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setContacts(res);
        }
      })
      .catch(() => {
        // Fallback already preloaded
      });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-6 h-6 text-emerald-600" />;
      case 'ambulance':
        return <Activity className="w-6 h-6 text-red-600" />;
      case 'fire':
        return <Flame className="w-6 h-6 text-orange-600" />;
      case 'police':
        return <Shield className="w-6 h-6 text-blue-600" />;
      case 'electricity board':
        return <Zap className="w-6 h-6 text-amber-500" />;
      case 'water board':
        return <Droplets className="w-6 h-6 text-cyan-600" />;
      case 'lift service':
        return <Building className="w-6 h-6 text-purple-600" />;
      default:
        return <PhoneCall className="w-6 h-6 text-teal-600" />;
    }
  };

  const getCardBg = (category: string) => {
    switch (category) {
      case 'security':
        return 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20';
      case 'ambulance':
      case 'fire':
      case 'police':
        return 'border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20';
      default:
        return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <PhoneCall className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.societyDirectory?.emergencyContactsTitle || 'Emergency Contacts'}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Immediate tap-to-call emergency services, security desk, and utility helplines
            </p>
          </div>

          {isOffline && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs font-semibold shrink-0">
              <WifiOff className="w-4 h-4" />
              <span>Offline Ready</span>
            </div>
          )}
        </div>

        {/* Offline Assistance Note */}
        <div className="rounded-2xl bg-slate-900 text-white p-4 flex items-center gap-3 text-xs shadow-xs">
          <Shield className="w-5 h-5 text-teal-400 shrink-0" />
          <span>
            <strong>Offline Guaranteed:</strong> This emergency contact registry is cached in your browser service worker so you can always tap-to-call even during network outages.
          </span>
        </div>

        {/* Big Tap-to-Call List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-3xl border p-5 shadow-xs flex flex-col justify-between gap-4 ${getCardBg(
                contact.category
              )}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-2xs shrink-0">
                  {getCategoryIcon(contact.category)}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    {contact.category}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {contact.name}
                  </h2>
                  {contact.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {contact.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Large Tap to Call Button (48px tap target) */}
              <a
                href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                className="w-full min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-base flex items-center justify-center gap-3 shadow-md active:scale-98 transition-all"
                aria-label={`Call ${contact.name} at ${contact.phone}`}
              >
                <Phone className="w-5 h-5 fill-current" />
                <span>Call {contact.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}
