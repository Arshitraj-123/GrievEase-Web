'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  Wrench,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

export default function VendorTasksDashboardPage() {
  const { t } = useAccessibility();
  const [tab, setTab] = useState<'NEW' | 'ACTIVE' | 'COMPLETED'>('NEW');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getVendorTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAccept = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      await api.acceptVendorTask(taskId);
      await loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to accept task');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (taskId: string) => {
    const reason = prompt('Please enter the reason for declining:');
    if (!reason) return;
    setActionLoading(taskId);
    try {
      await api.declineVendorTask(taskId, reason);
      await loadTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to decline task');
    } finally {
      setActionLoading(null);
    }
  };

  const newTasks = tasks.filter((t) => t.status === 'ASSIGNED');
  const activeTasks = tasks.filter((t) =>
    ['ACCEPTED', 'VISIT_SCHEDULED', 'IN_PROGRESS'].includes(t.status)
  );
  const completedTasks = tasks.filter((t) =>
    ['COMPLETED', 'RESIDENT_CONFIRMED', 'DISPUTED'].includes(t.status)
  );

  const displayedTasks =
    tab === 'NEW' ? newTasks : tab === 'ACTIVE' ? activeTasks : completedTasks;

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'EMERGENCY':
        return <Badge variant="danger" className="text-[10px]">EMERGENCY</Badge>;
      case 'HIGH':
        return <Badge variant="warning" className="text-[10px]">HIGH</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="text-[10px]">LOW</Badge>;
      default:
        return <Badge variant="default" className="text-[10px]">MEDIUM</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'ASSIGNED':
        return <Badge variant="warning" className="text-[10px]">New / Assigned</Badge>;
      case 'ACCEPTED':
        return <Badge variant="default" className="text-[10px]">Accepted</Badge>;
      case 'VISIT_SCHEDULED':
        return <Badge variant="default" className="text-[10px] bg-blue-600">Visit Scheduled</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" className="text-[10px]">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" className="text-[10px]">Completed</Badge>;
      case 'RESIDENT_CONFIRMED':
        return <Badge variant="success" className="text-[10px]">Resident Confirmed</Badge>;
      case 'DISPUTED':
        return <Badge variant="danger" className="text-[10px]">Disputed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{s}</Badge>;
    }
  };

  return (
    <ShellLayout role="VENDOR" userRoleTitle="Vendor Partner">
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-teal-600" />
              {t.vendor?.title || 'Vendor Work Orders'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t.vendor?.subtitle || 'Assigned tasks, scheduling, photo documentation, and progress tracking'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/vendor/history">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {t.vendor?.history || 'History'}
              </Button>
            </Link>
            <Link href="/vendor/profile">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.vendor?.profile || 'Profile'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Privacy Callout */}
        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
          <span>
            {t.vendor?.privacyNotice ||
              'Resident privacy is protected. Only the service area and necessary work instructions are visible.'}
          </span>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setTab('NEW')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'NEW'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>{t.vendor?.newTasks || 'New Tasks'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {newTasks.length}
            </span>
          </button>
          <button
            onClick={() => setTab('ACTIVE')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'ACTIVE'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>{t.vendor?.activeTasks || 'Active Tasks'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {activeTasks.length}
            </span>
          </button>
          <button
            onClick={() => setTab('COMPLETED')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'COMPLETED'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span>{t.vendor?.completedTasks || 'Completed'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading work orders...</div>
        ) : displayedTasks.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No {tab.toLowerCase()} tasks found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                You are all caught up! New orders assigned by society office will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {displayedTasks.map((task) => (
              <Card
                key={task.id}
                className="hover:border-teal-400 transition-colors shadow-xs"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                      <span className="text-[11px] text-slate-400">
                        Assigned {new Date(task.assigned_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {task.flat_number
                            ? `Flat ${task.flat_number}${task.wing ? `, Wing ${task.wing}` : ''}`
                            : task.area_text || 'Society Premises'}
                        </span>
                      </div>

                      {task.expected_visit_from && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            Visit: {new Date(task.expected_visit_from).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    {task.status === 'ASSIGNED' && (
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          size="sm"
                          className="text-xs bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none"
                          onClick={() => handleAccept(task.id)}
                          disabled={actionLoading === task.id}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {t.vendor?.accept || 'Accept'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                          onClick={() => handleDecline(task.id)}
                          disabled={actionLoading === task.id}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          {t.vendor?.decline || 'Decline'}
                        </Button>
                      </div>
                    )}

                    <Link href={`/vendor/tasks/${task.id}`} className="w-full">
                      <Button
                        size="sm"
                        variant={task.status === 'ASSIGNED' ? 'secondary' : 'primary'}
                        className="text-xs w-full flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
