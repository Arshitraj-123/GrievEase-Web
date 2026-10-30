'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  FileText,
  HelpCircle,
  MessageSquare,
  Settings,
  Plus,
  Check,
  X,
  Trash2,
  Edit,
  Save,
  Globe,
  Star,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<'FAQ' | 'TESTIMONIALS' | 'SETTINGS'>('FAQ');
  const [loading, setLoading] = useState(true);

  // FAQ state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [faqQEn, setFaqQEn] = useState('');
  const [faqQHi, setFaqQHi] = useState('');
  const [faqAEn, setFaqAEn] = useState('');
  const [faqAHi, setFaqAHi] = useState('');
  const [faqCat, setFaqCat] = useState('GENERAL');
  const [faqPublished, setFaqPublished] = useState(true);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<any[]>([]);

  // Site settings state
  const [siteSettings, setSiteSettings] = useState<any[]>([]);
  const [selectedSettingKey, setSelectedSettingKey] = useState('announcement_banner');
  const [settingValEn, setSettingValEn] = useState('');
  const [settingValHi, setSettingValHi] = useState('');
  const [savingSetting, setSavingSetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, tData, sData] = await Promise.all([
        api.listAllFaqsAdmin(),
        api.listTestimonialsAdmin(),
        api.getPublicSiteSettings(),
      ]);
      setFaqs(Array.isArray(fData) ? fData : []);
      setTestimonials(Array.isArray(tData) ? tData : []);
      setSiteSettings(Array.isArray(sData) ? sData : []);
    } catch (err) {
      console.error('Failed to load CMS data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveFaqAdmin({
        id: editingFaq?.id,
        category: faqCat,
        questionEn: faqQEn,
        questionHi: faqQHi,
        answerEn: faqAEn,
        answerHi: faqAHi,
        published: faqPublished,
      });
      setEditingFaq(null);
      setFaqQEn('');
      setFaqQHi('');
      setFaqAEn('');
      setFaqAHi('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await api.deleteFaqAdmin(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const handleModerateTestimonial = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.moderateTestimonialAdmin(id, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate testimonial');
    }
  };

  const handleSaveSiteSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSetting(true);
    try {
      await api.updateSiteSettingAdmin(selectedSettingKey, {
        valueEn: settingValEn,
        valueHi: settingValHi,
      });
      alert('Site setting updated successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save setting');
    } finally {
      setSavingSetting(false);
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              <span>Self-Hosted CMS &amp; Content Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multilingual content, FAQs, moderated resident testimonials, and public announcement banners.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('FAQ')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'FAQ'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQs ({faqs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TESTIMONIALS')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'TESTIMONIALS'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Resident Testimonials ({testimonials.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'SETTINGS'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Site Content &amp; Announcements</span>
          </button>
        </div>

        {/* ─── TAB 1: FAQs ──────────────────────────────────────────────────────── */}
        {activeTab === 'FAQ' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FAQ List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Published &amp; Draft FAQs
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setEditingFaq({});
                    setFaqQEn('');
                    setFaqQHi('');
                    setFaqAEn('');
                    setFaqAHi('');
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New FAQ
                </Button>
              </div>

              {faqs.length === 0 ? (
                <Card className="py-8 text-center text-xs text-slate-500">
                  No FAQs created yet. Use the form to author questions in EN and HI.
                </Card>
              ) : (
                faqs.map((faq) => (
                  <Card key={faq.id} className="p-4 space-y-2 hover:border-teal-400 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {faq.category}
                          </Badge>
                          <Badge
                            variant={faq.published ? 'success' : 'neutral'}
                            className="text-[10px]"
                          >
                            {faq.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {faq.question_en}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {faq.answer_en}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-auto text-slate-500 hover:text-teal-600"
                          onClick={() => {
                            setEditingFaq(faq);
                            setFaqCat(faq.category || 'GENERAL');
                            setFaqQEn(faq.question_en || '');
                            setFaqQHi(faq.question_hi || '');
                            setFaqAEn(faq.answer_en || '');
                            setFaqAHi(faq.answer_hi || '');
                            setFaqPublished(faq.published ?? true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1.5 h-auto text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteFaq(faq.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Authoring Form */}
            <Card className="p-5 space-y-4 h-fit border-teal-200 dark:border-teal-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-600" />
                <span>{editingFaq?.id ? 'Edit FAQ' : 'Create FAQ (Multilingual)'}</span>
              </h3>

              <form onSubmit={handleSaveFaq} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={faqCat}
                    onChange={(e) => setFaqCat(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="AMENITIES">AMENITIES</option>
                    <option value="BILLING">BILLING &amp; CASH PAYMENTS</option>
                    <option value="VISITORS">VISITORS &amp; SECURITY</option>
                    <option value="GRIEVANCES">GRIEVANCES</option>
                  </select>
                </div>

                {/* English */}
                <div className="space-y-1">
                  <span className="font-bold text-teal-700 dark:text-teal-300">English (EN) *</span>
                  <input
                    type="text"
                    required
                    placeholder="Question in English"
                    value={faqQEn}
                    onChange={(e) => setFaqQEn(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    required
                    placeholder="Answer in English"
                    value={faqAEn}
                    onChange={(e) => setFaqAEn(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                {/* Hindi */}
                <div className="space-y-1">
                  <span className="font-bold text-teal-700 dark:text-teal-300">Hindi (HI)</span>
                  <input
                    type="text"
                    placeholder="प्रश्न हिंदी में"
                    value={faqQHi}
                    onChange={(e) => setFaqQHi(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    placeholder="उत्तर हिंदी में"
                    value={faqAHi}
                    onChange={(e) => setFaqAHi(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={faqPublished}
                      onChange={(e) => setFaqPublished(e.target.checked)}
                      className="rounded"
                    />
                    <span>Publish Immediately</span>
                  </label>
                </div>

                <Button type="submit" size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-xs">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save FAQ
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* ─── TAB 2: TESTIMONIALS MODERATION ──────────────────────────────────── */}
        {activeTab === 'TESTIMONIALS' && (
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
              <span>
                Mandatory Consent Check: Only resident reviews with explicit statutory DPDP consent and admin approval appear on public showcases. Minimum 3 approved reviews required to render public reel.
              </span>
            </div>

            {testimonials.length === 0 ? (
              <Card className="py-12 text-center text-xs text-slate-500">
                No resident testimonials submitted yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials.map((t) => (
                  <Card key={t.id} className="p-4 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {t.author_name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            ({t.author_role || 'Resident'})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (t.rating || 5) ? 'fill-current' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <Badge
                        variant={
                          t.status === 'APPROVED'
                            ? 'success'
                            : t.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                        }
                        className="text-[10px]"
                      >
                        {t.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>

                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Consent Verified
                      </span>
                      <div className="flex items-center gap-2">
                        {t.status !== 'APPROVED' && (
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 h-7 px-2.5"
                            onClick={() => handleModerateTestimonial(t.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                        )}
                        {t.status !== 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-600 hover:text-red-700 h-7 px-2.5"
                            onClick={() => handleModerateTestimonial(t.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: SITE CONTENT & ANNOUNCEMENTS ─────────────────────────────── */}
        {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Content Templates
              </h3>
              {[
                { key: 'announcement_banner', label: 'Top Announcement Banner' },
                { key: 'about_society', label: 'About Society Text' },
                { key: 'cash_office_hours', label: 'Official Cash Office Hours' },
                { key: 'legal_disclaimer', label: 'Legal Disclaimers & Bylaws' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setSelectedSettingKey(item.key);
                    const found = siteSettings.find((s) => s.key === item.key);
                    setSettingValEn(found?.value_en || '');
                    setSettingValHi(found?.value_hi || '');
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-colors ${
                    selectedSettingKey === item.key
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Card className="lg:col-span-2 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-600" />
                <span>Editing: {selectedSettingKey.replace(/_/g, ' ').toUpperCase()}</span>
              </h3>

              <form onSubmit={handleSaveSiteSetting} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-teal-700 dark:text-teal-300 mb-1">
                    English (EN)
                  </label>
                  <textarea
                    rows={3}
                    value={settingValEn}
                    onChange={(e) => setSettingValEn(e.target.value)}
                    placeholder="English text..."
                    className="w-full p-2.5 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-teal-700 dark:text-teal-300 mb-1">
                    Hindi (HI)
                  </label>
                  <textarea
                    rows={3}
                    value={settingValHi}
                    onChange={(e) => setSettingValHi(e.target.value)}
                    placeholder="हिंदी सामग्री..."
                    className="w-full p-2.5 text-xs rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-xs"
                  disabled={savingSetting}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save Content Setting
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
