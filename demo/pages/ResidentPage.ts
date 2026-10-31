import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ResidentPage extends BasePage {
  async gotoApp() {
    await this.page.goto('/app');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoActivation() {
    await this.page.goto('/activate');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async activateAccount(flatNumber: string, activationCode: string, newPassword = 'mock_new_resident_pass_123!') {
    await this.humanType('input[name="flatNumber"], input[placeholder*="Flat"]', flatNumber);
    await this.humanType('input[name="activationCode"], input[placeholder*="Activation"]', activationCode);
    await this.humanClick('button[type="submit"]');
    await this.page.waitForTimeout(600);

    const passwordInput = this.page.locator('input[name="password"], input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.humanType('input[name="password"]', newPassword);
      await this.humanType('input[name="confirmPassword"]', newPassword);
      await this.humanClick('button[type="submit"]');
      await this.page.waitForTimeout(600);
    }
  }

  async fileGrievance(title: string, description: string, category: string, isAnonymous = false) {
    await this.page.goto('/app/grievances/new');
    await this.page.waitForLoadState('domcontentloaded');

    if (isAnonymous) {
      const anonToggle = this.page.locator('input[name="isAnonymous"], button:has-text("Anonymous")').first();
      if (await anonToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await anonToggle.click();
      }
    }

    await this.humanType('input[name="title"]', title);
    await this.humanType('textarea[name="description"]', description);

    const catSelect = this.page.locator('select[name="categoryId"]').first();
    if (await catSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await catSelect.selectOption({ label: category });
    }

    await this.humanClick('button[type="submit"]');
    await this.page.waitForTimeout(800);
  }

  async triggerEmergencySos() {
    await this.page.goto('/app/sos');
    await this.page.waitForLoadState('domcontentloaded');

    const sosBtn = this.page.locator('button:has-text("SOS"), button:has-text("EMERGENCY")').first();
    if (await sosBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sosBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async generateVisitorPass(visitorName: string) {
    await this.page.goto('/app/visitors/new');
    await this.page.waitForLoadState('domcontentloaded');

    await this.humanType('input[name="visitorName"], input[name="name"]', visitorName);
    await this.humanClick('button[type="submit"]');
    await this.page.waitForTimeout(600);
  }

  async bookAmenity(amenityName: string) {
    await this.page.goto('/app/amenities');
    await this.page.waitForLoadState('domcontentloaded');

    const bookBtn = this.page.locator(`div:has-text("${amenityName}") button:has-text("Book"), button:has-text("Book Now")`).first();
    if (await bookBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bookBtn.click();
      await this.page.waitForTimeout(600);
    }
  }
}
