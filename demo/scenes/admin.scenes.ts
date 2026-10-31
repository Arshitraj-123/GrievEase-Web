import { Page, expect } from '@playwright/test';
import { AdminPage } from '../pages/AdminPage';
import { SceneContext } from './public.scenes';

export async function runSceneA01(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A01']?.steps || {};

  await p.showTitleCard('A01', 'First-Run Super Admin Setup', 'Super Admin', 'Bootstrap master administrator account & enroll TOTP');

  // Step 1: Navigating to setup (simulated demo flow without displaying secret token on screen)
  await ctx.page.goto('/setup');
  await p.recordStep('A01', 1, 4, cap['1']);

  // Step 2: Super Admin credentials
  await p.recordStep('A01', 2, 4, cap['2'], 'form');

  // Step 3: Enrolling TOTP
  await p.recordStep('A01', 3, 4, cap['3']);

  // Step 4: Setup sealed with 404
  await p.recordStep('A01', 4, 4, cap['4']);
}

export async function runSceneA02(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A02']?.steps || {};

  await p.showTitleCard('A02', 'User Management & Bulk Onboarding', 'Super Admin & Secretary', 'Import society residents with validation & credential slips');

  await p.login('secretary.gvr', 'DemoUserPass123!');
  await p.gotoUsers();
  await p.recordStep('A02', 1, 7, cap['1']);
  await p.recordStep('A02', 2, 7, cap['2']);
  await p.recordStep('A02', 3, 7, cap['3']);
  await p.recordStep('A02', 4, 7, cap['4']);
  await p.recordStep('A02', 5, 7, cap['5']);
  await p.recordStep('A02', 6, 7, cap['6']);
  await p.recordStep('A02', 7, 7, cap['7']);
}

export async function runSceneA03(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A03']?.steps || {};

  await p.showTitleCard('A03', 'Society Configuration & Governance', 'Super Admin & Chairman', 'Configure 4-level escalation chain & category SLAs');

  await p.login('chairman.gvr', 'DemoUserPass123!');
  await ctx.page.goto('/admin/escalation');
  await p.recordStep('A03', 1, 6, cap['1']);
  await p.recordStep('A03', 2, 6, cap['2']);
  await p.recordStep('A03', 3, 6, cap['3']);
  await p.recordStep('A03', 4, 6, cap['4']);
  await p.recordStep('A03', 5, 6, cap['5']);
  await p.recordStep('A03', 6, 6, cap['6']);
}

export async function runSceneA04(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A04']?.steps || {};

  await p.showTitleCard('A04', 'Secretary Grievance Handling', 'Secretary', 'Process inbox, pause SLA, assign vendor, and resolve');

  await p.login('secretary.gvr', 'DemoUserPass123!');
  await p.gotoGrievances();
  await p.recordStep('A04', 1, 6, cap['1']);

  await p.acknowledgeGrievance();
  await p.recordStep('A04', 2, 6, cap['2']);
  await p.recordStep('A04', 3, 6, cap['3']);
  await p.recordStep('A04', 4, 6, cap['4']);
  await p.recordStep('A04', 5, 6, cap['5']);
  await p.recordStep('A04', 6, 6, cap['6']);
}

export async function runSceneA05(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A05']?.steps || {};

  await p.showTitleCard('A05', '4-Level Auto-Escalation & Audit Trail', 'System & Chairman', 'Demonstrate SLA breach escalation L1 through L4');

  await p.login('chairman.gvr', 'DemoUserPass123!');
  await p.gotoEscalationMonitor();
  await p.recordStep('A05', 1, 6, cap['1']);

  // Advance clock via demo API
  await ctx.page.request.post('/api/v1/demo/advance-clock', {
    headers: { 'x-demo-secret': process.env.DEMO_SECRET || 'grievease_demo_secret_2026' },
    data: { hours: 24 },
  }).catch(() => null);

  await p.gotoEscalationMonitor();
  await p.recordStep('A05', 2, 6, cap['2']);
  await p.recordStep('A05', 3, 6, cap['3']);
  await p.recordStep('A05', 4, 6, cap['4']);
  await p.recordStep('A05', 5, 6, cap['5']);

  await ctx.page.goto('/admin/audit');
  await p.recordStep('A05', 6, 6, cap['6']);
}

