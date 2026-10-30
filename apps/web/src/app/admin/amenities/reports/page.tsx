'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Users,
  RefreshCw,
  Activity,
  Award,
} from 'lucide-react';

export default function AdminAmenityReportsPage() {
  const [reports, setReports] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getAmenityReports(dateFrom || undefined, dateTo || undefined);
      setReports(data);
    } catch (err: any) {
      console.warn('Failed to load amenity reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <ShellLayout activeNav="admin-amenities">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Amenity Reports & Analytics</h1>
                <p className="text-sm text-slate-500">
                  Facility utilisation by hour, peak times, no-show rates, and cancellation audits.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/amenities"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Amenities
            </Link>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={loadReports}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Apply Filter
            </button>
          </div>

          <button
            onClick={loadReports}
            className="p-2 border border-slate-200 hover:bg-white rounded-xl text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-3" />
            <p className="font-medium">Computing utilisation statistics...</p>
          </div>
        ) : !reports ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <p>No reporting data available.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Total Bookings</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                      {reports.totalBookings || 0}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                      {formatPaise(reports.totalRevenuePaise || 0)}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">No-Show Rate</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                      {reports.noShowRate ? `${reports.noShowRate}%` : '0%'}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Peak Slot Hour</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {reports.peakHour ? `${reports.peakHour}:00` : 'Evening'}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Utilisation by Amenity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Utilisation by Facility
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Booking counts and capacity utilization across each amenity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.byAmenity && reports.byAmenity.length > 0 ? (
                      reports.byAmenity.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-800">{item.amenityName}</span>
                            <span className="text-slate-600">
                              {item.bookingCount} bookings ({item.utilizationPercent || 0}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{ width: `${Math.min(100, item.utilizationPercent || 15)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No facility data available for this range.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation & No-Show Audit (Admin only, privacy-safe) */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Top Cancelling Units (Audit)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Aggregated cancellation frequencies for capacity planning.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-slate-100">
                    {reports.topCancellingFlats && reports.topCancellingFlats.length > 0 ? (
                      reports.topCancellingFlats.map((flat: any, idx: number) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            Unit {flat.flatNumber}
                          </span>
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md">
                            {flat.cancelCount} cancellations
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-6 text-center">
                        No excessive cancellations logged.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

