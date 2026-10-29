'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
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
  AlertOctagon,
  Plus,
  ShieldAlert,
  Clock,
  Camera,
  CheckCircle2,
} from 'lucide-react';

export default function GuardIncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [type, setType] = useState('suspicious_vehicle');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const data = await api.listGuardIncidents();
      setIncidents(data || []);
    } catch {
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setIsSubmitting(true);

    try {
      await api.logGuardIncident({
        type,
        severity,
        description: description.trim(),
      });
      setIsModalOpen(false);
      setDescription('');
      loadIncidents();
    } catch {}
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <a
              href="/guard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gate Console</span>
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-7 h-7 text-amber-500" />
              <span>Incident &amp; Security Log</span>
            </h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[48px] px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Report Security Observation / Incident
              </h2>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Incident Category *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                  >
                    <option value="suspicious_person">Suspicious Person Loitering</option>
                    <option value="suspicious_vehicle">Unregistered Vehicle / Parking Block</option>
                    <option value="fire_hazard">Fire / Smoke / Gas Hazard</option>
                    <option value="fight">Physical Altercation / Noise</option>
                    <option value="damage">Property Damage</option>
                    <option value="medical">Medical Assistance Required</option>
                    <option value="other">Other Security Observation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Severity Level *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverity(lvl)}
                        className={`min-h-[44px] rounded-xl text-xs font-bold border transition-all ${
                          severity === lvl
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description &amp; Observations *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what occurred, license plate numbers, or persons involved..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
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
                    className="min-h-[44px] px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md"
                  >
                    {isSubmitting ? 'Logging...' : 'Submit Incident Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Incidents List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <Card className="text-center py-12 p-6">
            <CardDescription>No incidents logged in the past 24 hours.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc) => (
              <Card key={inc.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                      {inc.type?.replace('_', ' ')}
                    </span>
                    <Badge variant={inc.severity === 'CRITICAL' ? 'danger' : 'warning'} className="text-[10px]">
                      {inc.severity}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(inc.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {inc.description}
                </p>
                <div className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  Status: <strong>{inc.status || 'OPEN'}</strong>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
