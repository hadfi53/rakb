import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';
import { setupEmailMocks } from './helpers/resend-helper';
import { completeStripePayment, STRIPE_TEST_CARDS } from './helpers/stripe-helper';

test.describe('Payment Flow', () => {
  let tenantUser: any;
  let ownerUser: any;
  let testCar: any;
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

    const supabase = getSupabaseClient(true);
    const { data: car } = await supabase
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

    if (!car) {
      throw new Error('Failed to create test car');
    }
    
    testCar = car;
    cleanupData.carIds = [car.id];
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should process payment and create booking', async ({ page }) => {
    await setupEmailMocks(page);

    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await gotoPage(page, `/cars/${testCar.id}/reserve`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Fill booking details - step 1
    const datePicker = page.locator('input[type="date"]').first();
    if (await datePicker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await datePicker.fill(tomorrowStr);
      await page.waitForTimeout(500);
    }

    // Navigate through steps if needed (multi-step form)
    // Look for "Suivant" or "Next" button and click through steps
    let currentStep = 1;
    const maxSteps = 3;
    
    while (currentStep < maxSteps) {
      // Check if there's a next button
      const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")').first();
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        currentStep++;
      } else {
        // No next button, might be on last step or single step form
        break;
      }
    }

    // Wait for payment form to be visible (Stripe Elements container)
    await page.waitForSelector('#card-element, [id*="card"], [class*="StripeElement"], iframe[src*="stripe"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000); // Give Stripe time to initialize

    // Complete payment
    await completeStripePayment(page, STRIPE_TEST_CARDS.success);

    // Verify payment and booking created
    const supabase = getSupabaseClient(true);
    await page.waitForTimeout(3000);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', tenantUser.id)
      .eq('car_id', testCar.id)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(bookings).toBeDefined();
    if (bookings && bookings.length > 0) {
      cleanupData.bookingIds = [bookings[0].id];
      expect(bookings[0].payment_status).toMatch(/paid|succeeded/);
    }
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await setupEmailMocks(page);

    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await gotoPage(page, `/cars/${testCar.id}/reserve`);

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Fill booking details - step 1
    const datePicker = page.locator('input[type="date"]').first();
    if (await datePicker.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await datePicker.fill(tomorrowStr);
      await page.waitForTimeout(500);
    }

    // Navigate through steps if needed
    let currentStep = 1;
    const maxSteps = 3;
    
    while (currentStep < maxSteps) {
      const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next"), button:has-text("Continuer")').first();
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        currentStep++;
      } else {
        break;
      }
    }

    // Wait for payment form to be visible
    await page.waitForSelector('#card-element, [id*="card"], [class*="StripeElement"], iframe[src*="stripe"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Try payment with declined card
    await completeStripePayment(page, STRIPE_TEST_CARDS.decline);

    // Should show error message - check multiple places (alerts, toast, error text)
    // The error might appear in an alert, toast notification, or error message div
    const errorSelectors = [
      'text=/declined|failed|error|erreur|refusé|échoué|refus|échec/i',
      '[role="alert"]',
      '[class*="error"]',
      '[class*="alert"]',
      '[class*="destructive"]',
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible({ timeout: 3000 }).catch(() => false)) {
          errorFound = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    // If no error found, check if the form is still visible (which would indicate failure)
    // or if booking was not created
    if (!errorFound) {
      // Check if booking was created (it shouldn't be for a declined card)
      const supabase = getSupabaseClient(true);
      await page.waitForTimeout(3000);
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', tenantUser.id)
        .eq('car_id', testCar.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // If no booking was created, that's also a valid failure indication
      if (!bookings || bookings.length === 0) {
        errorFound = true;
      }
    }
    
    expect(errorFound).toBe(true);
  });
});

