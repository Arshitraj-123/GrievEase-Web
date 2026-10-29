'use client';

import React, { useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { guardSyncManager } from '@/lib/guard-offline-sync';
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
  QrCode,
  KeyRound,
  CheckCircle2,
  XCircle,
  UserCheck,
  User,
  Car,
  Clock,
  Send,
  Ban,
  ShieldCheck,
} from 'lucide-react';

export default function GuardEntryPage() {
  const [mode, setMode] = useState<'CODE' | 'WALKIN'>('CODE');
  const [passCode, setPassCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [admitSuccess, setAdmitSuccess] = useState(false);

  // Walkin Form State
  const [visitorName, setVisitorName] = useState('');
  const [purpose, setPurpose] = useState('Personal');
  const [flatId, setFlatId] = useState('Flat 101');
  const [vehicleNo, setVehicleNo] = useState('');
  const [walkinStatus, setWalkinStatus] = useState<'IDLE' | 'PENDING' | 'BLOCKED' | 'ERROR'>('IDLE');
  const [blockReason, setBlockReason] = useState<string | null>(null);

  // Number pad button click
  const handleDigit = (digit: string) => {
    if (passCode.length < 6) {
      setPassCode((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPassCode((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPassCode('');
    setVerificationResult(null);
    setAdmitSuccess(false);
  };

  const handleVerify = async () => {
    if (passCode.length < 6) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setAdmitSuccess(false);

    try {
      const res = await api.verifyPass({ code: passCode });
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({
        isValid: false,
        reason: err.message || 'Pass verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdmit = async () => {
    if (!verificationResult?.pass?.id) return;
    setIsAdmitting(true);
    try {
      await api.admitPass(verificationResult.pass.id);
      setAdmitSuccess(true);
    } catch {
      // Queue offline if network error
      guardSyncManager.enqueue('VERIFY_ENTRY', { passId: verificationResult.pass.id });
      setAdmitSuccess(true);
    } finally {
      setIsAdmitting(false);
    }
  };

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;
    setWalkinStatus('IDLE');
    setBlockReason(null);

    try {
      const res = await api.createWalkin({
        flatId,
        visitorName: visitorName.trim(),
        purpose,
        vehicleNo: vehicleNo ? vehicleNo.trim().toUpperCase() : undefined,
      });

      if (res?.isBlocked) {
        setWalkinStatus('BLOCKED');
        setBlockReason(res.reason || 'Blocked by society rule');
      } else {
        setWalkinStatus('PENDING');
      }
    } catch (err: any) {
      if (err.message?.includes('Blocked') || err.message?.includes('block')) {
        setWalkinStatus('BLOCKED');
        setBlockReason(err.message);
      } else {
        setWalkinStatus('ERROR');
      }
    }
  };

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <a
            href="/guard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gate Console</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Gate Check-In &amp; Entry Validation
          </h1>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200 dark:bg-slate-900 rounded-2xl">
          <button
            onClick={() => { setMode('CODE'); setVerificationResult(null); }}
            className={`min-h-[48px] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'CODE'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Verify Passcode / QR</span>
          </button>

          <button
            onClick={() => { setMode('WALKIN'); setVerificationResult(null); }}
            className={`min-h-[48px] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'WALKIN'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>3-Tap Walk-In Entry</span>
          </button>
        </div>

        {/* MODE 1: 6-DIGIT PASSCODE / QR */}
        {mode === 'CODE' && (
          <div className="space-y-5">
            {/* Display Screen */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Enter 6-Digit Gate Passcode
              </span>
              <div className="font-mono text-5xl font-black tracking-widest text-teal-400 min-h-[60px] flex items-center justify-center">
                {passCode.padEnd(6, '•')}
              </div>
            </div>

            {/* Verification Result Card */}
            {verificationResult && (
              verificationResult.isValid ? (
                <div className="p-6 bg-emerald-600 text-white rounded-3xl shadow-xl space-y-4 border-4 border-emerald-700 animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase text-amber-200">
                        PASS VALID - APPROVED
                      </div>
                      <div className="text-xl font-black">
                        {verificationResult.pass?.visitorName || 'Verified Guest'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-700/80 p-3 rounded-2xl text-xs space-y-1">
                    <div>Purpose: {verificationResult.pass?.purpose || 'Personal'}</div>
                    <div>Flat: {verificationResult.pass?.flatId || 'Host Flat'}</div>
                    {verificationResult.pass?.vehicleNo && (
                      <div>Vehicle: {verificationResult.pass?.vehicleNo}</div>
                    )}
                  </div>

                  {admitSuccess ? (
                    <div className="p-3 bg-white text-emerald-800 text-center font-black rounded-xl text-sm">
                      ENTRY LOGGED SUCCESSFULLY &bull; GATE OPENED
                    </div>
                  ) : (
                    <button
                      onClick={handleAdmit}
                      disabled={isAdmitting}
                      className="w-full min-h-[56px] py-4 bg-white hover:bg-emerald-50 text-emerald-800 font-black text-base rounded-2xl shadow-lg active:scale-95 transition-all"
                    >
                      {isAdmitting ? 'Logging...' : 'CONFIRM ENTRY & ADMIT GUEST'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-red-600 text-white rounded-3xl shadow-xl space-y-2 border-4 border-red-700 animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-white shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase text-amber-200">
                        ACCESS DENIED / INVALID PASS
                      </div>
                      <div className="text-base font-black">
                        {verificationResult.reason || 'Passcode not found, expired, or cancelled'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Touch Number Pad (min 56px targets) */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === '⌫') handleBackspace();
                    else handleDigit(btn);
                  }}
                  className="min-h-[64px] rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-2xl font-black shadow-md border border-slate-700 flex items-center justify-center transition-all"
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={passCode.length < 6 || isVerifying}
              className="w-full min-h-[56px] py-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-base rounded-2xl shadow-xl shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isVerifying ? 'Verifying...' : 'VERIFY PASSCODE'}</span>
            </button>
          </div>
        )}

        {/* MODE 2: 3-TAP WALKIN FORM */}
        {mode === 'WALKIN' && (
          <form onSubmit={handleWalkinSubmit} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Fast Walk-In Entry</CardTitle>
                <CardDescription className="text-xs">
                  Creates an approval request and triggers real-time chime on resident&apos;s device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Visitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[48px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Target Flat *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Flat 101', 'Flat 102', 'Flat 201', 'Flat 304', 'Flat 402', 'Flat 501'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFlatId(f)}
                        className={`min-h-[48px] rounded-xl text-xs font-bold border transition-all ${
                          flatId === f
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Purpose
                    </label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[48px]"
                    >
                      <option value="Personal">Personal Visit</option>
                      <option value="Delivery">Delivery / Courier</option>
                      <option value="Repair">Maintenance / Repair</option>
                      <option value="Cab">Cab Pickup / Drop</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Vehicle Plate (Optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                      placeholder="e.g. MH 02 CD 9921"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[48px]"
                    />
                  </div>
                </div>

                {/* State Feedbacks */}
                {walkinStatus === 'BLOCKED' && (
                  <div className="p-4 bg-red-600 text-white rounded-2xl flex items-center gap-3">
                    <Ban className="w-6 h-6 shrink-0" />
                    <div>
                      <div className="font-black text-sm">NOT ALLOWED - PERSON BLOCKED</div>
                      <div className="text-xs text-red-100">{blockReason || 'Blocked by resident'}</div>
                    </div>
                  </div>
                )}

                {walkinStatus === 'PENDING' && (
                  <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl flex items-center gap-3 font-bold text-xs">
                    <Clock className="w-5 h-5 animate-spin shrink-0" />
                    <span>Approval request dispatched to flat members. Awaiting decision...</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full min-h-[56px] py-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span>REQUEST RESIDENT APPROVAL</span>
                </button>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </ShellLayout>
  );
}
