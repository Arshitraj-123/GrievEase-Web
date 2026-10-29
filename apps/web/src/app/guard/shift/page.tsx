'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Send,
  LogOut,
  LogIn,
} from 'lucide-react';

export default function GuardShiftPage() {
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleCheck = async () => {
    setIsSubmitting(true);
    try {
      if (isCheckedIn) {
        await api.guardShiftCheckOut();
        setIsCheckedIn(false);
        setSuccessMsg('Checked out of shift.');
      } else {
        await api.guardShiftCheckIn();
        setIsCheckedIn(true);
        setSuccessMsg('Checked into shift.');
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setIsCheckedIn(!isCheckedIn);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNotes.trim()) return;
    setIsSubmitting(true);
    try {
      await api.submitShiftHandover({
        notes: handoverNotes.trim(),
      });
      setSuccessMsg('Shift handover notes submitted successfully!');
      setHandoverNotes('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {}
    finally {
      setIsSubmitting(false);
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
            <Clock className="w-7 h-7 text-teal-600" />
            <span>Shift Operations &amp; Handover</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record append-only guard shift attendance and submit handover notes for the incoming sentry.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 font-bold text-xs shadow-md animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Current Shift Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">My Active Sentry Shift</CardTitle>
              <Badge variant={isCheckedIn ? 'success' : 'default'} className="text-xs font-bold">
                {isCheckedIn ? 'ON DUTY' : 'OFF DUTY'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Shift Time: Morning 08:00 - 16:00 &bull; Main Gate Sentry Post #1
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={handleToggleCheck}
              disabled={isSubmitting}
              className={`w-full min-h-[56px] py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                isCheckedIn
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isCheckedIn ? (
                <>
                  <LogOut className="w-5 h-5" />
                  <span>CHECK OUT OF SHIFT</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>CHECK IN TO SHIFT</span>
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Shift Handover Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Shift Handover Summary</CardTitle>
            <CardDescription className="text-xs">
              Outgoing guard summarizes pending courier parcels, vehicles inside, and ongoing maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleHandover} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">Auto-Attached Checklist:</div>
                <div>&bull; Gate parcel drop box: 2 uncollected packages</div>
                <div>&bull; Vehicles parked inside: 1 visitor vehicle (Flat 101)</div>
                <div>&bull; Active incidents: 0 open security alerts</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Outgoing Guard Handover Notes *
                </label>
                <textarea
                  rows={4}
                  required
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Handed over gate keys, walkie-talkie #3, and visitor log. Sentry booth clean."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[56px] py-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>{isSubmitting ? 'Submitting...' : 'SUBMIT SHIFT HANDOVER'}</span>
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
