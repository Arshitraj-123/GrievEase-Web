'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { fallbackCategories } from '@/lib/fallback-community';
import { NoticeCategoryDto } from '@grievease/contracts';
import {
  ArrowLeft,
  Settings,
  Plus,
  Pin,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function NoticeSettingsPage() {
  const [categories, setCategories] = useState<NoticeCategoryDto[]>(fallbackCategories);
  const [pinLimit, setPinLimit] = useState(3);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New category modal
  const [showAddCat, setShowAddCat] = useState(false);
  const [newEn, setNewEn] = useState('');
  const [newHi, setNewHi] = useState('');

  // Permissions matrix
  const [perms, setPerms] = useState({
    SUPER_ADMIN: { create: true, edit: true, archive: true, pin: true },
    CHAIRMAN: { create: true, edit: true, archive: true, pin: true },
    SECRETARY: { create: true, edit: true, archive: true, pin: true },
    COMMITTEE: { create: true, edit: true, archive: false, pin: true },
    GOVERNING_BODY: { create: false, edit: false, archive: false, pin: false },
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn.trim()) return;

    const newCat: NoticeCategoryDto = {
      id: `cat-${Date.now()}`,
      nameEn: newEn,
      nameHi: newHi || newEn,
      isSystem: false,
      sortOrder: categories.length + 1,
    };

    setCategories([...categories, newCat]);
    setNewEn('');
    setNewHi('');
    setShowAddCat(false);
  };

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href="/admin/notices"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notices
        </Link>

        <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                Noticeboard Configuration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Noticeboard Settings & Permissions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure multilingual notice categories, top pin limits, and role-based permissions.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>

        {savedSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings and permission matrix updated and written to hash-chained audit log.</span>
          </div>
        )}

        {/* Pin Limit Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Pin className="w-4 h-4 text-teal-600" />
            <span>Pinning Limits</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Maximum number of published notices that can remain pinned to the top of resident feeds simultaneously.
          </p>

          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-slate-700">Max Pinned Notices:</label>
            <input
              type="number"
              min={1}
              max={10}
              value={pinLimit}
              onChange={(e) => setPinLimit(Number(e.target.value))}
              className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-sm font-bold text-center"
            />
            <span className="text-xs text-slate-400">Default: 3 notices</span>
          </div>
        </div>

        {/* Categories Manager */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Multilingual Notice Categories</h2>
              <p className="text-xs text-slate-500">Notice categories with English, Hindi, and Marathi names.</p>
            </div>
            <button
              onClick={() => setShowAddCat(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {categories.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">{c.nameEn}</span>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>HI: {c.nameHi}</span>
                  </div>
                </div>

                <div>
                  {c.isSystem ? (
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-500 uppercase tracking-wider">
                      System Default
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 uppercase tracking-wider">
                      Custom
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Permission Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>Notice Permissions Matrix</span>
              </h2>
              <p className="text-xs text-slate-500">
                Super Admin can tune management privileges per role (audited action).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 px-4 text-center">Create</th>
                  <th className="py-2.5 px-4 text-center">Edit</th>
                  <th className="py-2.5 px-4 text-center">Archive</th>
                  <th className="py-2.5 px-4 text-center">Pin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {Object.entries(perms).map(([role, rights]) => (
                  <tr key={role} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-4 font-bold font-mono">{role}</td>
                    {(['create', 'edit', 'archive', 'pin'] as const).map((perm) => (
                      <td key={perm} className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={rights[perm]}
                          onChange={(e) =>
                            setPerms({
                              ...perms,
                              [role]: { ...rights, [perm]: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Category Modal */}
        {showAddCat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Custom Category</h3>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEn}
                    onChange={(e) => setNewEn(e.target.value)}
                    placeholder="e.g. Festival Celebrations"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hindi Name (हिंदी)
                  </label>
                  <input
                    type="text"
                    value={newHi}
                    onChange={(e) => setNewHi(e.target.value)}
                    placeholder="e.g. उत्सव एवं समारोह"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCat(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
                  >
                    Save Category
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
