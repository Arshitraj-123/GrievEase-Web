'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  Layers,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  MapPin,
  Calendar,
  ChevronRight,
  ArrowRightLeft,
  Eye,
} from 'lucide-react';

function AdminVendorTasksContent() {
  const searchParams = useSearchParams();
  const initialVendorId = searchParams.get('vendorId') || undefined;

  const [tasks, setTasks] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vendorFilter, setVendorFilter] = useState(initialVendorId || 'ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState<any | null>(null);
  const [reassignVendorId, setReassignVendorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVendorId, setNewVendorId] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newArea, setNewArea] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, vList] = await Promise.all([
        api.listVendorTasksAdmin({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          vendorId: vendorFilter !== 'ALL' ? vendorFilter : undefined,
        }),
        api.listVendors(),
      ]);
      setTasks(Array.isArray(tList) ? tList : []);
      setVendors(Array.isArray(vList) ? vList : []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, vendorFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorId) {
      alert('Please select an assigned vendor.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createVendorTaskAdmin({
        title: newTitle,
        description: newDesc,
        vendorId: newVendorId,
        priority: newPriority,
        areaText: newArea,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewArea('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReassignModal || !reassignVendorId) return;
    setSubmitting(true);
    try {
      await api.reassignVendorTaskAdmin(showReassignModal.id, {
        vendorId: reassignVendorId,
        reason: reassignReason || undefined,
      });
      setShowReassignModal(null);
      setReassignReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-teal-600" />
              <span>Vendor Work Orders &amp; Maintenance Tasks</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track delegated technician orders, gate passes, photos, and resident confirmations.
            </p>
          </div>
          <Button
            size="sm"
            className="text-xs bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Create Standalone Task</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border bg-transparent"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="VISIT_SCHEDULED">VISIT SCHEDULED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RESIDENT_CONFIRMED">RESIDENT CONFIRMED</option>
              <option value="DECLINED">DECLINED</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Vendor:</span>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border bg-transparent"
            >
              <option value="ALL">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.company_name} ({v.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading work orders...</div>
        ) : tasks.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching tasks found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Assign tasks from resident grievances or create standalone society maintenance orders.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:border-teal-400 transition-colors shadow-xs">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={task.priority === 'EMERGENCY' ? 'danger' : 'default'}
                        className="text-[10px]"
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {task.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        Assigned {new Date(task.assigned_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {task.company_name || 'Assigned Vendor'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {task.flat_number
                            ? `Flat ${task.flat_number}${task.wing ? `, Wing ${task.wing}` : ''}`
                            : task.area_text || 'Common Area'}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center gap-1"
                      onClick={() => {
                        setShowReassignModal(task);
                        setReassignVendorId(task.vendor_id);
                      }}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Reassign</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Standalone Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>Create Standalone Task</span>
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Lift #2 B-Wing Periodic Motor Greasing"
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Select Vendor *</label>
                  <select
                    required
                    value={newVendorId}
                    onChange={(e) => setNewVendorId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.company_name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="EMERGENCY">EMERGENCY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Area / Location</label>
                    <input
                      type="text"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      placeholder="e.g. Clubhouse Pump Room"
                      className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Description &amp; Instructions *</label>
                  <textarea
                    required
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide clear technical instructions for the contractor..."
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-xs"
                    disabled={submitting}
                  >
                    Create &amp; Assign
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reassign Modal */}
        {showReassignModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                  <span>Reassign Task</span>
                </h3>
                <button
                  onClick={() => setShowReassignModal(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReassign} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">New Contractor *</label>
                  <select
                    required
                    value={reassignVendorId}
                    onChange={(e) => setReassignVendorId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.company_name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Reason for Reassignment</label>
                  <input
                    type="text"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="e.g. Previous vendor unavailable or declined"
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReassignModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-xs"
                    disabled={submitting}
                  >
                    Confirm Reassignment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

export default function AdminVendorTasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading vendor tasks...</div>}>
      <AdminVendorTasksContent />
    </Suspense>
  );
}
