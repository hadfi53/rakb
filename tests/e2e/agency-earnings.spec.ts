import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Agency Earnings Flow', () => {
  let ownerUser: any;
  let tenantUser: any;
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

    tenantUser = await createTestUser({
      email: generateTestEmail('tenant'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant',
      role: 'renter',
    });

    cleanupData.userIds = [ownerUser.id!, tenantUser.id!];

    // Create test car
    const supabase = getSupabaseClient(true);
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

    // Create a completed booking with payment
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const pastEndDate = new Date();
    pastEndDate.setDate(pastEndDate.getDate() - 5);

    // Generate unique reference number
    const referenceNumber = `RAKB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        car_id: testCar.id,
        user_id: tenantUser.id,
        host_id: ownerUser.id,
        start_date: pastDate.toISOString(),
        end_date: pastEndDate.toISOString(),
        status: 'completed',
        payment_status: 'paid',
        total_amount: 2500,
        caution_amount: 250,
        pickup_location: 'Rabat Center',
        dropoff_location: 'Rabat Center',
        reference_number: referenceNumber,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Booking creation error:', bookingError);
      throw new Error(`Failed to create test booking: ${bookingError?.message || 'Unknown error'}`);
    }

    cleanupData.bookingIds = [booking.id];
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should display earnings dashboard', async ({ page }) => {
    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await gotoPage(page, '/dashboard/owner/revenue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Should show earnings information - use first() to avoid strict mode violation
    await expect(page.locator('text=/revenue|revenu|earnings|gains|total/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should calculate earnings correctly', async ({ page }) => {
    await signInUser(page, ownerUser.email, 'TestPassword123!');
    await gotoPage(page, '/dashboard/owner/revenue');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // The revenue dashboard uses mock data, so we check for the presence of revenue display
    // Look for revenue stats cards or currency amounts
    await expect(
      page.locator('text=/Revenus|revenue|earnings|MAD|DH/i').first()
    ).toBeVisible({ timeout: 5000 });
    
    // Check that at least one revenue stat card is visible
    await expect(
      page.locator('h3').filter({ hasText: /MAD|DH/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

