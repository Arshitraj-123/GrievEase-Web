import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class GuardVendorPage extends BasePage {
  async gotoGuardConsole() {
    await this.page.goto('/guard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoVendorPortal() {
    await this.page.goto('/vendor');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async guardLoginWithPin(pin: string) {
    const pinInput = this.page.locator('input[type="password"], input[name="pin"]').first();
    if (await pinInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.humanType('input[type="password"], input[name="pin"]', pin);
      await this.humanClick('button[type="submit"]');
      await this.page.waitForTimeout(600);
    }
  }

  async verifyVisitorPass(passCode: string) {
    const codeInput = this.page.locator('input[name="passCode"], input[placeholder*="Pass"]').first();
    if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.humanType('input[name="passCode"]', passCode);
      await this.humanClick('button:has-text("Verify"), button[type="submit"]');
      await this.page.waitForTimeout(600);
    }
  }

  async vendorCompleteTask(taskId: string, closureNotes: string) {
    const taskCard = this.page.locator(`text=${taskId}`).first();
    if (await taskCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await taskCard.click();
      await this.page.waitForTimeout(400);

      const notesInput = this.page.locator('textarea[name="notes"]').first();
      if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await this.humanType('textarea[name="notes"]', closureNotes);
      }

      await this.humanClick('button:has-text("Mark Completed"), button:has-text("Complete")');
      await this.page.waitForTimeout(600);
    }
  }
}
