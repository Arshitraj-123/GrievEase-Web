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
  Truck,
  Plus,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function DeliveriesPage() {
  const { t } = useAccessibility();
  const [tab, setTab] = useState<'EXPECTED' | 'LOGS'>('EXPECTED');
  const [expected, setExpected] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New expected delivery form
  const [company, setCompany] = useState('Amazon');
  const [reference, setReference] = useState('');
  const [rule, setRule] = useState<'ALLOW_IN' | 'LEAVE_AT_GATE' | 'ASK_ME'>('LEAVE_AT_GATE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'EXPECTED') {
        const data = await api.listExpectedDeliveries();
        setExpected(data || []);
      } else {
        const data = await api.listDeliveryLogs();
        setLogs(data || []);
      }
    } catch {
      if (tab === 'EXPECTED') {
        setExpected([
          {
            id: 'exp-1',
            company: 'Amazon',
            reference: 'OD-9281923',
            rule: 'LEAVE_AT_GATE',
            status: 'EXPECTED',
            windowFrom: new Date().toISOString(),
            windowTo: new Date(Date.now() + 43200000).toISOString(),
          },
        ]);
      } else {
        setLogs([
          {
            id: 'log-1',
            company: 'Swiggy',
            outcome: 'HANDED_OVER',
            arrivedAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpected = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createExpectedDelivery({
        company,
        reference: reference ? reference.trim() : undefined,
        rule,
        windowFrom: new Date().toISOString(),
        windowTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      setIsModalOpen(false);
      setCompany('Amazon');
      setReference('');
      loadData();
    } catch {}
    setIsSubmitting(false);
  };

  const handleCollect = async (id: string) => {
    try {
      await api.markDeliveryCollected(id);
      loadData();
    } catch {}
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-7 h-7 text-teal-600" />
              <span>{t.deliveries?.title || 'Deliveries & Parcels'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t.deliveries?.subtitle || 'Expected courier packages, gate drop-offs, and pickup tracking'}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[44px] px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.deliveries?.addExpected || 'Expect a Delivery'}</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setTab('EXPECTED')}
            className={`min-h-[44px] pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              tab === 'EXPECTED'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.deliveries?.statusExpected || 'Expected Deliveries'}
          </button>
          <button
            onClick={() => setTab('LOGS')}
            className={`min-h-[44px] pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              tab === 'LOGS'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Past Arrivals
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading deliveries...</div>
        ) : tab === 'EXPECTED' ? (
          expected.length === 0 ? (
            <Card className="text-center py-12 p-6">
              <CardDescription>No expected deliveries currently registered.</CardDescription>
              <div className="mt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
                >
                  Register Expected Courier
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expected.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {item.company}
                      </Badge>
                      <Badge variant={item.status === 'EXPECTED' ? 'warning' : 'success'} className="text-[10px]">
                        {item.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold">
                      {item.company} Package
                    </CardTitle>
                    {item.reference && (
                      <CardDescription className="text-xs font-mono">
                        Ref: {item.reference}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      <div className="text-slate-500 font-medium">Gate Rule:</div>
                      <div className="font-bold text-teal-600">
                        {item.rule === 'ALLOW_IN' && (t.deliveries?.ruleAllowIn || 'Allow Inside to Flat')}
                        {item.rule === 'LEAVE_AT_GATE' && (t.deliveries?.ruleLeaveAtGate || 'Leave at Security Gate')}
                        {item.rule === 'ASK_ME' && (t.deliveries?.ruleAskMe || 'Ask Me at Gate Arrival')}
                      </div>
                    </div>

                    {item.status === 'LEFT_AT_GATE' && (
                      <button
                        onClick={() => handleCollect(item.id)}
                        className="w-full min-h-[44px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.deliveries?.markCollected || 'Mark as Collected'}</span>
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          logs.length === 0 ? (
            <Card className="text-center py-12 p-6">
              <CardDescription>No past delivery logs recorded.</CardDescription>
            </Card>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {log.company}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{log.outcome}</Badge>
                    </div>
                    {log.agentName && (
                      <div className="text-xs text-slate-500">Agent: {log.agentName}</div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(log.arrivedAt).toLocaleDateString()} {new Date(log.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Modal: Add Expected Delivery */}
        {isModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.deliveries?.addExpected || 'Register Expected Courier'}
              </h2>

              <form onSubmit={handleCreateExpected} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.deliveries?.company || 'Delivery Company'}
                  </label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  >
                    <option value="Amazon">Amazon</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Blinkit">Blinkit</option>
                    <option value="Zepto">Zepto</option>
                    <option value="BlueDart">BlueDart</option>
                    <option value="Other">Other Courier</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.deliveries?.reference || 'Order / Tracking ID (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. 402-9182390-1289"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.deliveries?.deliveryRule || 'Gate Action Rule'}
                  </label>
                  <div className="space-y-2">
                    {[
                      { rule: 'LEAVE_AT_GATE', label: t.deliveries?.ruleLeaveAtGate || 'Leave at Security Gate' },
                      { rule: 'ALLOW_IN', label: t.deliveries?.ruleAllowIn || 'Allow Inside to Flat' },
                      { rule: 'ASK_ME', label: t.deliveries?.ruleAskMe || 'Ask Me at Gate Arrival' },
                    ].map((item) => (
                      <button
                        key={item.rule}
                        type="button"
                        onClick={() => setRule(item.rule as any)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all min-h-[44px] flex items-center justify-between ${
                          rule === item.rule
                            ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{item.label}</span>
                        {rule === item.rule && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] px-5 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    {isSubmitting ? 'Saving...' : 'Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
