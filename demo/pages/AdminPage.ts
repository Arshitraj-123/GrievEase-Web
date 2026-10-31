import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  async gotoAdminDashboard() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoGrievances() {
    await this.page.goto('/admin/grievances');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoEscalationMonitor() {
    await this.page.goto('/admin/escalation');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoUsers() {
    await this.page.goto('/admin/directory');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoAnalytics() {
    await this.page.goto('/admin/analytics');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoNotices() {
    await this.page.goto('/admin/notices');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoBilling() {
    await this.page.goto('/admin/billing');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoSecurityDesk() {
    await this.page.goto('/admin/guards');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async acknowledgeGrievance() {
    const ackBtn = this.page.locator('button:has-text("Acknowledge"), button:has-text("स्वीकार करें")').first();
    if (await ackBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ackBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async recordCashPayment(flatNumber: string, amount: string) {
    await this.page.goto('/admin/billing/collect');
    await this.page.waitForLoadState('domcontentloaded');

    const flatInput = this.page.locator('input[placeholder*="Flat"], select[name="flatId"]').first();
    if (await flatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.humanType('input[placeholder*="Flat"]', flatNumber);
      await this.humanType('input[name="amount"]', amount);
      await this.humanClick('button[type="submit"]');
      await this.page.waitForTimeout(600);
    }
  }

  async publishNotice(title: string, body: string, isEmergency = false) {
    await this.page.goto('/admin/notices/new');
    await this.page.waitForLoadState('domcontentloaded');

    await this.humanType('input[name="title_en"], input[name="title"]', title);
    await this.humanType('textarea[name="body_en"], textarea[name="body"]', body);

    if (isEmergency) {
      const emergencyCheckbox = this.page.locator('input[type="checkbox"][name*="emergency"], input[type="radio"][value="EMERGENCY"]').first();
      if (await emergencyCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emergencyCheckbox.check();
      }
    }

    await this.humanClick('button[type="submit"]');
    await this.page.waitForTimeout(800);
  }
}
