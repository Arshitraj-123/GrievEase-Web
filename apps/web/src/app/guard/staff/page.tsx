'use client';

import React, { useState } from 'react';
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
  ArrowLeft,
  Users,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function GuardStaffScanPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setIsScanning(true);
    setScanResult(null);
    setError(null);

    try {
      const res = await api.verifyStaffScan(tokenInput.trim());
      setScanResult(res);
      setTokenInput('');
    } catch (err: any) {
      setError(err.message || 'Staff badge verification failed or invalid signature');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div>
          <a
            href="/guard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gate Console</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-purple-600" />
            <span>Domestic Staff Gate Verification</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Scan staff digital badge token to verify identity and record append-only GUARD_SCAN attendance.
          </p>
        </div>

        {/* Scan Input Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Badge Token Scanner</CardTitle>
            <CardDescription className="text-xs">
              Point camera scanner or paste token from digital staff badge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Staff Pass Token
                </label>
                <div className="relative">
                  <QrCode className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Scan QR or paste staff pass token..."
                    className="w-full pl-11 pr-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono min-h-[48px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isScanning}
                className="w-full min-h-[56px] py-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isScanning ? 'Verifying Badge...' : 'VERIFY & LOG ATTENDANCE'}</span>
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Scan Error */}
        {error && (
          <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg border-2 border-red-700 flex items-center gap-3">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">ACCESS DENIED / INVALID STAFF BADGE</div>
              <div className="text-xs text-red-100">{error}</div>
            </div>
          </div>
        )}

        {/* Scan Success Card */}
        {scanResult && (
          <div className="p-6 bg-emerald-600 text-white rounded-3xl shadow-xl space-y-4 border-4 border-emerald-700 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-amber-300 shrink-0" />
                <div>
                  <div className="text-xs font-black uppercase text-amber-200">
                    VERIFIED &bull; ATTENDANCE LOGGED (GUARD_SCAN)
                  </div>
                  <div className="text-xl font-black">
                    {scanResult.staff?.name || 'Domestic Staff Member'}
                  </div>
                </div>
              </div>

              <Badge variant="outline" className="text-xs font-bold text-white border-white">
                {scanResult.staff?.role || 'MAID'}
              </Badge>
            </div>

            <div className="bg-emerald-700/80 p-3.5 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Associated Flats:</span>
                <strong>{scanResult.staff?.flats?.join(', ') || 'Flat 101, 204'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Schedule Status:</span>
                <strong className="text-amber-200">
                  {scanResult.isOutSchedule ? 'Out of Expected Hours (Decision Logged)' : 'On Schedule'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Attendance Method:</span>
                <strong>GUARD_SCAN (Append-Only)</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
