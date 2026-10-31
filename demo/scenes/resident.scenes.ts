import { Page, expect } from '@playwright/test';
import { ResidentPage } from '../pages/ResidentPage';
import { SceneContext } from './public.scenes';

export async function runSceneR01(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R01']?.steps || {};

  await p.showTitleCard('R01', 'Resident Account Activation', 'Resident', 'Activate account from credential slip & set recovery');

  await p.gotoActivation();
  await p.recordStep('R01', 1, 5, cap['1']);

  await p.activateAccount('A-102', 'ACTDEMO123');
  await p.recordStep('R01', 2, 5, cap['2'], 'form');
  await p.recordStep('R01', 3, 5, cap['3']);
  await p.recordStep('R01', 4, 5, cap['4']);
  await p.recordStep('R01', 5, 5, cap['5']);
}

export async function runSceneR02(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R02']?.steps || {};

  await p.showTitleCard('R02', 'Resident Login & Account Security', 'Resident', 'Login, recovery code workflow & session security');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await p.recordStep('R02', 1, 4, cap['1']);

  await ctx.page.goto('/forgot-password');
  await p.recordStep('R02', 2, 4, cap['2']);
  await p.recordStep('R02', 3, 4, cap['3']);

  await ctx.page.goto('/app/settings');
  await p.recordStep('R02', 4, 4, cap['4']);
}

export async function runSceneR03(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R03']?.steps || {};

  await p.showTitleCard('R03', 'Raise Named Grievance & PWA', 'Resident', 'Submit grievance with evidence photos & autosave');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/grievances/new');
  await p.recordStep('R03', 1, 5, cap['1']);

  await p.fileGrievance('Corridor light flickering near flat A-102', 'The light blinks continuously causing safety hazard.', 'Electricity & Power', false);
  await p.recordStep('R03', 2, 5, cap['2'], 'textarea');
  await p.recordStep('R03', 3, 5, cap['3']);
  await p.recordStep('R03', 4, 5, cap['4']);
  await p.recordStep('R03', 5, 5, cap['5']);
}

export async function runSceneR04(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R04']?.steps || {};

  await p.showTitleCard('R04', 'Raise Anonymous Grievance', 'Resident', 'Submit sensitive complaint & secure tracking code');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/grievances/new');
  await p.recordStep('R04', 1, 4, cap['1']);

  await p.fileGrievance('Late-night loud noise in hallway', 'Music played at high volume after midnight.', 'Security & Safety', true);
  await p.recordStep('R04', 2, 4, cap['2']);
  await p.recordStep('R04', 3, 4, cap['3']);
  await p.recordStep('R04', 4, 4, cap['4']);
}

export async function runSceneR05(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R05']?.steps || {};

  await p.showTitleCard('R05', 'Track Grievance & Rate Resolution', 'Resident', 'Track 4-step stepper & rate vendor resolution');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/grievances');
  await p.recordStep('R05', 1, 4, cap['1']);
  await p.recordStep('R05', 2, 4, cap['2']);
  await p.recordStep('R05', 3, 4, cap['3']);
  await p.recordStep('R05', 4, 4, cap['4']);
}

export async function runSceneR06(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R06']?.steps || {};

  await p.showTitleCard('R06', 'Notices & Community Polls', 'Resident', 'Read emergency notice & vote in secret poll');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await p.gotoApp();
  await p.recordStep('R06', 1, 4, cap['1']);

  await ctx.page.goto('/app/notices');
  await p.recordStep('R06', 2, 4, cap['2']);

  await ctx.page.goto('/app/polls');
  await p.recordStep('R06', 3, 4, cap['3']);
  await p.recordStep('R06', 4, 4, cap['4']);
}

export async function runSceneR07(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R07']?.steps || {};

  await p.showTitleCard('R07', 'Resident Directory & Privacy', 'Resident', 'Browse directory & access offline emergency contacts');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/directory');
  await p.recordStep('R07', 1, 4, cap['1']);
  await p.recordStep('R07', 2, 4, cap['2']);

  await ctx.page.goto('/app/emergency-contacts');
  await p.recordStep('R07', 3, 4, cap['3']);

  await ctx.page.goto('/app/settings');
  await p.recordStep('R07', 4, 4, cap['4']);
}

export async function runSceneR08(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R08']?.steps || {};

  await p.showTitleCard('R08', 'Domestic Staff & Pass QR', 'Resident', 'Register domestic helper & generate gate pass QR');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/staff');
  await p.recordStep('R08', 1, 4, cap['1']);
  await p.recordStep('R08', 2, 4, cap['2']);
  await p.recordStep('R08', 3, 4, cap['3']);
  await p.recordStep('R08', 4, 4, cap['4']);
}

export async function runSceneR09(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R09']?.steps || {};

  await p.showTitleCard('R09', 'Visitor Passes & Walk-in Approval', 'Resident', 'Pre-approve visitor pass & answer walk-in notification');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/visitors');
  await p.recordStep('R09', 1, 4, cap['1']);

  await p.generateVisitorPass('Aarav Sharma');
  await p.recordStep('R09', 2, 4, cap['2']);
  await p.recordStep('R09', 3, 4, cap['3']);
  await p.recordStep('R09', 4, 4, cap['4']);
}

export async function runSceneR10(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R10']?.steps || {};

  await p.showTitleCard('R10', 'Emergency SOS Trigger & Alerts', 'Resident', 'Dispatch emergency alert & track guard response');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await p.triggerEmergencySos();
  await p.recordStep('R10', 1, 5, cap['1']);
  await p.recordStep('R10', 2, 5, cap['2']);
  await p.recordStep('R10', 3, 5, cap['3']);
  await p.recordStep('R10', 4, 5, cap['4']);
  await p.recordStep('R10', 5, 5, cap['5']);
}

export async function runSceneR11(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R11']?.steps || {};

  await p.showTitleCard('R11', 'Amenities & Cash Dues Receipts', 'Resident', 'Book amenity with hold timer & view cash receipts');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/amenities');
  await p.recordStep('R11', 1, 4, cap['1']);

  await p.bookAmenity('Tennis & Badminton Court');
  await p.recordStep('R11', 2, 4, cap['2']);

  await ctx.page.goto('/app/billing');
  await p.recordStep('R11', 3, 4, cap['3']);
  await p.recordStep('R11', 4, 4, cap['4']);
}

export async function runSceneR12(ctx: SceneContext) {
  const p = new ResidentPage(ctx.page, ctx.lang);
  const cap = ctx.captions['R12']?.steps || {};

  await p.showTitleCard('R12', 'Office Messages & Privacy Data Export', 'Resident', 'Chat with management office & download personal data');

  await p.login('resident.rohan', 'DemoUserPass123!');
  await ctx.page.goto('/app/messages');
  await p.recordStep('R12', 1, 4, cap['1']);
  await p.recordStep('R12', 2, 4, cap['2']);

  await ctx.page.goto('/app/settings');
  await p.recordStep('R12', 3, 4, cap['3']);
  await p.recordStep('R12', 4, 4, cap['4']);
}
