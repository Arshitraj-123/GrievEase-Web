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
  Receipt,
  Scale,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function AdminBillingSettingsPage() {
  const [fyStartMonth, setFyStartMonth] = useState('4');
  const [receiptPrefix, setReceiptPrefix] = useState('RC');
  const [billPrefix, setBillPrefix] = useState('BL');
  const [lateFeeType, setLateFeeType] = useState('FLAT');
  const [lateFeeValue, setLateFeeValue] = useState('100');
  const [graceDays, setGraceDays] = useState('5');
  const [lateFeeCap, setLateFeeCap] = useState('500');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const s = await api.getBillingSettings();
        if (s) {
          if (s.fy_start_month) setFyStartMonth(String(s.fy_start_month));
          if (s.receipt_prefix) setReceiptPrefix(String(s.receipt_prefix));
          if (s.bill_prefix) setBillPrefix(String(s.bill_prefix));
          if (s.late_fee_type) setLateFeeType(String(s.late_fee_type));
          if (s.late_fee_value) setLateFeeValue(String(s.late_fee_value));
          if (s.grace_days) setGraceDays(String(s.grace_days));
          if (s.late_fee_cap) setLateFeeCap(String(s.late_fee_cap));
        }
      } catch (err: any) {
        console.warn('Failed to load billing settings', err);
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
      await api.updateBillingSettings({
        fy_start_month: fyStartMonth,
        receipt_prefix: receiptPrefix.trim(),
        bill_prefix: billPrefix.trim(),
        late_fee_type: lateFeeType,
        late_fee_value: lateFeeValue,
        grace_days: graceDays,
        late_fee_cap: lateFeeCap,
      });
      setSuccessMsg('Billing & accounting settings saved successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update billing settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                <Settings className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Billing & Accounting Configuration</h1>
                <p className="text-sm text-slate-500">
                  Financial year cycle, receipt numbering prefixes, late fee rules, and statutory disclaimers.
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/billing"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Billing
          </Link>
        </div>

        {/* GST Statutory Note */}
        <div className="p-5 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-2xl flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-blue-950">Statutory Tax & GST Disclaimer</p>
            <p className="text-blue-800 leading-relaxed">
              <strong>Confirm GST applicability with your chartered accountant.</strong> Housing society maintenance
              may attract GST above statutory thresholds (e.g. ₹7,500/month per member in Maharashtra and aggregate
              turnover rules). GrievEase issues documents clearly labelled "Receipt" (not "Tax invoice") and records
              manual cash payments without third-party processing.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Financial Year & Numbering */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Financial Year & Sequential Numbering
              </CardTitle>
              <CardDescription className="text-xs">
                Gapless numbering sequences reset each financial year per society.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Financial Year Start Month
                  </label>
                  <select
                    value={fyStartMonth}
                    onChange={(e) => setFyStartMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="4">April (Standard Indian FY: Apr-Mar)</option>
                    <option value="1">January (Calendar Year: Jan-Dec)</option>
                    <option value="7">July</option>
                    <option value="10">October</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cash Receipt Prefix
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={receiptPrefix}
                    onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
                    placeholder="RC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    e.g. {receiptPrefix}/2026-27/000001
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maintenance Bill Prefix
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={billPrefix}
                    onChange={(e) => setBillPrefix(e.target.value.toUpperCase())}
                    placeholder="BL"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    e.g. {billPrefix}/2026-27/000001
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Late Fee Rules */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Late Fee Interest & Grace Period
              </CardTitle>
              <CardDescription className="text-xs">
                Automatic late fee calculation applied to overdue maintenance bills.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculation Type
                  </label>
                  <select
                    value={lateFeeType}
                    onChange={(e) => setLateFeeType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="FLAT">Flat Fee (₹)</option>
                    <option value="PERCENT_PER_MONTH">Percent / Month (%)</option>
                    <option value="PERCENT_PER_DAY">Percent / Day (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Value ({lateFeeType === 'FLAT' ? '₹' : '%'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lateFeeValue}
                    onChange={(e) => setLateFeeValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Cap (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lateFeeCap}
                    onChange={(e) => setLateFeeCap(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
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

