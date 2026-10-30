'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  Truck,
  Plus,
  Phone,
  Tag,
  Eye,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'PLUMBING',
  'ELECTRICAL',
  'LIFT',
  'PEST_CONTROL',
  'PAINTING',
  'HOUSEKEEPING',
  'CARPENTRY',
  'OTHER',
];

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Vendor Form
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [vendorCategory, setVendorCategory] = useState('PLUMBING');
  const [notes, setNotes] = useState('');

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await api.listVendors({
        category: category !== 'ALL' ? category : undefined,
      });
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load vendors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [category]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createVendor({
        companyName,
        contactPerson,
        phone,
        category: vendorCategory,
        notes,
      });
      setShowAddModal(false);
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setNotes('');
      await loadVendors();
    } catch (err: any) {
      alert(err.message || 'Failed to register vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.company_name?.toLowerCase().includes(q) ||
      v.contact_person?.toLowerCase().includes(q) ||
      v.category?.toLowerCase().includes(q)
    );
  });

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-6 h-6 text-teal-600" />
              <span>Vendor Directory &amp; Contractors</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage authorized maintenance partners, performance scorecards, and task allocations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/vendor-tasks">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>All Tasks</span>
              </Button>
            </Link>
            <Button
              size="sm"
              className="text-xs bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, person or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-white dark:bg-slate-900 border text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vendor Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading vendor directory...</div>
        ) : filteredVendors.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No vendors found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add maintenance partners to assign tasks and automatically issue visitor passes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="hover:border-teal-400 transition-colors shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold truncate">
                        {vendor.company_name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {vendor.contact_person}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={vendor.status === 'ACTIVE' ? 'success' : 'danger'}
                      className="text-[10px]"
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-500">Trade:</span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {vendor.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vendor.phone || 'Protected / Encrypted'}</span>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between gap-2">
                    <Link href={`/admin/vendors/${vendor.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="text-xs w-full flex items-center justify-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Performance</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Vendor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>Register New Vendor</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Trade Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Electrical Services"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number * (AES-256 Encrypted)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Trade *
                  </label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scope / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Terms, hourly rate notes, or scope..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-xs"
                    disabled={submitting}
                  >
                    Register Vendor
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
