'use client';

import React from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@grievease/ui';
import { Clock, ShieldCheck, Layers, GitCommit, AlertCircle } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function ResidentGrievancesPlaceholderPage() {
  const { t } = useAccessibility();

  const escalationTiers = [
    { level: 'Level 1', role: 'Society Secretary', sla: '48 Hours', desc: 'Initial triage, resident communication, vendor assignment.' },
    { level: 'Level 2', role: 'Executive Committee', sla: '72 Hours', desc: 'Automatic escalation upon SLA breach by Level 1.' },
    { level: 'Level 3', role: 'Society Chairman', sla: '96 Hours', desc: 'Executive intervention and resolution enforcement.' },
    { level: 'Level 4', role: 'Governing Body', sla: '120 Hours', desc: 'Final society authority with permanent binding audit record.' },
  ];

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
          <Badge variant="default" className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs mb-3">
            Core Architecture • Phase 3 Rollout
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.grievances.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            {t.grievances.subtitle}
          </p>
        </div>

        {/* Notice Card */}
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
            <span className="font-bold">Phase 2 Scope Notice:</span> {t.grievances.phase3Notice} Your society profile and cryptographic authentication are now active.
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="space-y-2">
              <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">{t.grievances.slaTitle}</CardTitle>
              <CardDescription className="text-xs">
                {t.grievances.slaDescription}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="space-y-2">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 w-fit">
                <Layers className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">{t.grievances.escalationTitle}</CardTitle>
              <CardDescription className="text-xs">
                {t.grievances.escalationDescription}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="space-y-2">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 w-fit">
                <GitCommit className="w-5 h-5" />
              </div>
              <CardTitle className="text-base">{t.grievances.immutableAuditTitle}</CardTitle>
              <CardDescription className="text-xs">
                {t.grievances.immutableAuditDescription}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 4-Tier Escalation Ladder */}
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Automatic Escalation Architecture</CardTitle>
            <CardDescription className="text-xs">
              Every complaint is bound to deterministic SLA timers with zero manual suppression possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {escalationTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {tier.role} <span className="text-xs font-normal text-slate-400">({tier.level})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{tier.desc}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs font-bold">
                    SLA: {tier.sla}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
