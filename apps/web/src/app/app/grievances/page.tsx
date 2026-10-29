'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, Badge } from '@grievease/ui';
import {
  MessageSquare,
  Clock,
  PlusCircle,
  Search,
  ArrowRight,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

interface GrievanceItem {
  id: string;
  publicId: string;
  title: string;
  description: string;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'PENDING_INFO' | 'ESCALATED' | 'RESOLVED' | 'REOPENED' | 'CLOSED';
  currentLevel: number;
  categoryName: string;
  categoryIcon?: string;
  areaText?: string;
  areaTagName?: string;
  slaDueAt: string;
  createdAt: string;
  isAnonymous?: boolean;
  assignedToName?: string;
}

export default function ResidentGrievancesPage() {
  const { t } = useAccessibility();
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remindLoadingId, setRemindLoadingId] = useState<string | null>(null);
  const [remindFeedback, setRemindFeedback] = useState<{ id: string; message: string; isError?: boolean } | null>(null);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const data = await api.listMyGrievances();
      setGrievances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const handleRemind = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRemindLoadingId(id);
    setRemindFeedback(null);
    try {
      await api.remindResolver(id);
      setRemindFeedback({ id, message: 'Reminder sent to assigned resolver!' });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Cannot send reminder at this time.';
      setRemindFeedback({ id, message: msg, isError: true });
    } finally {
      setRemindLoadingId(null);
    }
  };

  const getSlaTimeLeft = (dueAtStr: string) => {
    const dueTime = new Date(dueAtStr).getTime();
    const now = Date.now();
    const diffMs = dueTime - now;

    if (diffMs <= 0) {
      return { text: 'SLA Breached', isOverdue: true, isCritical: true };
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 12) {
      return { text: `${hours}h ${mins}m remaining`, isCritical: true, isOverdue: false };
    }

    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return {
      text: days > 0 ? `${days}d ${remHours}h remaining` : `${hours}h remaining`,
      isCritical: false,
      isOverdue: false,
    };
  };

  const filteredGrievances = grievances.filter((item) => {
    if (activeTab === 'OPEN' && !['SUBMITTED', 'ACKNOWLEDGED'].includes(item.status)) return false;
    if (activeTab === 'IN_PROGRESS' && item.status !== 'IN_PROGRESS') return false;
    if (activeTab === 'PENDING_INFO' && item.status !== 'PENDING_INFO') return false;
    if (activeTab === 'ESCALATED' && item.status !== 'ESCALATED') return false;
    if (activeTab === 'RESOLVED' && !['RESOLVED', 'CLOSED'].includes(item.status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchId = item.publicId?.toLowerCase().includes(q);
      const matchCategory = item.categoryName?.toLowerCase().includes(q);
      return matchTitle || matchId || matchCategory;
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return <Badge className="bg-red-600 text-white border-red-700 text-[10px]">Emergency</Badge>;
      case 'URGENT':
        return <Badge className="bg-amber-600 text-white border-amber-700 text-[10px]">Urgent</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px]">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px]">Submitted</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px]">Acknowledged</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px]">In Progress</Badge>;
      case 'PENDING_INFO':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px]">Pending Info</Badge>;
      case 'ESCALATED':
        return <Badge className="bg-rose-600 text-white text-[10px] animate-pulse">Escalated</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">Resolved</Badge>;
      case 'CLOSED':
        return <Badge className="bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[10px]">Closed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return t.governance.level1;
      case 2:
        return t.governance.level2;
      case 3:
        return t.governance.level3;
      case 4:
        return t.governance.level4;
      default:
        return `Level ${level}`;
    }
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header (360px Mobile-First) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t.grievances.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {t.grievances.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/grievances/new"
              className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all border border-teal-400/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.grievances.raiseButton}</span>
            </Link>

            <Link
              href="/app/grievances/drafts"
              className="min-h-[48px] px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all"
              title="Drafts"
            >
              <span>Drafts</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, title, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm min-h-[44px]"
            />
          </div>

          {/* Filter Tabs (Horizontal Scroll on 360px phones) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'ALL', label: t.grievances.allStatus },
              { id: 'OPEN', label: t.grievances.open },
              { id: 'IN_PROGRESS', label: t.grievances.inProgress },
              { id: 'PENDING_INFO', label: t.grievances.pendingInfo },
              { id: 'ESCALATED', label: t.grievances.escalated },
              { id: 'RESOLVED', label: t.grievances.resolved },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grievance List Items */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/50 dark:border-slate-800" />
            ))}
          </div>
        ) : filteredGrievances.length === 0 ? (
          <Card className="border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {grievances.length === 0 ? 'No Grievances Raised Yet' : 'No Matching Grievances'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              {grievances.length === 0
                ? 'Submit an issue to society management with guaranteed SLA resolution.'
                : 'Try clearing your search query or selecting another filter tab.'}
            </p>
            {grievances.length === 0 && (
              <Link
                href="/app/grievances/new"
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.grievances.raiseButton}</span>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredGrievances.map((item) => {
              const sla = getSlaTimeLeft(item.slaDueAt);
              const isClosed = ['RESOLVED', 'CLOSED'].includes(item.status);

              return (
                <Link
                  key={item.id}
                  href={`/app/grievances/${item.id}`}
                  className="block p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500/80 shadow-sm transition-all group min-h-[44px]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400">
                        {item.publicId}
                      </span>
                      {getPriorityBadge(item.priority)}
                      {getStatusBadge(item.status)}
                      {item.isAnonymous && (
                        <Badge variant="outline" className="text-[10px] text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800">
                          Anonymous
                        </Badge>
                      )}
                    </div>

                    {/* SLA Timer (Turns red < 12h) */}
                    {!isClosed && (
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                          sla.isCritical
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${sla.isCritical ? 'text-rose-600' : 'text-slate-500'}`} />
                        <span>{sla.text}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-teal-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        📁 {item.categoryName}
                      </span>
                      {item.areaText && <span>📍 {item.areaText}</span>}
                      <span>🏛️ {getLevelLabel(item.currentLevel)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isClosed && (
                        <button
                          onClick={(e) => handleRemind(item.id, e)}
                          disabled={remindLoadingId === item.id}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                        >
                          <Bell className="w-3 h-3 text-amber-500" />
                          <span>{remindLoadingId === item.id ? 'Sending...' : t.grievances.remindResolver}</span>
                        </button>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Reminder Feedback banner */}
                  {remindFeedback && remindFeedback.id === item.id && (
                    <div
                      className={`mt-2.5 p-2 rounded-xl text-xs flex items-center gap-2 ${
                        remindFeedback.isError
                          ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200'
                      }`}
                    >
                      {remindFeedback.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      <span>{remindFeedback.message}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
