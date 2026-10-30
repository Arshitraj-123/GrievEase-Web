'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  Settings,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowLeft,
  Calendar,
  Lock,
} from 'lucide-react';

export default function AdminAmenitySettingsPage() {
  const [blockOverdueDays, setBlockOverdueDays] = useState<number>(0);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(30);
  const [defaultHoldHours, setDefaultHoldHours] = useState<number>(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await api.getAmenitySettings();
        if (res) {
          if (res.block_booking_if_overdue_days !== undefined) {
            setBlockOverdueDays(Number(res.block_booking_if_overdue_days));
          }
          if (res.default_advance_days !== undefined) {
            setMaxAdvanceDays(Number(res.default_advance_days));
          }
          if (res.default_hold_hours !== undefined) {
            setDefaultHoldHours(Number(res.default_hold_hours));
          }
        }
      } catch (err: any) {
        console.warn('Failed to load amenity settings', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await api.updateAmenitySettings({
        block_booking_if_overdue_days: String(blockOverdueDays),
        default_advance_days: String(maxAdvanceDays),
        default_hold_hours: String(defaultHoldHours),
      });
      setSuccessMsg('Amenity policy settings saved successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update amenity settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-amenities">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                <Settings className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Amenity Rules & Policies</h1>
                <p className="text-sm text-slate-500">
                  Configure society-wide rules, overdue dues blocking, and cash hold expiry windows.
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/amenities"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Amenities
          </Link>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {errorMsg}
          </div>
        )}

        {/* Policy Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Maintenance Dues Linking Rule
              </CardTitle>
              <CardDescription className="text-xs">
                Restrict residents with unpaid maintenance bills from reserving society facilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <p className="text-xs text-amber-900 font-medium">
                  <strong>Policy behavior:</strong> When set to greater than 0, residents whose maintenance
                  bills are overdue past the specified threshold will receive a respectful notification explaining
                  the block with instructions on how to pay at the society office. Never a silent failure.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Block amenity booking if maintenance bill is overdue by (days):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={blockOverdueDays}
                    onChange={(e) => setBlockOverdueDays(Number(e.target.value))}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">
                    {blockOverdueDays === 0 ? '(0 = Rule disabled; all residents can book)' : 'days overdue'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Booking & Hold Windows
              </CardTitle>
              <CardDescription className="text-xs">
                Default timing constraints across all amenities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cash Payment Hold Window (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={defaultHoldHours}
                    onChange={(e) => setDefaultHoldHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Duration a slot is held awaiting cash settlement before automatic release.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Advance Booking (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    How far in advance residents can reserve facilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </ShellLayout>
  );
}

