import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PublicPage extends BasePage {
  async gotoHome() {
    await this.page.goto(this.lang === 'hi' ? '/hi' : '/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoTrack() {
    await this.page.goto('/track');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoTransparency() {
    await this.page.goto('/transparency');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoContact() {
    await this.page.goto('/contact');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async trackComplaint(publicId: string, trackingCode: string) {
    await this.humanType('input[name="publicId"], input[placeholder*="GRV"]', publicId);
    await this.humanType('input[name="trackingCode"], input[placeholder*="Code"]', trackingCode);
    await this.humanClick('button[type="submit"]');
    await this.page.waitForTimeout(600);
  }

  async submitContactInquiry(societyName: string, contactPerson: string, phone: string, email: string) {
    await this.humanType('input[name="societyName"]', societyName);
    await this.humanType('input[name="contactName"], input[name="name"]', contactPerson);
    await this.humanType('input[name="phone"], input[name="mobile"]', phone);
    await this.humanType('input[name="email"]', email);
    await this.humanClick('button[type="submit"]');
    await this.page.waitForTimeout(800);
  }
}
