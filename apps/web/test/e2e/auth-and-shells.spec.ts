import { test, expect } from '@playwright/test';

test.describe('Role-Based Shell Navigation and Protection Boundaries', () => {
  test('unauthenticated visitor accessing /admin redirects to /login?next=/admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  });

  test('unauthenticated visitor accessing /app redirects to /login?next=/app', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  });

  test('feature flag disables /register-society with 404 when off', async ({ page }) => {
    const response = await page.goto('/register-society');
    expect(response?.status()).toBe(404);
  });

  test('/join route does not exist and returns 404', async ({ page }) => {
    const response = await page.goto('/join');
    expect(response?.status()).toBe(404);
  });

  test('/login page contains accessible form elements and language selector', async ({ page }) => {
    await page.goto('/login');

    // Input fields have associated labels and descriptive IDs
    const usernameInput = page.locator('#login-username');
    await expect(usernameInput).toBeVisible();

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /Sign In|साइन इन/i });
    await expect(submitBtn).toBeVisible();

    // Check language switcher buttons exist (EN & हिन्दी only, no Marathi)
    await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'हिन्दी' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'मराठी' })).toHaveCount(0);
  });

  test('session expired page shows return to login action', async ({ page }) => {
    await page.goto('/session-expired?next=%2Fapp');
    await expect(page.getByText('Session Expired')).toBeVisible();

    const signInBtn = page.getByRole('button', { name: /Sign In Again/i });
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();
    await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
  });
});
