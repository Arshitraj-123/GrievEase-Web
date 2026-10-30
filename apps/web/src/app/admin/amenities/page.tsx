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
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Ban,
  Settings,
  RefreshCw,
  Search,
  DollarSign,
  Users,
} from 'lucide-react';

export default function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<any | null>(null);
  const [showBlackoutModal, setShowBlackoutModal] = useState(false);
  const [selectedForBlackout, setSelectedForBlackout] = useState<any | null>(null);

  // Form states
  const [langTab, setLangTab] = useState<'en' | 'hi' | 'mr'>('en');
  const [formData, setFormData] = useState<any>({
    type: 'CLUBHOUSE',
    name_en: '',
    name_hi: '',
    name_mr: '',
    description_en: '',
    description_hi: '',
    description_mr: '',
    rules_text_en: '',
    rules_text_hi: '',
    rules_text_mr: '',
    mode: 'EXCLUSIVE',
    capacity_total: 1,
    slot_minutes: 60,
    min_slots: 1,
    max_slots: 4,
    advance_days_max: 30,
    min_notice_hours: 2,
    max_bookings_per_flat_per_week: 2,
    max_guests: 10,
    fee_mode: 'NONE',
    fee_rupees: '0',
    deposit_rupees: '0',
    fee_collection: 'COLLECT_BEFORE_CONFIRM',
    requires_approval: false,
    cancellation_free_hours: 24,
    cancellation_fee_percent: 10,
    active: true,
  });

  // Blackout form state
  const [blackoutData, setBlackoutData] = useState({
    from: '',
    to: '',
    reason: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadAmenities = async () => {
    setLoading(true);
    try {
      const data = await api.getAmenities();
      if (Array.isArray(data)) setAmenities(data);
    } catch (err: any) {
      console.warn('Failed to load amenities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAmenities();
  }, []);

  const openCreateModal = () => {
    setEditingAmenity(null);
    setFormData({
      type: 'CLUBHOUSE',
      name_en: '',
      name_hi: '',
      name_mr: '',
      description_en: '',
      description_hi: '',
      description_mr: '',
      rules_text_en: '',
      rules_text_hi: '',
      rules_text_mr: '',
      mode: 'EXCLUSIVE',
      capacity_total: 1,
      slot_minutes: 60,
      min_slots: 1,
      max_slots: 4,
      advance_days_max: 30,
      min_notice_hours: 2,
      max_bookings_per_flat_per_week: 2,
      max_guests: 10,
      fee_mode: 'NONE',
      fee_rupees: '0',
      deposit_rupees: '0',
      fee_collection: 'COLLECT_BEFORE_CONFIRM',
      requires_approval: false,
      cancellation_free_hours: 24,
      cancellation_fee_percent: 10,
      active: true,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (a: any) => {
    setEditingAmenity(a);
    setFormData({
      type: a.type || 'CLUBHOUSE',
      name_en: a.name_en || a.name || '',
      name_hi: a.name_hi || '',
      name_mr: a.name_mr || '',
      description_en: a.description_en || a.description || '',
      description_hi: a.description_hi || '',
      description_mr: a.description_mr || '',
      rules_text_en: a.rules_text_en || a.rules_text || '',
      rules_text_hi: a.rules_text_hi || '',
      rules_text_mr: a.rules_text_mr || '',
      mode: a.mode || 'EXCLUSIVE',
      capacity_total: a.capacity_total || 1,
      slot_minutes: a.slot_minutes || 60,
      min_slots: a.min_slots || 1,
      max_slots: a.max_slots || 4,
      advance_days_max: a.advance_days_max || 30,
      min_notice_hours: a.min_notice_hours || 2,
      max_bookings_per_flat_per_week: a.max_bookings_per_flat_per_week || 2,
      max_guests: a.max_guests || 10,
      fee_mode: a.fee_mode || 'NONE',
      fee_rupees: String((a.fee_paise || 0) / 100),
      deposit_rupees: String((a.deposit_paise || 0) / 100),
      fee_collection: a.fee_collection || 'COLLECT_BEFORE_CONFIRM',
      requires_approval: Boolean(a.requires_approval),
      cancellation_free_hours: a.cancellation_free_hours || 24,
      cancellation_fee_percent: a.cancellation_fee_percent || 10,
      active: a.active !== false,
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSaveAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      type: formData.type,
      name_en: formData.name_en,
      name_hi: formData.name_hi || undefined,
      name_mr: formData.name_mr || undefined,
      description_en: formData.description_en || undefined,
      description_hi: formData.description_hi || undefined,
      description_mr: formData.description_mr || undefined,
      rules_text_en: formData.rules_text_en || undefined,
      rules_text_hi: formData.rules_text_hi || undefined,
      rules_text_mr: formData.rules_text_mr || undefined,
      mode: formData.mode,
      capacity_total: Number(formData.capacity_total),
      slot_minutes: Number(formData.slot_minutes),
      min_slots: Number(formData.min_slots),
      max_slots: Number(formData.max_slots),
      advance_days_max: Number(formData.advance_days_max),
      min_notice_hours: Number(formData.min_notice_hours),
      max_bookings_per_flat_per_week: Number(formData.max_bookings_per_flat_per_week),
      max_guests: Number(formData.max_guests),
      fee_mode: formData.fee_mode,
      fee_paise: Math.round(Number(formData.fee_rupees || 0) * 100),
      deposit_paise: Math.round(Number(formData.deposit_rupees || 0) * 100),
      fee_collection: formData.fee_collection,
      requires_approval: Boolean(formData.requires_approval),
      cancellation_free_hours: Number(formData.cancellation_free_hours),
      cancellation_fee_percent: Number(formData.cancellation_fee_percent),
      active: Boolean(formData.active),
    };

    try {
      if (editingAmenity) {
        await api.updateAdminAmenity(editingAmenity.id, payload);
        setSuccessMsg('Amenity updated successfully!');
      } else {
        await api.createAdminAmenity(payload);
        setSuccessMsg('Amenity created successfully!');
      }
      setShowModal(false);
      loadAmenities();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save amenity.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForBlackout) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.addAmenityBlackout(selectedForBlackout.id, {
        from: new Date(blackoutData.from).toISOString(),
        to: new Date(blackoutData.to).toISOString(),
        reason: blackoutData.reason,
      });
      setSuccessMsg('Maintenance blackout period added.');
      setShowBlackoutModal(false);
      setBlackoutData({ from: '', to: '', reason: '' });
      loadAmenities();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add blackout period.');
    } finally {
      setSaving(false);
    }
  };

  const filteredAmenities = amenities.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.name_en && a.name_en.toLowerCase().includes(q)) ||
      (a.type && a.type.toLowerCase().includes(q))
    );
  });

  return (
    <ShellLayout activeNav="admin-amenities">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Amenities Management</h1>
                <p className="text-sm text-slate-500">
                  Configure society facilities, slot rules, fees, maintenance schedules & multi-lingual details.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/amenities/reports"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
            >
              Reports & Utilisation
            </Link>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-semibold text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Facility
            </button>
          </div>
        </div>

        {/* Success / Error alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            {errorMsg}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search amenities by name, type..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
          <button
            onClick={loadAmenities}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Amenities List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
            <p className="font-medium">Loading society amenities...</p>
          </div>
        ) : filteredAmenities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No amenities configured yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Add Facility" above to set up clubhouse, swimming pool, gymnasium, or sports courts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAmenities.map((a) => (
              <Card
                key={a.id}
                className={`border shadow-sm transition hover:shadow-md ${
                  a.active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {a.type}
                    </span>
                    <Badge variant={a.active ? 'default' : 'neutral'} className="text-xs">
                      {a.active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                    {a.name_en || a.name}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {a.description_en || a.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Mode</span>
                      <span className="font-semibold text-slate-800">{a.mode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Capacity</span>
                      <span className="font-semibold text-slate-800">
                        {a.mode === 'EXCLUSIVE' ? '1 Booking' : `${a.capacity_total} People`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Slot Duration</span>
                      <span className="font-semibold text-slate-800">{a.slot_minutes} mins</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Fee</span>
                      <span className="font-semibold text-slate-800">
                        {a.fee_mode === 'NONE'
                          ? 'FREE'
                          : `${formatPaise(a.fee_paise || 0)} / ${a.fee_mode.toLowerCase()}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(a)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedForBlackout(a);
                        setShowBlackoutModal(true);
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition"
                      title="Add Maintenance Blackout"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Maintenance
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Create / Edit Amenity */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingAmenity ? 'Edit Facility' : 'Create New Facility'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fill in details, capacity rules, and pricing structure.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveAmenity} className="space-y-4">
                {/* Language Switch Tabs */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                  {(['en', 'hi', 'mr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLangTab(lang)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                        langTab === lang
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'Hindi (HI)' : 'Marathi (MR)'}
                    </button>
                  ))}
                </div>

                {/* Multilingual Name & Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility Name ({langTab.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    required={langTab === 'en'}
                    value={formData[`name_${langTab}`] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [`name_${langTab}`]: e.target.value })
                    }
                    placeholder="e.g. Clubhouse Banquet Hall"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description ({langTab.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    value={formData[`description_${langTab}`] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [`description_${langTab}`]: e.target.value })
                    }
                    placeholder="Brief description of the facility and its perks..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rules & Guidelines ({langTab.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    value={formData[`rules_text_${langTab}`] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [`rules_text_${langTab}`]: e.target.value })
                    }
                    placeholder="Operating rules, attire requirements, cancellation policies..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Type & Booking Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="CLUBHOUSE">Clubhouse</option>
                      <option value="GYM">Gymnasium</option>
                      <option value="POOL">Swimming Pool</option>
                      <option value="HALL">Banquet / Community Hall</option>
                      <option value="COURT">Sports Court (Tennis/Badminton)</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Booking Mode
                    </label>
                    <select
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="EXCLUSIVE">EXCLUSIVE (1 flat reserves whole amenity)</option>
                      <option value="CAPACITY">CAPACITY (Up to N people concurrently)</option>
                    </select>
                  </div>
                </div>

                {/* Capacity & Slot configurations */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.capacity_total}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity_total: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Slot (mins)
                    </label>
                    <input
                      type="number"
                      min={15}
                      step={15}
                      value={formData.slot_minutes}
                      onChange={(e) => setFormData({ ...formData, slot_minutes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min Slots
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.min_slots}
                      onChange={(e) => setFormData({ ...formData, min_slots: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Slots
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.max_slots}
                      onChange={(e) => setFormData({ ...formData, max_slots: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Fees & Deposit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fee Mode
                    </label>
                    <select
                      value={formData.fee_mode}
                      onChange={(e) => setFormData({ ...formData, fee_mode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    >
                      <option value="NONE">Free (No Fee)</option>
                      <option value="PER_SLOT">Per Slot</option>
                      <option value="PER_BOOKING">Per Booking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fee Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.fee_rupees}
                      onChange={(e) => setFormData({ ...formData, fee_rupees: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.deposit_rupees}
                      onChange={(e) => setFormData({ ...formData, deposit_rupees: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Collection & Approval */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Collection Mode
                    </label>
                    <select
                      value={formData.fee_collection}
                      onChange={(e) =>
                        setFormData({ ...formData, fee_collection: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                    >
                      <option value="COLLECT_BEFORE_CONFIRM">
                        Collect Cash at Office Before Confirming
                      </option>
                      <option value="ADD_TO_NEXT_BILL">Debit to Flat Next Maintenance Bill</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="requires_approval"
                      checked={formData.requires_approval}
                      onChange={(e) =>
                        setFormData({ ...formData, requires_approval: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label
                      htmlFor="requires_approval"
                      className="text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Requires Admin Approval before confirmation
                    </label>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    {saving ? 'Saving...' : editingAmenity ? 'Update Amenity' : 'Create Amenity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Maintenance Blackout */}
        {showBlackoutModal && selectedForBlackout && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900">Schedule Maintenance Blackout</h3>
                  <p className="text-xs text-slate-500">{selectedForBlackout.name_en || selectedForBlackout.name}</p>
                </div>
                <button
                  onClick={() => setShowBlackoutModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBlackout} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={blackoutData.from}
                    onChange={(e) => setBlackoutData({ ...blackoutData, from: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={blackoutData.to}
                    onChange={(e) => setBlackoutData({ ...blackoutData, to: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maintenance Reason *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={blackoutData.reason}
                    onChange={(e) => setBlackoutData({ ...blackoutData, reason: e.target.value })}
                    placeholder="e.g. Annual pool filtration cleaning, clubhouse painting..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBlackoutModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                  >
                    {saving ? 'Saving...' : 'Add Blackout'}
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