export async function runSceneA06(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A06']?.steps || {};

  await p.showTitleCard('A06', 'Anonymous Grievance Handling & Reveal', 'Super Admin & Governing Body', 'Handle anonymous complaint and execute emergency reveal');

  await p.login('admin.super', 'DemoUserPass123!');
  await p.gotoGrievances();
  await p.recordStep('A06', 1, 5, cap['1']);
  await p.recordStep('A06', 2, 5, cap['2']);
  await p.recordStep('A06', 3, 5, cap['3']);
  await p.recordStep('A06', 4, 5, cap['4']);
  await p.recordStep('A06', 5, 5, cap['5']);
}

export async function runSceneA07(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A07']?.steps || {};

  await p.showTitleCard('A07', 'Analytics & Resolver Performance', 'Chairman & Committee', 'Analyze SLA compliance and resolver scorecards');

  await p.login('chairman.gvr', 'DemoUserPass123!');
  await p.gotoAnalytics();
  await p.recordStep('A07', 1, 5, cap['1']);
  await p.recordStep('A07', 2, 5, cap['2']);
  await p.recordStep('A07', 3, 5, cap['3']);
  await p.recordStep('A07', 4, 5, cap['4']);
  await p.recordStep('A07', 5, 5, cap['5']);
}

export async function runSceneA08(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A08']?.steps || {};

  await p.showTitleCard('A08', 'Community Notices, Polls & Staff', 'Secretary', 'Publish bilingual notice, poll, and domestic staff passes');

  await p.login('secretary.gvr', 'DemoUserPass123!');
  await p.gotoNotices();
  await p.recordStep('A08', 1, 4, cap['1']);
  await p.recordStep('A08', 2, 4, cap['2']);

  await ctx.page.goto('/admin/polls');
  await p.recordStep('A08', 3, 4, cap['3']);

  await ctx.page.goto('/admin/staff');
  await p.recordStep('A08', 4, 4, cap['4']);
}

export async function runSceneA09(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A09']?.steps || {};

  await p.showTitleCard('A09', 'Security, Guard Desk & SOS Admin', 'Security Supervisor', 'Manage guard roster and emergency SOS console');

  await p.login('secretary.gvr', 'DemoUserPass123!');
  await p.gotoSecurityDesk();
  await p.recordStep('A09', 1, 4, cap['1']);
  await p.recordStep('A09', 2, 4, cap['2']);
  await p.recordStep('A09', 3, 4, cap['3']);
  await p.recordStep('A09', 4, 4, cap['4']);
}

export async function runSceneA10(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A10']?.steps || {};

  await p.showTitleCard('A10', 'Amenities & Cash Billing Ledger', 'Secretary & Chairman', 'Run billing cycle, record cash payment, and verify ledger');

  await p.login('secretary.gvr', 'DemoUserPass123!');
  await p.gotoBilling();
  await p.recordStep('A10', 1, 6, cap['1']);
  await p.recordStep('A10', 2, 6, cap['2']);

  await p.recordCashPayment('A-102', '3500');
  await p.recordStep('A10', 3, 6, cap['3']);
  await p.recordStep('A10', 4, 6, cap['4']);

  await ctx.page.goto('/admin/billing/day-close');
  await p.recordStep('A10', 5, 6, cap['5']);

  await ctx.page.goto('/admin/billing/ledger');
  await p.recordStep('A10', 6, 6, cap['6']);
}

export async function runSceneA11(ctx: SceneContext) {
  const p = new AdminPage(ctx.page, ctx.lang);
  const cap = ctx.captions['A11']?.steps || {};

  await p.showTitleCard('A11', 'Vendors, CMS & Super Admin Transfer', 'Super Admin', 'Manage vendor tasks, CMS FAQs, and admin transfer');

  await p.login('admin.super', 'DemoUserPass123!');
  await ctx.page.goto('/admin/vendors');
  await p.recordStep('A11', 1, 5, cap['1']);

  await ctx.page.goto('/admin/cms');
  await p.recordStep('A11', 2, 5, cap['2']);

  await ctx.page.goto('/admin/system');
  await p.recordStep('A11', 3, 5, cap['3']);

  await ctx.page.goto('/admin/roles');
  await p.recordStep('A11', 4, 5, cap['4']);
  await p.recordStep('A11', 5, 5, cap['5']);
}
