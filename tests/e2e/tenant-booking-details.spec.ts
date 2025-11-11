import { test, expect } from '@playwright/test';
import { createTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Tenant Booking Details Flow', () => {
  let tenantUser: any;
  let ownerUser: any;
  let testCar: any;
  let testBooking: any;
  let cleanupData: CleanupData = {};

  test.beforeAll(async () => {
    tenantUser = await createTestUser({
      email: generateTestEmail('tenant'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant',
      role: 'renter',
    });

    ownerUser = await createTestUser({
      email: generateTestEmail('owner'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Owner',
      role: 'owner',
    });

    cleanupData.userIds = [tenantUser.id!, ownerUser.id!];

    // Create test car and booking
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
      throw new Error(`Failed to create test car: ${carError?.message || 'Unknown error'}`);
    }

    testCar = car;
    cleanupData.carIds = [car.id];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Generate a unique reference number
    const referenceNumber = `RAKB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        car_id: car.id,
        user_id: tenantUser.id,
        host_id: ownerUser.id,
        start_date: tomorrow.toISOString(),
        end_date: dayAfter.toISOString(),
        pickup_location: 'Rabat Center',
        dropoff_location: 'Rabat Center',
        total_amount: 1000,
        caution_amount: 100,
        status: 'confirmed',
        payment_status: 'paid',
        reference_number: referenceNumber,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      throw new Error(`Failed to create test booking: ${bookingError?.message || 'Unknown error'}`);
    }

    testBooking = booking;
    cleanupData.bookingIds = [booking.id];
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should view booking details', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isWebkit = testInfo.project.name === 'webkit';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/bookings/${testBooking.id}`);
    await page.waitForURL(/\/bookings\/[a-f0-9-]+/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 20000 : 10000 }).catch(() => {});
    
    // Should see booking details - check for various possible text patterns
    const bookingDetails = page.locator('text=/Détails|Details|Booking|Réservation|réservation/i').first();
    await expect(bookingDetails).toBeVisible({ timeout: isMobileSafari ? 15000 : 10000 });
  });

  test('should view booking invoice', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isWebkit = testInfo.project.name === 'webkit';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/bookings/${testBooking.id}/invoice`);
    await page.waitForURL(/\/bookings\/[a-f0-9-]+\/invoice/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);
    
    // Should see invoice details - try multiple selectors
    const invoiceTitle = page.locator('text=/Invoice|Facture|Facture/i').first();
    const hasInvoice = await invoiceTitle.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
    
    if (!hasInvoice) {
      // Fallback: check for amount or total
      const amount = page.locator('text=/500|1000|Total|Montant|Prix/i').first();
      await expect(amount).toBeVisible({ timeout: isMobileSafari ? 15000 : 10000 });
    } else {
      await expect(invoiceTitle).toBeVisible();
    }
  });

  test('should view booking receipt', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isWebkit = testInfo.project.name === 'webkit';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/bookings/${testBooking.id}/receipt`);
    await page.waitForURL(/\/bookings\/[a-f0-9-]+\/receipt/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);
    
    // Should see receipt - try multiple selectors
    const receiptTitle = page.locator('text=/Receipt|Reçu|Récépissé/i').first();
    const hasReceipt = await receiptTitle.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
    
    if (!hasReceipt) {
      // Fallback: check for amount or booking reference
      const amount = page.locator('text=/500|1000|Total|Montant|Prix|Reference|Référence/i').first();
      await expect(amount).toBeVisible({ timeout: isMobileSafari ? 15000 : 10000 });
    } else {
      await expect(receiptTitle).toBeVisible();
    }
  });

  test('should view booking contract', async ({ page }, testInfo) => {
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const isWebkit = testInfo.project.name === 'webkit';
    test.setTimeout(isMobileSafari ? 60000 : 30000);

    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, `/bookings/${testBooking.id}/contract`);
    await page.waitForURL(/\/bookings\/[a-f0-9-]+\/contract/i, { timeout: isMobileSafari ? 20000 : 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(isMobileSafari ? 3000 : 2000);
    
    // Should see contract - try multiple selectors
    const contractTitle = page.locator('text=/Contract|Contrat|Agreement|Convention/i').first();
    const hasContract = await contractTitle.isVisible({ timeout: isMobileSafari ? 15000 : 10000 }).catch(() => false);
    
    if (!hasContract) {
      // Fallback: check for booking details or terms
      const bookingInfo = page.locator('text=/Booking|Réservation|Terms|Conditions|Détails/i').first();
      await expect(bookingInfo).toBeVisible({ timeout: isMobileSafari ? 15000 : 10000 });
    } else {
      await expect(contractTitle).toBeVisible();
    }
  });
});

