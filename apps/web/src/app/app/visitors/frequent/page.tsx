'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
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
  Plus,
  Sparkles,
  ShieldAlert,
  User,
  Phone,
  Ban,
  CheckCircle2,
} from 'lucide-react';

export default function FrequentVisitorsPage() {
  const { t } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'FREQUENT' | 'BLOCKLIST'>('FREQUENT');
  const [frequent, setFrequent] = useState<any[]>([]);
  const [blocklist, setBlocklist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Frequent form state
  const [freqName, setFreqName] = useState('');
  const [freqPhone, setFreqPhone] = useState('');
  const [freqLabel, setFreqLabel] = useState('Family');

  // Blocklist form state
  const [blockReason, setBlockReason] = useState('');
  const [blockPhone, setBlockPhone] = useState('');
  const [blockName, setBlockName] = useState('');
  const [blockVehicle, setBlockVehicle] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'FREQUENT') {
        const data = await api.listFrequentVisitors();
        setFrequent(data || []);
      } else {
        const data = await api.listBlocklist();
        setBlocklist(data || []);
      }
    } catch {
      if (activeTab === 'FREQUENT') {
        setFrequent([
          { id: '1', name: 'Grandparents', label: 'Family' },
          { id: '2', name: 'Dr. Mehta', label: 'Doctor' },
        ]);
      } else {
        setBlocklist([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFrequent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freqName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createFrequentVisitor({
        name: freqName.trim(),
        phone: freqPhone ? freqPhone.trim() : undefined,
        label: freqLabel,
      });
      setFreqName('');
      setFreqPhone('');
      loadData();
    } catch {}
    setIsSubmitting(false);
  };

  const handleAddBlocklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReason.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createBlocklist({
        name: blockName ? blockName.trim() : undefined,
        phone: blockPhone ? blockPhone.trim() : undefined,
        vehicleNo: blockVehicle ? blockVehicle.trim().toUpperCase() : undefined,
        reason: blockReason.trim(),
      });
      setBlockName('');
      setBlockPhone('');
      setBlockVehicle('');
      setBlockReason('');
      loadData();
    } catch {}
    setIsSubmitting(false);
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <a
            href="/app/visitors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Visitors</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" />
            <span>{t.visitors?.frequentGuests || 'Frequent Guests & Blocklist'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal trusted guests for 1-tap pass creation and gate blocklist rules.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('FREQUENT')}
            className={`min-h-[44px] pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'FREQUENT'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Frequent Guests
          </button>
          <button
            onClick={() => setActiveTab('BLOCKLIST')}
            className={`min-h-[44px] pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'BLOCKLIST'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Flat Blocklist
          </button>
        </div>

        {/* FREQUENT GUESTS SECTION */}
        {activeTab === 'FREQUENT' && (
          <div className="space-y-6">
            {/* Add Frequent Guest Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Add Frequent Guest</CardTitle>
                <CardDescription className="text-xs">
                  Save regular visitors for quick pre-approvals without entering details repeatedly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFrequent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={freqName}
                    onChange={(e) => setFreqName(e.target.value)}
                    placeholder="Guest Full Name *"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                  <input
                    type="tel"
                    value={freqPhone}
                    onChange={(e) => setFreqPhone(e.target.value)}
                    placeholder="Mobile Number (Optional)"
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  />
                  <select
                    value={freqLabel}
                    onChange={(e) => setFreqLabel(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  >
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Doctor">Doctor / Caregiver</option>
                    <option value="Tutor">Tutor / Coach</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Guest</span>
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* List */}
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading frequent guests...</div>
            ) : frequent.length === 0 ? (
              <Card className="text-center py-8 p-4">
                <CardDescription>No frequent guests saved yet.</CardDescription>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {frequent.map((fg) => (
                  <Card key={fg.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {fg.name}
                        </div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {fg.label || 'Guest'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BLOCKLIST SECTION */}
        {activeTab === 'BLOCKLIST' && (
          <div className="space-y-6">
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  <span>Add Person to Flat Blocklist</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Blocked individuals cannot request gate entry to your flat. The gate screen will display &quot;Blocked by resident&quot; without revealing your private notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddBlocklist} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      placeholder="Person Name (Optional)"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                    />
                    <input
                      type="tel"
                      value={blockPhone}
                      onChange={(e) => setBlockPhone(e.target.value)}
                      placeholder="Phone Blind Index / Number"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                    />
                    <input
                      type="text"
                      value={blockVehicle}
                      onChange={(e) => setBlockVehicle(e.target.value.toUpperCase())}
                      placeholder="Vehicle Plate (Optional)"
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Reason for Block (Confidential) *"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Block Person from Flat</span>
                  </button>
                </form>
              </CardContent>
            </Card>

            {/* Blocklist display */}
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading blocklist...</div>
            ) : blocklist.length === 0 ? (
              <Card className="text-center py-8 p-4">
                <CardDescription>No individuals currently blocked by your flat.</CardDescription>
              </Card>
            ) : (
              <div className="space-y-2">
                {blocklist.map((b) => (
                  <Card key={b.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {b.name || b.vehicleNo || 'Blocked Person'}
                      </div>
                      <div className="text-xs text-slate-500">Reason: {b.reason}</div>
                    </div>
                    <Badge variant="danger" className="text-[10px]">BLOCKED</Badge>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
