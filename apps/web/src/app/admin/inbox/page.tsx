'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import {
  Inbox,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  EyeOff,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  CheckSquare,
  Square,
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface InboxGrievance {
  id: string;
  publicId: string;
  title: string;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: string;
  currentLevel: number;
  categoryName: string;
  areaText?: string;
  slaDueAt: string;
  createdAt: string;
  isAnonymous: boolean;
  assignedTo?: string;
  assignedToName?: string;
  submitter: {
    fullName: string;
    isAnonymous: boolean;
  };
}

function AdminInboxContent() {
  const searchParams = useSearchParams();
  const [grievances, setGrievances] = useState<InboxGrievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'URGENT' | 'ESCALATED' | 'PENDING_INFO'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const query: any = {};
      if (activeTab === 'URGENT') query.urgent = true;
      if (activeTab === 'ESCALATED') query.status = 'ESCALATED';
      if (activeTab === 'PENDING_INFO') query.status = 'PENDING_INFO';
      if (selectedLevel !== 'ALL') query.level = Number(selectedLevel);
      if (assignedToMeOnly) query.assignedToMe = true;

      const res = await api.getAdminInbox(query);
      setGrievances(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load inbox:', err);
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check initial query params
    const initialStatus = searchParams?.get('status');
    const initialUrgent = searchParams?.get('urgent');
    const initialAssignedToMe = searchParams?.get('assignedToMe');

    if (initialStatus === 'ESCALATED') setActiveTab('ESCALATED');
    else if (initialStatus === 'PENDING_INFO') setActiveTab('PENDING_INFO');
    else if (initialUrgent === 'true') setActiveTab('URGENT');

    if (initialAssignedToMe === 'true') setAssignedToMeOnly(true);
  }, [searchParams]);

  useEffect(() => {
    fetchInbox();
  }, [activeTab, selectedLevel, assignedToMeOnly]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((g) => g.id));
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selectedIds) {
        await api.acknowledgeGrievance(id).catch(() => {});
      }
      setSelectedIds([]);
      fetchInbox();
    } finally {
      setBulkLoading(false);
    }
  };

  const getSlaInfo = (dueAtStr: string) => {
    const dueTime = new Date(dueAtStr).getTime();
    const now = Date.now();
    const diffMs = dueTime - now;

    if (diffMs <= 0) return { text: 'BREACHED', isBreached: true };
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 12) return { text: `${hours}h ${mins}m left`, isCritical: true };
    return { text: `${Math.floor(hours / 24)}d ${hours % 24}h left`, isNormal: true };
  };

  const filteredItems = grievances.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.publicId?.toLowerCase().includes(q) ||
      g.title?.toLowerCase().includes(q) ||
      g.categoryName?.toLowerCase().includes(q)
    );
  });

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Resolver Inbox">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grievance Resolver Inbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage resident submissions, SLA clocks, and step-by-step resolution.
            </p>
          </div>

          <Link
            href="/admin/grievances/on-behalf"
            className="min-h-[48px] px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create On-Behalf</span>
          </Link>
        </div>

        {/* Tab Selector & Controls */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'URGENT', label: 'Urgent & Emergency' },
                { id: 'ESCALATED', label: 'Escalated' },
                { id: 'PENDING_INFO', label: 'Pending Info' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`min-h-[40px] px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none min-h-[40px]"
              >
                <option value="ALL">All Levels (1-4)</option>
                <option value="1">Level 1: Secretary</option>
                <option value="2">Level 2: Committee</option>
                <option value="3">Level 3: Chairman</option>
                <option value="4">Level 4: Governing Body</option>
              </select>

              <button
                type="button"
                onClick={() => setAssignedToMeOnly((prev) => !prev)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                  assignedToMeOnly
                    ? 'bg-teal-50 border-teal-500 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Assigned to Me
              </button>
            </div>
          </div>

          {/* Search bar & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by Reference ID, title, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 min-h-[42px]"
              />
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 p-1.5 px-3 rounded-2xl border border-teal-200">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  {selectedIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleBulkAcknowledge}
                  disabled={bulkLoading}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition-all"
                >
                  {bulkLoading ? 'Processing...' : 'Bulk Acknowledge'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grievance Table / List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200/50" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Inbox Clean</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No active grievances match the selected filter criteria.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="hover:text-slate-600 dark:hover:text-slate-200 font-semibold inline-flex items-center gap-1.5"
              >
                {selectedIds.length === filteredItems.length ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4" />}
                <span>Select All ({filteredItems.length})</span>
              </button>
              <span>Sorted by SLA Deadline</span>
            </div>

            {filteredItems.map((item) => {
              const sla = getSlaInfo(item.slaDueAt);
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => (window.location.href = `/admin/grievances/${item.id}`)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500/80'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      type="button"
                      onClick={(e) => toggleSelect(item.id, e)}
                      className="p-1 text-slate-400 hover:text-teal-600 transition-colors mt-0.5"
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                          {item.publicId}
                        </span>
                        <Badge variant="neutral" className="text-[10px]">
                          {item.categoryName}
                        </Badge>
                        <Badge
                          className={`text-[10px] ${
                            item.priority === 'EMERGENCY'
                              ? 'bg-rose-600 text-white'
                              : item.priority === 'URGENT'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.priority}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {item.status}
                        </Badge>
                        {item.isAnonymous ? (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold inline-flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Anonymous Resident
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            👤 {item.submitter?.fullName || 'Resident'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors line-clamp-1">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>Level {item.currentLevel}</span>
                        {item.areaText && <span>📍 {item.areaText}</span>}
                        {item.assignedToName && <span>Assigned: {item.assignedToName}</span>}
                      </div>
                    </div>
                  </div>

                  {/* SLA Badge & Action Arrow */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    <div
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
                        sla.isBreached
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : sla.isCritical
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sla.text}</span>
                    </div>

                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Review <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

export default function AdminInboxPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading...</div>}>
      <AdminInboxContent />
    </React.Suspense>
  );
}
