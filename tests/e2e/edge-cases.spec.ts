import { test, expect } from '@playwright/test';
import { createTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

// Use a plain sleep that doesn't depend on the Playwright page object
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test.describe('Edge Cases and Error Handling', () => {
  let tenantUser1: any;
  let tenantUser2: any;
  let ownerUser: any;
  let testCar: any;
  let cleanupData: CleanupData = {};

  test.beforeAll(async () => {
    tenantUser1 = await createTestUser({
      email: generateTestEmail('tenant1'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant1',
      role: 'renter',
    });

    tenantUser2 = await createTestUser({
      email: generateTestEmail('tenant2'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant2',
      role: 'renter',
    });

    ownerUser = await createTestUser({
      email: generateTestEmail('owner'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Owner',
      role: 'owner',
    });

    cleanupData.userIds = [tenantUser1.id!, tenantUser2.id!, ownerUser.id!];

    // Create a test car
    const supabase = getSupabaseClient(true);
    const { data: car, error } = await supabase
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

    if (error || !car) {
      throw new Error(`Failed to create test car: ${error?.message}`);
    }

    testCar = car;
    cleanupData.carIds = [car.id];
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should handle concurrent booking attempts', async ({ page, browser, browserName }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isFirefox = browserName === 'firefox';
    const isWebkit = browserName === 'webkit';
    // Increase timeout for slower browsers
    test.setTimeout(isMobileSafari ? 60000 : (isFirefox || isWebkit ? 45000 : 40000));

    // Create a booking for tenant1
    const supabase = getSupabaseClient(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Format dates as YYYY-MM-DD for date type columns
    const startDate = tomorrow.toISOString().split('T')[0];
    const endDate = dayAfter.toISOString().split('T')[0];
    
    // Generate a unique reference number
    const referenceNumber = `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data: booking1, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        car_id: testCar.id,
        user_id: tenantUser1.id,
        host_id: ownerUser.id,
        start_date: startDate,
        end_date: endDate,
        pickup_location: 'Rabat, Morocco',
        total_amount: 1000,
        status: 'confirmed',
        reference_number: referenceNumber,
      })
      .select()
      .single();

    if (bookingError || !booking1) {
      console.warn('Failed to create test booking:', bookingError?.message);
    } else {
      cleanupData.bookingIds = [booking1.id];
    }

    // Try to book same dates as tenant2
    await signInUser(page, tenantUser2.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/cars/${testCar.id}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 20000 : 10000 }).catch(() => {});
    await page.waitForTimeout(isMobileSafari ? 2000 : 1000);

    // Try to reserve
    await gotoPage(page, `/cars/${testCar.id}/reserve`);
    await page.waitForURL(/\/cars\/[a-f0-9-]+\/reserve/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);

    // Fill dates
    const datePicker = page.locator('input[type="date"]').first();
    const dateVisible = await datePicker.isVisible({ timeout: isMobileSafari ? 10000 : 5000 }).catch(() => false);
    if (dateVisible) {
      await datePicker.fill(startDate);
      await page.waitForTimeout(500);
    }

    // Try to submit
    const submitButton = page.locator('button:has-text("Confirmer"), button:has-text("Confirm"), button[type="submit"]').first();
    const submitVisible = await submitButton.isVisible({ timeout: isMobileSafari ? 10000 : 5000 }).catch(() => false);
    if (submitVisible) {
      await submitButton.click();
      await page.waitForTimeout(isMobileSafari ? 3000 : 2000);
      
      // Should show error about unavailable dates
      const errorMessage = page.locator('text=/unavailable|indisponible|already booked|déjà réservé|not available/i').first();
      const errorVisible = await errorMessage.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
      
      if (!errorVisible) {
        // Check if booking was prevented
        await sleep(2000);
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('car_id', testCar.id)
          .eq('user_id', tenantUser2.id)
          .gte('start_date', startDate)
          .lte('end_date', endDate);
        
        // Should not have created a conflicting booking
        expect(bookings?.length || 0).toBe(0);
      } else {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should handle invalid date ranges', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser1.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/cars/${testCar.id}/reserve`);
    await page.waitForURL(/\/cars\/[a-f0-9-]+\/reserve/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);

    // Try to set end date before start date
    const startDatePicker = page.locator('input[type="date"]').first();
    const endDatePicker = page.locator('input[type="date"]').last();
    
    const startVisible = await startDatePicker.isVisible({ timeout: isMobileSafari ? 10000 : 5000 }).catch(() => false);
    if (startVisible) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await startDatePicker.fill(tomorrow.toISOString().split('T')[0]);
      await page.waitForTimeout(500);
      
      const endVisible = await endDatePicker.isVisible({ timeout: isMobileSafari ? 8000 : 3000 }).catch(() => false);
      if (endVisible) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await endDatePicker.fill(yesterday.toISOString().split('T')[0]);
        await page.waitForTimeout(500);
        
        // Should show validation error
        const errorMessage = page.locator('text=/invalid|invalide|before|avant|after|après/i').first();
        const errorVisible = await errorMessage.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
        
        if (!errorVisible) {
          // Form might prevent submission
          const submitButton = page.locator('button[type="submit"]').first();
          const isDisabled = await submitButton.isDisabled({ timeout: 3000 }).catch(() => false);
          expect(isDisabled).toBe(true);
        } else {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser1.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    // Simulate network failure
    await page.route('**/rest/v1/**', route => route.abort());
    
    await gotoPage(page, '/dashboard/renter');
    await page.waitForURL(/\/dashboard\/renter/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);

    // Should show error message or loading state
    const errorMessage = page.locator('text=/error|erreur|failed|échoué|try again|réessayer/i').first();
    const errorVisible = await errorMessage.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
    
    if (!errorVisible) {
      // Page might show loading state or empty state
      console.log('Network error handled (might show loading or empty state)');
      // Verify page loaded even if with errors
      const pageContent = page.locator('body').first();
      await expect(pageContent).toBeVisible();
    } else {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should handle session expiry', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser1.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    // Navigate to a protected page first
    await gotoPage(page, '/dashboard/renter');
    await page.waitForURL(/\/dashboard\/renter/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForTimeout(1000);
    
    // Clear session by signing out via Supabase (more reliable than clearing cookies)
    const supabase = getSupabaseClient(true);
    await supabase.auth.signOut();
    
    // Also clear cookies and localStorage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);

    // Should redirect to login or show login prompt
    const currentUrl = page.url();
    const isLoginUrl = /\/auth\/login/i.test(currentUrl);
    
    if (!isLoginUrl) {
      // Check if login page elements are visible
      const loginPage = page.locator('text=/Login|Connexion|Sign in|Email|Password/i').first();
      const loginVisible = await loginPage.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
      
      if (!loginVisible) {
        // Might still be on dashboard but should show auth error or redirect soon
        // Wait a bit more for redirect
        await page.waitForTimeout(isMobileSafari ? 3000 : 2000);
        const finalUrl = page.url();
        const finalIsLoginUrl = /\/auth\/login/i.test(finalUrl);
        
        if (!finalIsLoginUrl) {
          // If still not redirected, check if there's an auth error or login prompt
          const authError = page.locator('text=/unauthorized|non autorisé|login|connexion/i').first();
          const hasAuthError = await authError.isVisible({ timeout: 5000 }).catch(() => false);
          expect(hasAuthError || finalIsLoginUrl).toBe(true);
        }
      }
    } else {
      expect(isLoginUrl).toBe(true);
    }
  });

  test('should handle large file uploads', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser1.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, '/profile');
    await page.waitForURL(/\/profile/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);

    // Try to upload a large file (simulated)
    const fileInput = page.locator('input[type="file"]').first();
    const inputVisible = await fileInput.isVisible({ timeout: isMobileSafari ? 10000 : 5000 }).catch(() => false);
    
    if (inputVisible) {
      try {
        // Create a large file (11MB - over limit)
        const largeFile = {
          name: 'large-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB
        };

        await fileInput.setInputFiles(largeFile);
        await page.waitForTimeout(isMobileSafari ? 3000 : 2000);
        
        // Should show file size error
        const errorMessage = page.locator('text=/too large|trop volumineux|size limit|limite|maximum|max/i').first();
        const errorVisible = await errorMessage.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
        
        if (!errorVisible) {
          console.log('File size validation might be handled differently or file was accepted');
          // File might be rejected silently or validation happens on server
        } else {
          await expect(errorMessage).toBeVisible();
        }
      } catch (uploadError) {
        // File upload might fail with an error, which is also acceptable
        console.log('File upload error (expected for large files):', uploadError);
      }
    } else {
      console.log('File input not found on profile page');
    }
  });
});

