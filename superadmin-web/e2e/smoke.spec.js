import { test, expect } from '@playwright/test';
test.describe('Superadmin Smoke Tests', () => {
    test('1. landing loads with complete sections and login link', async ({ page }) => {
        await page.goto('/');
        // Check main title / headline
        await expect(page).toHaveTitle(/Naveen Chit|ChitTech/i);
        await expect(page.locator('text=Naveen Chit Fund').first()).toBeVisible();
        // Check "Superadmin Login" CTA button pointing to /chit
        const loginLink = page.locator('a[href="/chit"]').first();
        await expect(loginLink).toBeVisible();
        // Verify key sections are present
        await expect(page.locator('text=Chit Funds Act 1982').first()).toBeVisible();
        await expect(page.locator('text=How a Chit Fund Operates').first()).toBeVisible();
        await expect(page.locator('text=Frequently Asked Questions').first()).toBeVisible();
    });
    test('2. unauthenticated /chit/dashboard redirects to /chit', async ({ page }) => {
        // Clear storage to ensure no session exists
        await page.goto('/chit');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        // Attempt direct access to protected dashboard
        await page.goto('/chit/dashboard');
        // Should be redirected to /chit login screen
        await expect(page).toHaveURL(/\/chit$/);
        await expect(page.locator('text=Superadmin Login')).toBeVisible();
    });
    test('3. /chit rejects wrong password with error banner', async ({ page }) => {
        await page.goto('/chit');
        // Clear inputs and fill invalid credentials
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        await emailInput.fill('admin@naveenchit.com');
        await passwordInput.fill('wrongpassword123');
        // Submit form
        await page.click('button[type="submit"]');
        // Verify error banner is displayed
        const errorBanner = page.locator('text=Invalid email or password');
        await expect(errorBanner).toBeVisible({ timeout: 10000 });
    });
    test('4. /chit accepts seeded credentials and lands on /chit/dashboard', async ({ page }) => {
        await page.goto('/chit');
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        await emailInput.fill('admin@naveenchit.com');
        await passwordInput.fill('12345678');
        // Click submit
        await page.click('button[type="submit"]');
        // Verify transition to dashboard
        await expect(page).toHaveURL(/\/chit\/dashboard/, { timeout: 10000 });
        // Verify dashboard metrics / elements render
        await expect(page.locator('text=Total Assets Under Mgmt').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Monthly Collections').first()).toBeVisible({ timeout: 10000 });
    });
    test('5. sidebar becomes drawer at 375px', async ({ page }) => {
        // Set mobile viewport 375x667
        await page.setViewportSize({ width: 375, height: 667 });
        // Login first to get into dashboard
        await page.goto('/chit');
        await page.locator('input[type="email"]').fill('admin@naveenchit.com');
        await page.locator('input[type="password"]').fill('12345678');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/chit\/dashboard/, { timeout: 10000 });
        const sidebar = page.locator('aside');
        // On 375px, the sidebar has -translate-x-full when closed
        await expect(sidebar).toHaveClass(/-translate-x-full/);
        // Locate hamburger button in topbar and click it
        const hamburgerBtn = page.locator('button[aria-label="Toggle navigation drawer"]');
        await expect(hamburgerBtn).toBeVisible();
        await hamburgerBtn.click();
        // Verify sidebar opens (has translate-x-0)
        await expect(sidebar).toHaveClass(/translate-x-0/);
        // Click the backdrop or close button to dismiss drawer
        const closeBtn = sidebar.locator('button[aria-label="Close navigation drawer"]');
        await closeBtn.click();
        // Verify sidebar closes back to -translate-x-full
        await expect(sidebar).toHaveClass(/-translate-x-full/);
    });

    test('6. desktop sidebar can collapse and expand', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/chit');
        await page.locator('input[type="email"]').fill('admin@naveenchit.com');
        await page.locator('input[type="password"]').fill('12345678');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/chit\/dashboard/, { timeout: 10000 });

        const sidebar = page.locator('aside');
        await expect(sidebar).toHaveClass(/lg:w-64/);

        // Click hamburger button to collapse
        const hamburgerBtn = page.locator('button[aria-label="Toggle navigation drawer"]');
        await hamburgerBtn.click();
        await expect(sidebar).toHaveClass(/lg:w-20/);

        // Click hamburger button again to open/expand
        await hamburgerBtn.click();
        await expect(sidebar).toHaveClass(/lg:w-64/);
    });
});
