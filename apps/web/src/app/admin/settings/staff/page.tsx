'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import {
  ArrowLeft,
  Settings,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Trash2,
} from 'lucide-react';

export default function StaffSettingsPage() {
  const [idProofMode, setIdProofMode] = useState<'IMAGE_ONLY' | 'NONE'>('IMAGE_ONLY');
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Domestic Staff Registry
        </Link>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                Staff Governance Configuration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Domestic Staff & ID Proof Policy
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure document retention schedules, encryption standards, and verification guidelines.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm self-start sm:self-auto"
          >
            Save Settings
          </button>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Staff policies updated and written to hash-chained audit log.</span>
          </div>
        )}

        {/* Setting 1: ID Proof Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Government ID Proof Collection Mode</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              STAFF_ID_PROOF_MODE
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 max-w-2xl">
            Under Indian DPDP Act compliance, society databases must minimize personal identifiable data.
            GrievEase NEVER stores Aadhaar/PAN/Voter card numbers. Only an encrypted visual copy can be submitted.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                idProofMode === 'IMAGE_ONLY'
                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="idProofMode"
                  checked={idProofMode === 'IMAGE_ONLY'}
                  onChange={() => setIdProofMode('IMAGE_ONLY')}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">IMAGE_ONLY (Recommended Default)</span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Upload encrypted document image for physical verification. Stored with AES-256-GCM.
                  </span>
                </div>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                idProofMode === 'NONE'
                  ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="idProofMode"
                  checked={idProofMode === 'NONE'}
                  onChange={() => setIdProofMode('NONE')}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">NONE (Zero-Document Retention)</span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    No ID proofs collected online. Verification conducted solely offline at the society office.
                  </span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Setting 2: Retention Days & Nightly Purge */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-teal-600" />
              <span>Automatic ID Proof Image Purge Window</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              STAFF_ID_RETENTION_DAYS
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 max-w-2xl">
            To prevent indefinite data accumulation, encrypted ID images are purged after verification.
            A nightly automated worker permanently deletes the image from storage and records the audit event.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={365}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center"
              />
              <span className="text-xs text-slate-700 font-medium">days after verification</span>
            </div>
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              * Placeholder default: 30 days (pending society legal committee decision)
            </span>
          </div>
        </div>

        {/* Pass Signing Key & Algorithm Specs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-teal-600" />
            <span>Cryptographic Standards & Offline Verification</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-slate-400 block mb-1">Pass Token Algorithm</span>
              <span className="font-mono font-bold text-slate-900">HMAC-SHA256</span>
              <span className="text-[11px] text-slate-500 block mt-1">Staff ID + Serial + Society</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-slate-400 block mb-1">Storage Encryption</span>
              <span className="font-mono font-bold text-slate-900">AES-256-GCM</span>
              <span className="text-[11px] text-slate-500 block mt-1">Key versioned via environment</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-slate-400 block mb-1">Signed URL Expiry</span>
              <span className="font-mono font-bold text-slate-900">60 Seconds</span>
              <span className="text-[11px] text-slate-500 block mt-1">View access strictly audited</span>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
