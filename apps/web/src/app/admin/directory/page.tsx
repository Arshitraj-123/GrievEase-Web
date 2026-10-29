'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { fallbackServiceProviders } from '@/lib/fallback-community';
import { ServiceProviderDto } from '@grievease/contracts';
import {
  BookUser,
  Users,
  Shield,
  Star,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Building,
} from 'lucide-react';

export default function AdminDirectoryPage() {
  const [providers, setProviders] = useState<ServiceProviderDto[]>(fallbackServiceProviders);
  const [stats, setStats] = useState({
    totalResidents: 240,
    optedInResidents: 96,
    optInPercentage: 40,
    hiddenCount: 144,
  });

  // Office Bearers
  const [officeBearers, setOfficeBearers] = useState([
    { id: 'ob-1', name: 'Rajesh Sharma', title: 'President / Chairman', displayOrder: 1, isPublic: true },
    { id: 'ob-2', name: 'Dr. Amitav Banerjee', title: 'Secretary', displayOrder: 2, isPublic: true },
    { id: 'ob-3', name: 'Priya Iyer', title: 'Treasurer', displayOrder: 3, isPublic: true },
    { id: 'ob-4', name: 'Vikram Joshi', title: 'Joint Secretary', displayOrder: 4, isPublic: true },
  ]);

  // Provider Modal
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [providerCategory, setProviderCategory] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerArea, setProviderArea] = useState('');
  const [providerNotes, setProviderNotes] = useState('');

  // Office bearer modal
  const [showAddBearer, setShowAddBearer] = useState(false);
  const [bearerName, setBearerName] = useState('');
  const [bearerTitle, setBearerTitle] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, provsRes] = await Promise.all([
          api.getAdminDirectoryOverview(),
          api.getServiceProviders(),
        ]);
        if (overviewRes && overviewRes.totalResidents) {
          setStats(overviewRes);
        }
        if (Array.isArray(provsRes) && provsRes.length > 0) {
          setProviders(provsRes);
        }
      } catch {}
    }
    loadData();
  }, []);

  const handleToggleApproval = async (id: string, current: boolean) => {
    try {
      await api.toggleProviderApproval(id, !current);
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isApproved: !current } : p))
      );
    } catch {
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isApproved: !current } : p))
      );
    }
  };

  const handleAddProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim() || !providerPhone.trim()) return;

    try {
      const payload = {
        name: providerName,
        category: providerCategory || 'General Service',
        phone: providerPhone,
        area: providerArea || 'All Towers',
        notes: providerNotes || undefined,
      };
      const res = await api.createServiceProvider(payload);
      if (res && res.id) {
        setProviders([...providers, res]);
      } else {
        const dummy: ServiceProviderDto = {
          id: `sp-${Date.now()}`,
          name: providerName,
          category: providerCategory,
          phone: providerPhone,
          area: providerArea,
          notes: providerNotes,
          isApproved: true,
          avgStars: null,
          reviewCount: 0,
        };
        setProviders([...providers, dummy]);
      }
      setShowAddProvider(false);
    } catch {
      setShowAddProvider(false);
    }
  };

  const handleAddBearerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bearerName.trim() || !bearerTitle.trim()) return;
    setOfficeBearers([
      ...officeBearers,
      {
        id: `ob-${Date.now()}`,
        name: bearerName,
        title: bearerTitle,
        displayOrder: officeBearers.length + 1,
        isPublic: true,
      },
    ]);
    setBearerName('');
    setBearerTitle('');
    setShowAddBearer(false);
  };

  return (
    <ShellLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                Phase 5 • Directory & Service Governance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Directory & Approved Services
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor opt-in privacy compliance, manage committee office bearers, and curate approved society vendors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/emergency-contacts"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
            >
              Emergency Contacts
            </Link>
          </div>
        </div>

        {/* Strict Privacy Shield */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs text-slate-600 flex items-start gap-3">
          <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Privacy-First Architecture: </span>
            Residents are strictly invisible by default (<code className="font-mono text-teal-700">visible = false</code>). To prevent surveillance and enumeration, search requires at least 3 characters and is rate limited (30 queries/10 min). Bulk directory dumps for residents are technically blocked. Admins see counts only, never unmasked bulk dumps.
          </div>
        </div>

        {/* Directory Opt-in Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Total Society Residents</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">{stats.totalResidents}</span>
              <span className="text-xs text-slate-400">members</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Opted-in to Directory</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-teal-700">{stats.optedInResidents}</span>
              <span className="text-xs text-slate-400">({stats.optInPercentage}%)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Hidden / Private Default</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-indigo-600">{stats.hiddenCount}</span>
              <span className="text-xs text-slate-400">residents</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Anti-Scraping Rate Limit</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">30 / 10m</span>
              <span className="text-xs text-slate-400">per user</span>
            </div>
          </div>
        </div>

        {/* Office Bearers Management */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Managing Committee & Office Bearers</h2>
              <p className="text-xs text-slate-500">
                Official society representatives displayed to residents with administrative titles.
              </p>
            </div>
            <button
              onClick={() => setShowAddBearer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bearer</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {officeBearers.map((ob) => (
              <div key={ob.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">{ob.name}</span>
                  <div className="text-xs text-teal-700 font-medium mt-0.5">{ob.title}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Public to Residents
                  </span>
                  <button
                    onClick={() => setOfficeBearers(officeBearers.filter((b) => b.id !== ob.id))}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approved Service Providers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Service Providers & Vendors</h2>
              <p className="text-xs text-slate-500">
                Society-vetted plumbers, electricians, deep-cleaners. Aggregate ratings shown only when N &gt;= 3 reviews.
              </p>
            </div>
            <button
              onClick={() => setShowAddProvider(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Provider</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {providers.map((p) => (
              <div
                key={p.id}
                className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {p.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        p.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.isApproved ? 'Approved' : 'Unapproved'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">{p.notes || 'No description provided.'}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="font-mono">{p.phone}</span>
                    <span>•</span>
                    <span>Coverage: {p.area || 'All Towers'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {p.reviewCount >= 3 ? `${p.avgStars?.toFixed(1)} (${p.reviewCount} reviews)` : `${p.reviewCount} reviews (Rating hidden until N>=3)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleToggleApproval(p.id, p.isApproved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      p.isApproved
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {p.isApproved ? 'Suspend Approval' : 'Approve Provider'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Provider Modal */}
        {showAddProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Approved Provider</h3>
              <form onSubmit={handleAddProviderSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provider / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electrician, Carpenter, Pest Control"
                    value={providerCategory}
                    onChange={(e) => setProviderCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={providerPhone}
                    onChange={(e) => setProviderPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Wings Covered</label>
                  <input
                    type="text"
                    placeholder="e.g. All Towers or Tower A & B"
                    value={providerArea}
                    onChange={(e) => setProviderArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Specialization</label>
                  <textarea
                    rows={2}
                    value={providerNotes}
                    onChange={(e) => setProviderNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddProvider(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
                  >
                    Add Provider
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Bearer Modal */}
        {showAddBearer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Office Bearer</h3>
              <form onSubmit={handleAddBearerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Member Name *</label>
                  <input
                    type="text"
                    required
                    value={bearerName}
                    onChange={(e) => setBearerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Committee Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Secretary, Maintenance In-Charge"
                    value={bearerTitle}
                    onChange={(e) => setBearerTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBearer(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
                  >
                    Save Bearer
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
