'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import { ArrowLeft, PlusCircle, CheckCircle2, Trash2, Edit2, Layers } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function CategoriesSettingsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameEn, setNameEn] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [nameMr, setNameMr] = useState('');
  const [icon, setIcon] = useState('water-supply');
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameHi.trim() || !nameMr.trim()) return;

    setSaving(true);
    try {
      await api.createCategory({
        name_en: nameEn.trim(),
        name_hi: nameHi.trim(),
        name_mr: nameMr.trim(),
        icon,
        requires_photo: requiresPhoto,
        sort: categories.length + 1,
      });
      setNameEn('');
      setNameHi('');
      setNameMr('');
      setShowAddForm(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Cannot delete category.');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Category Settings">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <Link
          href="/admin"
          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Grievance Categories
            </h1>
            <p className="text-xs text-slate-500">
              Manage multilingual category names (English, Hindi, Marathi) and photo requirements.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Category'}</span>
          </Button>
        </div>

        {/* Add Category Form */}
        {showAddForm && (
          <Card className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Create New Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">English Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garden Maintenance"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Hindi Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. बगीचा रखरखाव"
                    value={nameHi}
                    onChange={(e) => setNameHi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Marathi Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. बाग देखभाल"
                    value={nameMr}
                    onChange={(e) => setNameMr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresPhoto}
                    onChange={(e) => setRequiresPhoto(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Requires Photo Evidence</span>
                </label>

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Categories List */}
        <div className="space-y-2.5">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {c.name_en}
                  </span>
                  {c.requires_photo && (
                    <Badge variant="outline" className="text-[10px]">Photo Required</Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>HI: {c.name_hi}</span>
                  <span>MR: {c.name_mr}</span>
                  <span>Icon: <code>{c.icon}</code></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteCategory(c.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}
