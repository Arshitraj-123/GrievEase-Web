import { Page, expect } from '@playwright/test';
import { PublicPage } from '../pages/PublicPage';

export interface SceneContext {
  page: Page;
  lang: 'en' | 'hi';
  captions: Record<string, any>;
  baseUrl: string;
}

export async function runSceneP01(ctx: SceneContext) {
  const p = new PublicPage(ctx.page, ctx.lang);
  const cap = ctx.captions['P01']?.steps || {};

  await p.showTitleCard('P01', 'Public Landing Page Tour', 'Public Visitor', 'Explore homepage sections & verify claims');

  // Step 1: Landing on homepage
  await p.gotoHome();
  await p.recordStep('P01', 1, 7, cap['1'], '#hero');
  await expect(ctx.page.locator('h1')).toBeVisible();

  // Step 2: Language toggle
  await p.recordStep('P01', 2, 7, cap['2'], '[data-testid="lang-dropdown-btn"]');
  await p.toggleLanguage('hi');
  await p.toggleLanguage('en');

  // Step 3: 4-level escalation chain
  await p.recordStep('P01', 3, 7, cap['3'], '#escalation');

  // Step 4: Community ecosystem
  await p.recordStep('P01', 4, 7, cap['4'], '#ecosystem');

  // Step 5: Cash maintenance dues
  await p.recordStep('P01', 5, 7, cap['5'], '#differentiators');

  // Step 6: FAQ accordion
  await p.recordStep('P01', 6, 7, cap['6'], '#faq');

  // Step 7: Footer links & data privacy
  await p.recordStep('P01', 7, 7, cap['7'], 'footer');
}

export async function runSceneP02(ctx: SceneContext) {
  const p = new PublicPage(ctx.page, ctx.lang);
  const cap = ctx.captions['P02']?.steps || {};

  await p.showTitleCard('P02', 'Public Complaint Tracking', 'Public Visitor', 'Track grievance by ID without login');

  await p.gotoTrack();
  await p.recordStep('P02', 1, 4, cap['1']);

  await p.trackComplaint('GRV-2026-001', 'TRK99281');
  await p.recordStep('P02', 2, 4, cap['2'], 'form');

  await p.recordStep('P02', 3, 4, cap['3'], 'div:has-text("Escalation"), div:has-text("Status")');
  await p.recordStep('P02', 4, 4, cap['4']);
}

export async function runSceneP03(ctx: SceneContext) {
  const p = new PublicPage(ctx.page, ctx.lang);
  const cap = ctx.captions['P03']?.steps || {};

  await p.showTitleCard('P03', 'Transparency Dashboard', 'Public Visitor', 'Inspect society governance statistics');

  await p.gotoTransparency();
  await p.recordStep('P03', 1, 4, cap['1']);
  await p.recordStep('P03', 2, 4, cap['2']);
  await p.recordStep('P03', 3, 4, cap['3']);
  await p.recordStep('P03', 4, 4, cap['4']);
}

export async function runSceneP04(ctx: SceneContext) {
  const p = new PublicPage(ctx.page, ctx.lang);
  const cap = ctx.captions['P04']?.steps || {};

  await p.showTitleCard('P04', 'Public Contact & Demo Request', 'Public Visitor', 'Submit inquiry with Proof-of-Work challenge');

  await p.gotoContact();
  await p.recordStep('P04', 1, 4, cap['1']);

  await p.submitContactInquiry('Green Valley Residency', 'Rohan Mehra', '+919999900006', 'rohan@example.local');
  await p.recordStep('P04', 2, 4, cap['2'], 'form');
  await p.recordStep('P04', 3, 4, cap['3']);
  await p.recordStep('P04', 4, 4, cap['4']);
}
