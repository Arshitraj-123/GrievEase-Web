'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackNotices, fallbackCategories } from '@/lib/fallback-community';
import { NoticeListItemDto, NoticeCategoryDto } from '@grievease/contracts';
import {
  Megaphone,
  Search,
  Pin,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  Paperclip,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function ResidentNoticesPage() {
  const { t } = useAccessibility();
  const [notices, setNotices] = useState<NoticeListItemDto[]>([]);
  const [categories, setCategories] = useState<NoticeCategoryDto[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'pinned'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [noticesRes, catsRes] = await Promise.allSettled([
          api.getNotices(),
          api.getNoticeCategories(),
        ]);

        if (noticesRes.status === 'fulfilled' && Array.isArray(noticesRes.value)) {
          setNotices(noticesRes.value);
        } else {
          setNotices(fallbackNotices);
        }

        if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
          setCategories(catsRes.value);
        } else {
          setCategories(fallbackCategories);
        }
      } catch {
        setNotices(fallbackNotices);
        setCategories(fallbackCategories);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter notices
  const filteredNotices = notices.filter((n) => {
    if (activeTab === 'unread' && n.isRead) return false;
    if (activeTab === 'pinned' && !n.pinned) return false;
    if (selectedCategory !== 'all' && n.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchBody = n.bodyPreview.toLowerCase().includes(q);
      const matchCat = n.categoryName.toLowerCase().includes(q);
      if (!matchTitle && !matchBody && !matchCat) return false;
    }
    return true;
  });

  const unreadCount = notices.filter((n) => !n.isRead).length;
  const pinnedCount = notices.filter((n) => n.pinned).length;

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Megaphone className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.communityNotices?.title || 'Society Noticeboard'}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.communityNotices?.subtitle || 'Official notices, circulars, and community announcements'}
            </p>
          </div>
        </div>

        {/* Search Bar (Min 44px tap targets) */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.communityNotices?.searchPlaceholder || 'Search notices by title or content...'}
            className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          />
        </div>

        {/* Tabs: All / Unread / Pinned */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{t.communityNotices?.allTab || 'All Notices'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-white/20 dark:bg-white/10">
              {notices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'unread'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{t.communityNotices?.unreadTab || 'Unread'}</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pinned')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'pinned'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>{t.communityNotices?.pinnedTab || 'Pinned'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800">
              {pinnedCount}
            </span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.nameEn}
            </button>
          ))}
        </div>

        {/* Notices Cards List */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading notices...</div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No notices found</h3>
            <p className="text-xs text-slate-500 mt-1">There are no notices matching your current filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => {
              const isEmergency = notice.priority === 'EMERGENCY';
              const isImportant = notice.priority === 'IMPORTANT';

              return (
                <Link
                  key={notice.id}
                  href={`/app/notices/${notice.id}`}
                  className={`block rounded-2xl p-5 border transition-all duration-200 hover:shadow-md min-h-[44px] ${
                    isEmergency
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:border-red-300'
                      : notice.pinned
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Meta badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {notice.pinned && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                            <Pin className="w-3 h-3" />
                            Pinned
                          </span>
                        )}

                        {isEmergency && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white">
                            <AlertTriangle className="w-3 h-3" />
                            EMERGENCY
                          </span>
                        )}

                        {isImportant && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                            Important
                          </span>
                        )}

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {notice.categoryName}
                        </span>

                        {!notice.isRead && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                            Unread
                          </span>
                        )}

                        {notice.requiresAck && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              notice.isAcknowledged
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {notice.isAcknowledged ? 'Acknowledged' : 'Ack Required'}
                          </span>
                        )}

                        {notice.hasEdits && (
                          <span className="text-[11px] text-slate-400 italic">
                            (Edited)
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {notice.title}
                      </h2>

                      {/* Preview */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {notice.bodyPreview}
                      </p>

                      {/* Footer info */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {notice.publishedAt
                            ? new Date(notice.publishedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Scheduled'}
                        </span>

                        {notice.attachmentCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Paperclip className="w-3.5 h-3.5" />
                            {notice.attachmentCount} attachment{notice.attachmentCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
