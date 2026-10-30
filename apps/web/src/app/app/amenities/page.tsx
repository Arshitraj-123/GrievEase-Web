'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Calendar,
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
  Info,
  CalendarCheck,
} from 'lucide-react';

export default function ResidentAmenitiesPage() {
  const { t } = useAccessibility();
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listAmenities()
      .then((data) => {
        setAmenities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // Fallback demo data
        setAmenities([
          {
            id: 'amenity-clubhouse',
            name: 'Clubhouse Banquet Hall',
            type: 'CLUBHOUSE',
            mode: 'EXCLUSIVE',
            capacity_total: 100,
            slot_minutes: 240,
            fee_mode: 'PER_BOOKING',
            fee_paise: 250000,
            deposit_paise: 500000,
            active: true,
          },
          {
            id: 'amenity-gym',
            name: 'Fitness Center & Gym',
            type: 'GYM',
            mode: 'CAPACITY',
            capacity_total: 20,
            slot_minutes: 60,
            fee_mode: 'NONE',
            fee_paise: 0,
            deposit_paise: 0,
            active: true,
          },
          {
            id: 'amenity-pool',
            name: 'Swimming Pool',
            type: 'POOL',
            mode: 'CAPACITY',
            capacity_total: 15,
            slot_minutes: 60,
            fee_mode: 'PER_SLOT',
            fee_paise: 5000,
            deposit_paise: 0,
            active: true,
          },
          {
            id: 'amenity-court',
            name: 'Badminton Court',
            type: 'COURT',
            mode: 'EXCLUSIVE',
            capacity_total: 4,
            slot_minutes: 60,
            fee_mode: 'NONE',
            fee_paise: 0,
            deposit_paise: 0,
            active: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-teal-600" />
              <span>{t.amenities.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.amenities.subtitle}
            </p>
          </div>
          <Link
            href="/app/bookings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold text-xs sm:text-sm border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors min-h-[44px]"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{t.amenities.myBookings}</span>
          </Link>
        </div>

        {/* Amenities Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading society amenities...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {amenity.type}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                        {amenity.name}
                      </h2>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        amenity.mode === 'EXCLUSIVE'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {amenity.mode === 'EXCLUSIVE'
                        ? t.amenities.exclusiveMode
                        : t.amenities.capacityMode}
                    </span>
                  </div>

                  {amenity.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {amenity.description}
                    </p>
                  )}

                  {/* Attributes strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 dark:border-slate-800 mb-4">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {t.amenities.capacity}: <strong>{amenity.capacity_total}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Slot: <strong>{amenity.slot_minutes} mins</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span>
                        {t.amenities.fee}:{' '}
                        <strong>
                          {amenity.fee_paise > 0
                            ? formatPaise(amenity.fee_paise)
                            : 'Free'}
                        </strong>
                      </span>
                    </div>
                    {amenity.deposit_paise > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span>
                          {t.amenities.deposit}:{' '}
                          <strong>{formatPaise(amenity.deposit_paise)}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/app/amenities/${amenity.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs sm:text-sm min-h-[44px] transition-all shadow-xs"
                >
                  <span>{t.amenities.bookSlot}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

