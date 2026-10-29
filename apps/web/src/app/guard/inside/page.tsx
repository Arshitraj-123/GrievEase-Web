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
  Search,
  LogOut,
  Car,
  Clock,
  AlertTriangle,
  User,
  CheckCircle2,
} from 'lucide-react';

export default function GuardInsidePage() {
  const [insideVisitors, setInsideVisitors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [exitedId, setExitedId] = useState<string | null>(null);

  useEffect(() => {
    loadInside();
  }, []);

  const loadInside = async () => {
    setIsLoading(true);
    try {
      const data = await api.listVisitLogs(undefined, true);
      setInsideVisitors(data || []);
    } catch {
      setInsideVisitors([
        {
          id: 'v-1',
          visitorName: 'Mahesh Sharma',
          flatId: 'Flat 101',
          purpose: 'Plumbing Works',
          vehicleNo: 'MH-02-ZZ-4921',
          inAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isOverstay: true,
        },
        {
          id: 'v-2',
          visitorName: 'Swiggy Delivery Partner',
          flatId: 'Flat 402',
          purpose: 'Food Delivery',
          vehicleNo: null,
          inAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          isOverstay: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkExit = async (id: string) => {
    try {
      await api.markVisitExit(id);
      setExitedId(id);
      setTimeout(() => {
        setInsideVisitors((prev) => prev.filter((v) => v.id !== id));
        setExitedId(null);
      }, 1200);
    } catch {
      guardSyncManager.enqueue('MARK_EXIT', { visitId: id });
      setInsideVisitors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const filtered = insideVisitors.filter((v) => {
    const q = searchTerm.toLowerCase();
    return (
      v.visitorName?.toLowerCase().includes(q) ||
      v.flatId?.toLowerCase().includes(q) ||
      v.vehicleNo?.toLowerCase().includes(q) ||
      v.purpose?.toLowerCase().includes(q)
    );
  });

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <a
              href="/guard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gate Console</span>
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Visitors &amp; Vehicles Inside Society
            </h1>
          </div>
          <Badge variant="success" className="text-xs px-3 py-1 font-black">
            {insideVisitors.length} Active Inside
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by visitor name, flat number, or vehicle plate..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold min-h-[48px]"
          />
        </div>

        {/* Visitor Cards */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading inside records...</div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12 p-6">
            <CardDescription>No visitors currently inside society matching search.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => {
              const stayMins = Math.round((Date.now() - new Date(v.inAt).getTime()) / 60000);
              const isOverstay = v.isOverstay || stayMins > 180;

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isOverstay
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900 dark:text-white">
                        {v.visitorName}
                      </span>
                      <Badge variant="outline" className="text-xs font-bold">
                        {v.flatId}
                      </Badge>
                      {isOverstay && (
                        <Badge variant="danger" className="text-[10px] animate-pulse">
                          OVERSTAY ({stayMins} mins)
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Purpose: {v.purpose}</span>
                      {v.vehicleNo && (
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <Car className="w-3.5 h-3.5" />
                          <span>{v.vehicleNo}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>In at {new Date(v.inAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </div>

                  {/* Mark Exit Button (min 56px touch target) */}
                  <button
                    onClick={() => handleMarkExit(v.id)}
                    className="min-h-[56px] px-6 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    {exitedId === v.id ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>EXIT LOGGED</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-5 h-5 text-amber-400" />
                        <span>MARK EXIT</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
