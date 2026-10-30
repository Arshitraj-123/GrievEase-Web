'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  User,
  ShieldCheck,
  Building,
  Phone,
  Tag,
  ChevronLeft,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export default function VendorProfilePage() {
  const { t } = useAccessibility();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendorProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error('Failed to load profile', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="VENDOR" userRoleTitle="Vendor Partner">
      <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-4">
        <Link
          href="/vendor"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Work Orders</span>
        </Link>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-teal-600" />
            {t.vendor?.profile || 'Vendor Partner Profile'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered agency and technician credentials authorized by Green Valley Residency.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading profile...</div>
        ) : !profile ? (
          <Card className="py-8 text-center text-xs text-slate-500">Profile data unavailable.</Card>
        ) : (
          <Card className="shadow-xs">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    {profile.company_name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Authorized Society Service Contractor
                  </CardDescription>
                </div>
                <Badge variant="success" className="text-xs">
                  {profile.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Contact Person</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {profile.contact_person}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Primary Category</span>
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                      {profile.category}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Registered Phone</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{profile.phone || 'Protected / On Record'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Registration Date</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {profile.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <span className="text-slate-400 font-medium">Office Terms &amp; Scope</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {profile.notes}
                  </p>
                </div>
              )}

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg text-teal-900 dark:text-teal-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
                <span>
                  All gate entries and visit passes are verified by society security and logged in the immutable audit chain.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
}

