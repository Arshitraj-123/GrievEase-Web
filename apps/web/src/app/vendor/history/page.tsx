'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
} from 'lucide-react';

export default function VendorJobHistoryPage() {
  const { t } = useAccessibility();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendorTasks('COMPLETED')
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load history', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="VENDOR" userRoleTitle="Vendor Partner">
      <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4">
        <Link
          href="/vendor"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Active Work Orders</span>
        </Link>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-600" />
            {t.vendor?.history || 'Completed Job History'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Archived record of all completed maintenance jobs, resident sign-offs, and ratings.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading history...</div>
        ) : tasks.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No completed jobs yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Once you finish assigned work orders, they will appear here with resident feedback.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:border-teal-400 transition-colors">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {task.category || 'SERVICE'}
                      </Badge>
                      <Badge variant="success" className="text-[10px]">
                        {task.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        {task.flat_number
                          ? `Flat ${task.flat_number}${task.wing ? `, Wing ${task.wing}` : ''}`
                          : task.area_text || 'Society Common Area'}
                      </span>
                    </div>

                    {task.resident_rating && (
                      <div className="flex items-center gap-1 text-amber-500 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < task.resident_rating ? 'fill-current' : 'text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="font-semibold text-slate-600 dark:text-slate-400 ml-1">
                          {task.resident_rating}.0
                        </span>
                      </div>
                    )}
                  </div>

                  <Link href={`/vendor/tasks/${task.id}`}>
                    <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

