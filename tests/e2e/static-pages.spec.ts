import { test, expect } from '@playwright/test';

test.describe('Static Pages', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should load about page', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const aboutTitle = page.locator('text=/About|À propos/i').first();
    await expect(aboutTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load how it works page', async ({ page }) => {
    await page.goto('/how-it-works');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const howItWorksTitle = page.locator('text=/How it works|Comment ça marche/i').first();
    await expect(howItWorksTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load contact page', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const contactTitle = page.locator('text=/Contact|Contacter/i').first();
    await expect(contactTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load FAQ page', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const faqTitle = page.locator('text=/FAQ|Questions|Frequently/i').first();
    await expect(faqTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load help page', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const helpTitle = page.locator('text=/Help|Aide|Support/i').first();
    await expect(helpTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load privacy policy page', async ({ page }) => {
    await page.goto('/legal/privacy');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const privacyTitle = page.locator('text=/Privacy|Confidentialité|Politique/i').first();
    await expect(privacyTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load terms and conditions page', async ({ page }) => {
    await page.goto('/legal');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const legalTitle = page.locator('text=/Legal|Légal|Terms|Conditions/i').first();
    await expect(legalTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load insurance page', async ({ page }) => {
    await page.goto('/legal/insurance');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const insuranceTitle = page.locator('text=/Insurance|Assurance/i').first();
    await expect(insuranceTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const pricingTitle = page.locator('text=/Pricing|Tarifs|Prix/i').first();
    await expect(pricingTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load blog page', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const blogTitle = page.locator('text=/Blog|Articles/i').first();
    await expect(blogTitle).toBeVisible({ timeout: 10000 });
  });

  test('should load emergency page', async ({ page }) => {
    await page.goto('/emergency');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    const emergencyTitle = page.locator('text=/Emergency|Urgence|Help/i').first();
    await expect(emergencyTitle).toBeVisible({ timeout: 10000 });
  });
});

