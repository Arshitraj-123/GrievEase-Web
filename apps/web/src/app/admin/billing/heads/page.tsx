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
  Plus,
  Edit2,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export default function AdminBillHeadsPage() {
  const [heads, setHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHead, setEditingHead] = useState<any | null>(null);

  // Form
  const [langTab, setLangTab] = useState<'en' | 'hi' | 'mr'>('en');
  const [formData, setFormData] = useState({
    name_en: '',
    name_hi: '',
    name_mr: '',
    calc_method: 'FIXED_PER_FLAT',
    rate_rupees: '0',
    tax_percent: 0,
    active: true,
    sort: 1,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadHeads = async () => {
    setLoading(true);
    try {
      const data = await api.listBillHeads();
      if (Array.isArray(data)) setHeads(data);
    } catch (err: any) {
      console.warn('Failed to load bill heads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeads();
  }, []);

  const openCreateModal = () => {
    setEditingHead(null);
    setFormData({
      name_en: '',
      name_hi: '',
      name_mr: '',
      calc_method: 'FIXED_PER_FLAT',
      rate_rupees: '1500',
      tax_percent: 0,
      active: true,
      sort: heads.length + 1,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (h: any) => {
    setEditingHead(h);
    setFormData({
      name_en: h.name_en || h.name || '',
      name_hi: h.name_hi || '',
      name_mr: h.name_mr || '',
      calc_method: h.calc_method || 'FIXED_PER_FLAT',
      rate_rupees: String((h.rate_paise || 0) / 100),
      tax_percent: Number(h.tax_percent || 0),
      active: h.active !== false,
      sort: h.sort || 1,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      name_en: formData.name_en,
      name_hi: formData.name_hi || undefined,
      name_mr: formData.name_mr || undefined,
      calc_method: formData.calc_method,
      rate_paise: Math.round(Number(formData.rate_rupees || 0) * 100),
      tax_percent: Number(formData.tax_percent || 0),
      active: Boolean(formData.active),
      sort: Number(formData.sort),
    };

    try {
      if (editingHead) {
        await api.updateBillHead(editingHead.id, payload);
        setSuccessMsg('Bill head updated successfully!');
      } else {
        await api.createBillHead(payload);
        setSuccessMsg('Bill head created successfully!');
      }
      setShowModal(false);
      loadHeads();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save bill head.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Receipt className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Maintenance Bill Heads</h1>
                <p className="text-sm text-slate-500">
                  Configure calculation methods, rates, and tax heads for monthly maintenance bills.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/billing"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Overview
            </Link>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Bill Head
            </button>
          </div>
        </div>

        {/* GST Advisory Alert */}
        <div className="p-4 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">GST Applicability Advisory</p>
            <p className="text-blue-800">
              Confirm GST applicability with your chartered accountant before setting tax percentages. GrievEase generates
              receipts labelled "Receipt" (not "Tax invoice") and does not claim tax compliance.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {errorMsg}
          </div>
        )}

        {/* Heads List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="font-medium">Loading bill heads...</p>
          </div>
        ) : heads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No bill heads defined</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Add Bill Head" to set up base maintenance, sinking fund, water charges, or parking charges.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Sort</th>
                  <th className="px-5 py-3.5">Bill Head Name</th>
                  <th className="px-5 py-3.5">Calculation Method</th>
                  <th className="px-5 py-3.5">Rate / Amount</th>
                  <th className="px-5 py-3.5">Tax (%)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heads.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-400">{h.sort}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 block text-sm">
                        {h.name_en || h.name}
                      </span>
                      {h.name_hi && (
                        <span className="text-[11px] text-slate-400 mr-2">HI: {h.name_hi}</span>
                      )}
                      {h.name_mr && (
                        <span className="text-[11px] text-slate-400">MR: {h.name_mr}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {h.calc_method}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {h.calc_method === 'PER_SQFT'
                        ? `${formatPaise(h.rate_paise)} / sqft`
                        : h.calc_method === 'PER_PARKING_SLOT'
                        ? `${formatPaise(h.rate_paise)} / slot`
                        : formatPaise(h.rate_paise)}
                    </td>
                    <td className="px-5 py-4">
                      {Number(h.tax_percent) > 0 ? (
                        <Badge variant="outline" className="text-amber-700 bg-amber-50">
                          {h.tax_percent}%
                        </Badge>
                      ) : (
                        <span className="text-slate-400">0%</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={h.active ? 'default' : 'neutral'} className="text-[10px]">
                        {h.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(h)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 text-xs ml-auto transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Create / Edit Bill Head */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingHead ? 'Edit Bill Head' : 'Add Bill Head'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set calculation rules, rates, and multilingual descriptions.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Language Switch Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  {(['en', 'hi', 'mr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLangTab(lang)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        langTab === lang
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'Hindi (HI)' : 'Marathi (MR)'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Head Name ({langTab.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    required={langTab === 'en'}
                    value={(formData as any)[`name_${langTab}`] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [`name_${langTab}`]: e.target.value })
                    }
                    placeholder="e.g. Society Maintenance Charges"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Calculation Method
                    </label>
                    <select
                      value={formData.calc_method}
                      onChange={(e) => setFormData({ ...formData, calc_method: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    >
                      <option value="FIXED_PER_FLAT">FIXED (Per Flat)</option>
                      <option value="PER_SQFT">PER_SQFT (Multiplied by Area)</option>
                      <option value="BY_FLAT_TYPE">BY_FLAT_TYPE (1BHK/2BHK/3BHK)</option>
                      <option value="PER_PARKING_SLOT">PER_PARKING_SLOT</option>
                      <option value="MANUAL">MANUAL (Set per flat)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rate / Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      required
                      value={formData.rate_rupees}
                      onChange={(e) => setFormData({ ...formData, rate_rupees: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax / GST (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={28}
                      value={formData.tax_percent}
                      onChange={(e) => setFormData({ ...formData, tax_percent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Sort Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.sort}
                      onChange={(e) => setFormData({ ...formData, sort: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Active (Include in future bill generation cycles)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                  >
                    {saving ? 'Saving...' : editingHead ? 'Update Bill Head' : 'Create Bill Head'}
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
