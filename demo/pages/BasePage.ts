import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { authenticator } from 'otplib';

export class BasePage {
  constructor(public page: Page, public lang: 'en' | 'hi' = 'en') {}

  async recordStep(
    sceneId: string,
    stepNum: number,
    totalSteps: number,
    caption: string,
    highlightSelector?: string
  ) {
    // 1. Update Injected Overlay
    await this.page.evaluate(
      ({ sId, sNum, total, cap }) => {
        if (typeof (window as any).__updateDemoOverlay === 'function') {
          (window as any).__updateDemoOverlay(sId, sNum, total, cap);
        }
      },
      { sId: sceneId, sNum: stepNum, total: totalSteps, cap: caption }
    );

    // 2. Element Highlight
    if (highlightSelector) {
      await this.page.evaluate((sel) => {
        if (typeof (window as any).__highlightElement === 'function') {
          (window as any).__highlightElement(sel);
        }
      }, highlightSelector);
    } else {
      await this.page.evaluate(() => {
        if (typeof (window as any).__highlightElement === 'function') {
          (window as any).__highlightElement(null);
        }
      });
    }

    // 3. Human Pacing Pause (700ms - 1000ms)
    await this.page.waitForTimeout(800);

    // Quality Gate: Check DOM for corrupt tokens (undefined, NaN, [object Object], etc.)
    const badText = await this.page.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      const match = text.match(/\b(undefined|NaN|\[object Object\]|lorem ipsum|TODO:|FIXME:)\b/i);
      return match ? match[0] : null;
    });
    if (badText) {
      throw new Error(`Quality Gate Failure: Forbidden corrupt string "${badText}" detected on page during scene ${sceneId} step ${stepNum}`);
    }

    // 4. Capture Step Screenshot for Offline Walkthrough & PDF
    const screenshotsDir = path.resolve(__dirname, '../out/screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });
    const screenshotPath = path.join(screenshotsDir, `${sceneId}_step${stepNum}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: false });
  }

  async humanClick(selector: string) {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 8000 });
    await el.scrollIntoViewIfNeeded();

    // Subtle highlight before clicking
    await this.page.evaluate((sel) => {
      if (typeof (window as any).__highlightElement === 'function') {
        (window as any).__highlightElement(sel);
      }
    }, selector);

    await this.page.waitForTimeout(300);
    await el.click();
    await this.page.waitForTimeout(400);
  }

  async humanType(selector: string, text: string) {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: 'visible', timeout: 8000 });
    await el.scrollIntoViewIfNeeded();

    await el.focus();
    await el.fill(''); // Clear first
    await this.page.waitForTimeout(200);

    for (const char of text) {
      await el.pressSequentially(char, { delay: 50 }); // 50ms per char human cadence
    }
    await this.page.waitForTimeout(300);
  }

  async toggleLanguage(targetLang: 'en' | 'hi') {
    const dropdown = this.page.locator('[data-testid="lang-dropdown-btn"]').first();
    if (await dropdown.isVisible()) {
      await dropdown.click();
      await this.page.waitForTimeout(300);
      const btn = this.page.locator(`[data-testid="lang-btn-${targetLang}"]`).first();
      await btn.click();
      await this.page.waitForTimeout(500);
      this.lang = targetLang;
    }
  }

  async login(username: string, password: string, totpSecret?: string) {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');

    await this.humanType('input[name="username"], input[id="username"]', username);
    await this.humanType('input[name="password"], input[id="password"]', password);
    await this.humanClick('button[type="submit"]');

    // Handle 2FA TOTP prompt if required (Admins)
    const totpInput = this.page.locator('input[name="totpCode"], input[placeholder*="authenticator"]');
    if (await totpInput.isVisible({ timeout: 2500 }).catch(() => false)) {
      const code = totpSecret ? authenticator.generate(totpSecret) : '123456';
      await this.humanType('input[name="totpCode"]', code);
      await this.humanClick('button[type="submit"]');
    }

    await this.page.waitForTimeout(600);
  }

  async showTitleCard(sceneId: string, title: string, role: string, goal: string) {
    await this.page.evaluate(
      ({ sId, t, r, g }) => {
        if (typeof (window as any).__showSceneTitleCard === 'function') {
          return (window as any).__showSceneTitleCard(sId, t, r, g);
        }
      },
      { sId: sceneId, t: title, r: role, g: goal }
    );
    await this.page.waitForTimeout(2200);
  }
}
