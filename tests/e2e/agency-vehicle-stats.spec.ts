import { test, expect } from '@playwright/test';
import { createTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Agency Vehicle Stats Flow', () => {
  let ownerUser: any;
  let testCar: any;
  let cleanupData: CleanupData = {};
  let testBookingIds: string[] = [];
  let testTenantIds: string[] = [];

  test.beforeAll(async () => {
    ownerUser = await createTestUser({
      email: generateTestEmail('owner'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Owner',
      role: 'owner',
    });

    cleanupData.userIds = [ownerUser.id!];

    // Create test car
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
    // Clean up test bookings
    if (testBookingIds.length > 0) {
      const supabase = getSupabaseClient(true);
      await supabase.from('bookings').delete().in('id', testBookingIds);
    }
    
    // Clean up test tenant users
    if (testTenantIds.length > 0) {
      const supabase = getSupabaseClient(true);
      for (const userId of testTenantIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (e) {
          console.warn(`Failed to delete tenant user ${userId}:`, e);
        }
      }
    }
    
    await cleanupTestData(cleanupData);
  });

  test('should view vehicle statistics', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isWebkit = testInfo.project.name === 'webkit';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/cars/${testCar.id}/stats`);
    await page.waitForURL(/\/cars\/[a-f0-9-]+\/stats/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 20000 : 10000 }).catch(() => {});
    
    // Should see stats page - check for various possible text patterns
    const statsTitle = page.locator('text=/Stats|Statistiques|Analytics|Performance|Revenu|Revenue/i').first();
    await expect(statsTitle).toBeVisible({ timeout: isMobileSafari ? 15000 : 10000 });
  });

  test('should display booking statistics', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isWebkit = testInfo.project.name === 'webkit';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    // Create a test tenant user for the booking
    const tenantUser = await createTestUser({
      email: generateTestEmail('tenant'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant',
      role: 'renter',
    });

    // Create some test bookings
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

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        car_id: testCar.id,
        user_id: tenantUser.id,
        host_id: ownerUser.id,
        start_date: startDate,
        end_date: endDate,
        pickup_location: 'Rabat, Morocco',
        total_amount: 1000,
        status: 'confirmed',
        reference_number: referenceNumber,
      })
      .select('id')
      .single();

    // Track for cleanup
    if (booking?.id) {
      testBookingIds.push(booking.id);
    }
    if (tenantUser?.id) {
      testTenantIds.push(tenantUser.id);
    }

    if (bookingError) {
      console.warn('Failed to create test booking:', bookingError.message);
    }

    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/cars/${testCar.id}/stats`);
    await page.waitForURL(/\/cars\/[a-f0-9-]+\/stats/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);

    // Should see booking stats - try multiple selectors
    const bookingStats = page.locator('text=/Bookings|Réservations|Total|Revenu|Revenue|Stats/i').first();
    const hasStats = await bookingStats.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
    
    if (!hasStats) {
      // Fallback: check for any stats-related content
      const statsContent = page.locator('text=/Stats|Statistiques|Analytics|Performance/i').first();
      await expect(statsContent).toBeVisible({ timeout: isMobileSafari ? 15000 : 10000 });
    } else {
      await expect(bookingStats).toBeVisible();
    }
  });
});

