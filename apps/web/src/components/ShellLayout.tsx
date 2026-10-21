'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import { IdleTimer } from './IdleTimer';
import { Button, Badge } from '@grievease/ui';
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
} from 'lucide-react';
import { api } from '@/lib/api-client';

export interface ShellLayoutProps {
  role: 'ADMIN' | 'RESIDENT' | 'GUARD' | 'VENDOR';
  children: React.ReactNode;
  userRoleTitle?: string;
}

export function ShellLayout({ role, children, userRoleTitle = 'Resident' }: ShellLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    router.push('/login');
  };

  const navItems = {
    ADMIN: [
      { label: 'Overview', href: '/admin' },
      { label: 'Members Directory', href: '/admin/users' },
      { label: 'Bulk Import', href: '/admin/users/import' },
      { label: 'Credential Slips', href: '/admin/credentials' },
      { label: 'Recovery Requests', href: '/admin/recovery-requests' },
      { label: 'Handover', href: '/admin/super-admin-transfer' },
      { label: 'Security & Profile', href: '/admin/me' },
    ],
    RESIDENT: [
      { label: 'Home', href: '/app' },
      { label: 'Security & Devices', href: '/app/settings/security' },
    ],
    GUARD: [
      { label: 'Gate Operations', href: '/guard' },
    ],
    VENDOR: [
      { label: 'Assigned Work', href: '/vendor' },
    ],
  };

  const currentNav = navItems[role] || navItems.RESIDENT;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <IdleTimer />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href={role === 'ADMIN' ? '/admin' : '/app'} className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm">
                G
              </span>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                Griev<span className="text-teal-600">Ease</span>
              </span>
            </a>

            <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 text-xs py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              <span>Green Valley Residency</span>
            </Badge>

            <Badge variant="default" className="text-[11px] font-semibold">
              {userRoleTitle}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Persistent Disabled SOS Button on Resident Shell */}
            {role === 'RESIDENT' && (
              <button
                disabled
                title="SOS Alert arrives in Phase 3"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 text-xs font-bold opacity-60 cursor-not-allowed border border-red-200 dark:border-red-900"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>SOS Alert (Phase 3)</span>
              </button>
            )}

            <NotificationBell />

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
                  {userRoleTitle.slice(0, 1)}
                </div>
                <span className="hidden md:inline">{userRoleTitle}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-xs animate-in fade-in duration-150">
                  <a
                    href={role === 'ADMIN' ? '/admin/me' : '/app/settings/security'}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Security Settings</span>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {currentNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900">
        GrievEase Society Operating System • Phase 2 Foundation & Authentication • Client-Owned Secure Deployment
      </footer>
    </div>
  );
}
