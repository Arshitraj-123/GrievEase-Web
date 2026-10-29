'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import { IdleTimer } from './IdleTimer';
import { Badge } from '@grievease/ui';
import {
  Users,
  FileSpreadsheet,
  ShieldCheck,
  LogOut,
  User,
  Settings,
  AlertOctagon,
  ChevronRight,
  Shield,
  Layers,
  FileText,
  HelpCircle,
  Bell,
  Home,
  MessageSquare,
  Megaphone,
  Vote,
  BookUser,
  PhoneCall,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from './AccessibilityProvider';
import { fallbackNotices } from '@/lib/fallback-community';

// Feature flags: notices, polls, directory, emergency_contacts, staff default ON
const FEATURE_FLAGS = {
  NOTICES: true,
  POLLS: true,
  DIRECTORY: true,
  EMERGENCY_CONTACTS: true,
  STAFF: true,
  SOS: false,
  VISITORS: false,
  BILLING: false,
  AMENITIES: false,
};

export interface ShellLayoutProps {
  role?: 'ADMIN' | 'RESIDENT' | 'GUARD' | 'VENDOR';
  children: React.ReactNode;
  userRoleTitle?: string;
}

export function ShellLayout({ role: propRole, children, userRoleTitle }: ShellLayoutProps) {
  const pathname = usePathname();
  const role = propRole || (pathname?.startsWith('/admin') ? 'ADMIN' : 'RESIDENT');
  const router = useRouter();
  const { t } = useAccessibility();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [emergencyNotice, setEmergencyNotice] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (role === 'RESIDENT') {
      api.getNotices()
        .then((res) => {
          const items = Array.isArray(res) ? res : res?.items || [];
          const em = items.find((n: any) => n.priority === 'EMERGENCY' && !n.isAcknowledged);
          if (em) {
            setEmergencyNotice({ id: em.id, title: em.title });
          } else {
            setEmergencyNotice(null);
          }
        })
        .catch(() => {
          const em = fallbackNotices.find((n) => n.priority === 'EMERGENCY' && !n.isAcknowledged);
          if (em) setEmergencyNotice({ id: em.id, title: em.title });
        });
    }
  }, [role, pathname]);

  const displayRoleTitle = userRoleTitle || (role === 'ADMIN' ? 'Administrator' : t.nav.residentRole);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    router.push('/login');
  };

  // Scoped typed navigation:
  // Resident shell: Home, Grievances, Notices, Community, My Staff, Directory, Emergency, Notifications, Profile & Security, Help
  // Admin shell: Matching management modules
  const navItems = {
    ADMIN: [
      { label: 'Overview', href: '/admin', icon: Home },
      { label: 'Grievances', href: '/admin/grievances', icon: MessageSquare },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Notices', href: '/admin/notices', icon: Megaphone },
      { label: 'Polls', href: '/admin/polls', icon: Vote },
      { label: 'Domestic Staff', href: '/admin/staff', icon: UserCheck },
      { label: 'Directory', href: '/admin/directory', icon: BookUser },
      { label: 'Emergency', href: '/admin/emergency-contacts', icon: PhoneCall },
      { label: 'User Management', href: '/admin/users', icon: Users },
      { label: 'Security & Profile', href: '/admin/me', icon: Settings },
    ],
    RESIDENT: [
      { label: t.nav.home, href: '/app', icon: Home },
      { label: t.nav.grievances, href: '/app/grievances', icon: MessageSquare },
      { label: t.nav.notices || 'Notices', href: '/app/notices', icon: Megaphone },
      { label: t.nav.community || 'Community', href: '/app/community', icon: Vote },
      { label: t.nav.staff || 'My Staff', href: '/app/staff', icon: UserCheck },
      { label: t.nav.directory || 'Directory', href: '/app/directory', icon: BookUser },
      { label: t.nav.emergency || 'Emergency', href: '/app/emergency', icon: PhoneCall },
      { label: t.nav.notifications, href: '/app/notifications', icon: Bell },
      { label: t.nav.security, href: '/app/settings/security', icon: Settings },
      { label: t.nav.help, href: '/account-help', icon: HelpCircle },
    ],
    GUARD: [
      { label: 'Gate Operations', href: '/guard', icon: Shield },
    ],
    VENDOR: [
      { label: 'Assigned Work', href: '/vendor', icon: Layers },
    ],
  };

  const currentNav = navItems[role] || navItems.RESIDENT;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      <IdleTimer />

      {/* Persistent Top Emergency Notice Banner for Residents */}
      {role === 'RESIDENT' && emergencyNotice && (
        <aside
          role="alert"
          aria-live="assertive"
          className="sticky top-0 z-50 bg-red-600 text-white px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-lg border-b border-red-700 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <AlertOctagon className="w-5 h-5 shrink-0 text-amber-300 animate-pulse" />
            <span className="truncate">
              <strong>EMERGENCY ADVISORY:</strong> {emergencyNotice.title}
            </span>
          </div>
          <a
            href={`/app/notices/${emergencyNotice.id}`}
            className="shrink-0 bg-white text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors min-h-[36px] inline-flex items-center shadow-xs"
          >
            View &amp; Acknowledge
          </a>
        </aside>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href={role === 'ADMIN' ? '/admin' : '/app'}
              className="flex items-center gap-2 min-h-[44px] min-w-[44px]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base">
                G
              </span>
              <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:inline">
                Griev<span className="text-teal-600">Ease</span>
              </span>
            </a>

            <Badge variant="outline" className="hidden md:inline-flex gap-1.5 text-xs py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              <span>{t.nav.societyName}</span>
            </Badge>

            <Badge variant="default" className="text-xs font-semibold px-2 py-0.5">
              {displayRoleTitle}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* SOS hidden behind feature flag */}
            {FEATURE_FLAGS.SOS && role === 'RESIDENT' && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold min-h-[44px]"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>SOS Alert</span>
              </button>
            )}

            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="User Profile Menu"
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors min-h-[44px] min-w-[44px]"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                  {displayRoleTitle.slice(0, 1)}
                </div>
                <span className="hidden md:inline">{displayRoleTitle}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in duration-150">
                  <a
                    href={role === 'ADMIN' ? '/admin/me' : '/app/settings/security'}
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{t.nav.security}</span>
                  </a>
                  <a
                    href="/account-help"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>{t.nav.help}</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-slate-100 dark:border-slate-800 min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.nav.signOut}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-Friendly Navigation Bar (Min 44px tap targets) */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-1.5 scrollbar-none">
            {currentNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 px-4">
        GrievEase Resident Portal • Phase 2 Foundation &amp; Authentication • Client-Owned Secure Deployment
      </footer>
    </div>
  );
}
