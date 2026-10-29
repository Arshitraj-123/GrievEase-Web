'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { ShieldAlert, ArrowLeft, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AdminEscalatedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminInbox({ status: 'ESCALATED' })
      .then((res) => setItems(Array.isArray(res) ? res : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Executive Review (L3/L4)">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        <Link
          href="/admin"
          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Console</span>
        </Link>

        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-1">
          <Badge className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs mb-2">
            Chairman & Governing Body Authority
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Escalated Grievance Dossier
          </h1>
          <p className="text-xs text-slate-300">
            Complaints that have breached lower level SLAs (Level 1/2) or have been escalated via formal resident appeal.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No escalated complaints currently pending executive intervention.
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/admin/grievances/${item.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm hover:border-rose-500 transition-all block group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-600">
                        {item.publicId}
                      </span>
                      <Badge className="bg-rose-600 text-white text-[10px]">
                        Level {item.currentLevel} Escalated
                      </Badge>
                      <Badge variant="neutral" className="text-[10px]">
                        {item.categoryName}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600 shrink-0">
                    <span>Executive Review</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
