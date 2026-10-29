'use client';

import React, { useState, useEffect } from 'react';
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
  Truck,
  Package,
  CheckCircle2,
  Send,
  Building,
} from 'lucide-react';

export default function GuardDeliveriesPage() {
  const [company, setCompany] = useState('Amazon');
  const [flatId, setFlatId] = useState('Flat 101');
  const [agentName, setAgentName] = useState('');
  const [outcome, setOutcome] = useState<'HANDED_OVER' | 'LEFT_AT_GATE' | 'DENIED'>('LEFT_AT_GATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const [activeParcels, setActiveParcels] = useState<any[]>([]);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const logs = await api.listDeliveryLogs();
      setActiveParcels(logs || []);
    } catch {
      setActiveParcels([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoggedSuccess(false);

    const payload = {
      flatId,
      company,
      agentName: agentName ? agentName.trim() : undefined,
      outcome,
    };

    try {
      await api.logDeliveryArrival(payload);
      setLoggedSuccess(true);
      loadDeliveries();
      setAgentName('');
      setTimeout(() => setLoggedSuccess(false), 2500);
    } catch {
      guardSyncManager.enqueue('DELIVERY_LOG', payload);
      setLoggedSuccess(true);
      setTimeout(() => setLoggedSuccess(false), 2500);
    } finally {
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
            <Truck className="w-7 h-7 text-blue-600" />
            <span>Courier &amp; Delivery Drop-Off Desk</span>
          </h1>
        </div>

        {loggedSuccess && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 font-bold text-xs shadow-md animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>Courier arrival logged. Resident notified in-app immediately.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Log Courier Arrival</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Courier Company *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Blinkit', 'Other'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCompany(c)}
                      className={`min-h-[48px] rounded-xl text-xs font-black border transition-all ${
                        company === c
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Flat *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Flat 101', 'Flat 102', 'Flat 201', 'Flat 304', 'Flat 402', 'Flat 501'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFlatId(f)}
                      className={`min-h-[48px] rounded-xl text-xs font-bold border transition-all ${
                        flatId === f
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Delivery Agent Name / Phone (Optional)
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Ramesh K"
                  className="w-full px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold min-h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gate Action Outcome *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutcome('LEFT_AT_GATE')}
                    className={`min-h-[56px] p-3 rounded-2xl border-2 text-left text-xs font-bold transition-all ${
                      outcome === 'LEFT_AT_GATE'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>Leave at Gate Desk</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">Resident collects later</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutcome('HANDED_OVER')}
                    className={`min-h-[56px] p-3 rounded-2xl border-2 text-left text-xs font-bold transition-all ${
                      outcome === 'HANDED_OVER'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>Allow In / Handed Over</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">Delivered to flat door</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[56px] py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                <span>{isSubmitting ? 'Logging...' : 'RECORD COURIER ARRIVAL'}</span>
              </button>
            </CardContent>
          </Card>
        </form>
      </div>
    </ShellLayout>
  );
}
