import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Agency Dashboard Flow', () => {
  let ownerUser: any;
  let testCar: any;
  let cleanupData: CleanupData = {};

  test.beforeAll(async () => {
    ownerUser = await createTestUser({
      email: generateTestEmail('owner'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Owner',
      role: 'owner',
    });

    cleanupData.userIds = [ownerUser.id!];

    // Ensure the user is verified as host (should be done by createTestUser, but double-check)
    const supabase = getSupabaseClient(true);
    const { error: verifyError } = await supabase
      .from('profiles')
      .update({ verified_host: true })
      .eq('id', ownerUser.id);
    
    if (verifyError) {
      console.warn('Failed to verify host status:', verifyError);
    }

    // Create test car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .insert({
        host_id: ownerUser.id,
        brand: 'Test',
        model: 'Car',
        price_per_day: 500,
        location: 'Rabat',
        is_available: true,
        is_approved: true,
        images: [],
        features: [],
      })
      .select()
      .single();

    if (carError || !car) {
      console.error('Car creation error:', carError);
      throw new Error(`Failed to create test car: ${carError?.message || 'Unknown error'}`);
    }
    
    testCar = car;
    cleanupData.carIds = [car.id];
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should display owner dashboard with overview', async ({ page, browserName }, testInfo) => {
    // Mobile Safari needs more time - detect by project name
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 90000 : 60000);
    
    await test.step('Login as owner', async () => {
      await signInUser(page, ownerUser.email, 'TestPassword123!');
      // Wait a bit for auth state to settle - longer for Mobile Safari
      await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
    });

    await test.step('Navigate to owner dashboard', async () => {
      await gotoPage(page, '/dashboard/owner');
      // Wait for page to fully load and any redirects to complete
      await page.waitForURL(/\/dashboard\/owner/, { timeout: isMobileSafari ? 20000 : 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: isMobileSafari ? 20000 : 10000 });
      await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 20000 : 10000 }).catch(() => {});
      await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
    });

    await test.step('Verify dashboard elements', async () => {
      // Should show dashboard title "Tableau de bord" - longer timeout for Mobile Safari
      await expect(
        page.locator('text=/Tableau de bord|tableau de bord/i').first()
      ).toBeVisible({ timeout: isMobileSafari ? 20000 : 10000 });
    });

    await test.step('Verify stats/metrics displayed', async () => {
      // Should show stats cards with "Revenus" or "En route" - longer timeout for Mobile Safari
      await expect(
        page.locator('text=/Revenus|revenus|En route|en route/i').first()
      ).toBeVisible({ timeout: isMobileSafari ? 20000 : 10000 });
    });
  });

  test('should display vehicle listings', async ({ page, browserName }, testInfo) => {
    // Mobile Safari needs significantly more time - detect by project name
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isMobile = page.viewportSize()?.width && page.viewportSize()!.width < 768;
    test.setTimeout(isMobileSafari ? 180000 : 120000); // 3 minutes for Mobile Safari, 2 for others
    
    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
    
    // Use longer timeout for mobile browsers, especially Mobile Safari
    await gotoPage(page, '/dashboard/owner/vehicles', { timeout: isMobileSafari ? 120000 : (isMobile ? 90000 : 60000) });
    
    // Wait for URL with longer timeout for mobile, but don't fail if URL check times out
    // Instead, check for page content which is more reliable
    try {
      await page.waitForURL(/\/dashboard\/owner\/vehicles/, { timeout: isMobileSafari ? 40000 : (isMobile ? 30000 : 10000) });
    } catch {
      // URL check timed out, but page might still be loaded - check content instead
      console.log('URL check timed out, checking page content instead...');
    }
    
    // Wait for page to be ready - Mobile Safari needs more time
    await page.waitForLoadState('domcontentloaded', { timeout: isMobileSafari ? 30000 : 20000 });
    await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 30000 : 20000 }).catch(() => {});
    await page.waitForTimeout(isMobileSafari ? 3000 : 1000);

    // Should show "Mes véhicules" heading - this is the real indicator that page loaded
    // Use longer timeout for mobile, especially Mobile Safari
    await expect(page.locator('text=/Mes véhicules|mes véhicules/i')).toBeVisible({ 
      timeout: isMobileSafari ? 90000 : (isMobile ? 60000 : 20000) 
    });

    // Should show the test car (brand and model - may include year or number)
    // Accept "Test Car", "Test Car 0", "Test Car 2024", etc.
    await expect(page.locator('text=/Test.*Car|Test Car/i')).toBeVisible({ 
      timeout: isMobileSafari ? 60000 : (isMobile ? 30000 : 15000) 
    });
  });

  test('should display bookings list', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
    
    await gotoPage(page, '/dashboard/owner/bookings');
    await page.waitForURL(/\/dashboard\/owner\/bookings/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 20000 : 10000 }).catch(() => {});
    await page.waitForTimeout(isMobileSafari ? 2000 : 1000);

    // Should show "Gestion des Réservations" heading
    await expect(page.locator('text=/Gestion des Réservations|Gestion des réservations/i')).toBeVisible({ timeout: isMobileSafari ? 20000 : 10000 });
  });

  test('should display revenue dashboard', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
    
    await gotoPage(page, '/dashboard/owner/revenue');
    await page.waitForURL(/\/dashboard\/owner\/revenue/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 20000 : 10000 }).catch(() => {});
    await page.waitForTimeout(isMobileSafari ? 2000 : 1000);

    // Should show "Revenus et Finances" heading
    await expect(page.locator('text=/Revenus et Finances|Revenus et finances/i')).toBeVisible({ timeout: isMobileSafari ? 20000 : 10000 });
  });

  test('should verify dashboard data from Supabase', async ({ page, browserName }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isFirefox = browserName === 'firefox';
    const isWebkit = browserName === 'webkit';
    // Increase timeout for slower browsers
    test.setTimeout(isMobileSafari ? 60000 : (isFirefox || isWebkit ? 45000 : 40000));

    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await page.waitForTimeout(isMobileSafari ? 2000 : (isFirefox || isWebkit ? 1500 : 1000));
    
    await gotoPage(page, '/dashboard/owner');
    const urlTimeout = isMobileSafari ? 20000 : (isFirefox || isWebkit ? 15000 : 12000);
    await page.waitForURL(/\/dashboard\/owner/i, { timeout: urlTimeout });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: urlTimeout }).catch(() => {});
    await page.waitForTimeout(isMobileSafari ? 2000 : (isFirefox || isWebkit ? 1500 : 1000));

    // Verify data from database
    const supabase = getSupabaseClient(true);
    
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('host_id', ownerUser.id);

    if (carsError) {
      console.error('Error fetching cars:', carsError);
    }

    expect(cars?.length).toBeGreaterThan(0);

    // Verify dashboard loaded successfully
    await page.waitForTimeout(isMobileSafari ? 3000 : (isFirefox || isWebkit ? 2000 : 1500));
    // Check that dashboard title is visible
    const dashboardTitle = page.locator('text=/Tableau de bord|tableau de bord/i').first();
    const titleTimeout = isMobileSafari ? 20000 : (isFirefox || isWebkit ? 15000 : 12000);
    await expect(dashboardTitle).toBeVisible({ timeout: titleTimeout });
    const titleText = await dashboardTitle.textContent();
    expect(titleText).toBeTruthy();
  });
});

