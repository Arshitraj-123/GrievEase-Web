import { Page, expect } from '@playwright/test';
import { GuardVendorPage } from '../pages/GuardVendorPage';
import { SceneContext } from './public.scenes';

export async function runSceneG01(ctx: SceneContext) {
  const p = new GuardVendorPage(ctx.page, ctx.lang);
  const cap = ctx.captions['G01']?.steps || {};

  await p.showTitleCard('G01', 'Guard Gatehouse Console', 'Gate Security Guard', 'Verify visitor QR, request walk-in approval, & offline sync');

  await p.login('guard.main', 'DemoUserPass123!');
  await p.gotoGuardConsole();
  await p.recordStep('G01', 1, 5, cap['1']);

  await p.verifyVisitorPass('V-88291');
  await p.recordStep('G01', 2, 5, cap['2']);
  await p.recordStep('G01', 3, 5, cap['3']);
  await p.recordStep('G01', 4, 5, cap['4']);
  await p.recordStep('G01', 5, 5, cap['5']);
}

export async function runSceneG02(ctx: SceneContext) {
  const p = new GuardVendorPage(ctx.page, ctx.lang);
  const cap = ctx.captions['G02']?.steps || {};

  await p.showTitleCard('G02', 'Amenity Check-In Verification', 'Security Guard', 'Verify resident amenity pass at clubhouse entrance');

  await p.login('guard.main', 'DemoUserPass123!');
  await ctx.page.goto('/guard');
  await p.recordStep('G02', 1, 4, cap['1']);
  await p.recordStep('G02', 2, 4, cap['2']);
  await p.recordStep('G02', 3, 4, cap['3']);
  await p.recordStep('G02', 4, 4, cap['4']);
}

export async function runSceneV01(ctx: SceneContext) {
  const p = new GuardVendorPage(ctx.page, ctx.lang);
  const cap = ctx.captions['V01']?.steps || {};

  await p.showTitleCard('V01', 'Vendor Task Execution & Proof', 'Vendor Contractor', 'Review task, upload photo proofs, & complete repair');

  await p.login('vendor.spark', 'DemoUserPass123!');
  await p.gotoVendorPortal();
  await p.recordStep('V01', 1, 5, cap['1']);

  await p.vendorCompleteTask('GRV-2026-001', 'Replaced flickering ballast and LED tube with warranty.');
  await p.recordStep('V01', 2, 5, cap['2']);
  await p.recordStep('V01', 3, 5, cap['3']);
  await p.recordStep('V01', 4, 5, cap['4']);
  await p.recordStep('V01', 5, 5, cap['5']);
}
