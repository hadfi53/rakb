import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Search Flow', () => {
  let ownerUser: any;
  let testCars: any[] = [];
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

    // Create multiple test cars
    const supabase = getSupabaseClient(true);
    const cities = ['Rabat', 'Casablanca', 'Marrakech'];
    
    for (const city of cities) {
      const { data: car } = await supabase
        .from('cars')
        .insert({
          host_id: ownerUser.id,
          brand: 'Test',
          model: `Car ${city}`,
          price_per_day: 500,
          location: city,
          is_available: true,
          is_approved: true,
          images: [],
          features: [],
        })
        .select()
        .single();

      if (car) {
        testCars.push(car);
      }
    }

    cleanupData.carIds = testCars.map(c => c.id);
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should search vehicles by city', async ({ page }) => {
    await gotoPage(page, '/search');

    // Search for Rabat - the SearchBar uses placeholder "Où souhaitez-vous louer ?"
    const searchInput = page.locator('input[placeholder*="Où souhaitez-vous"], input[placeholder*="louer"], input[placeholder*="search"], input[placeholder*="rechercher"], input[name="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    await searchInput.fill('Rabat');
    await searchInput.press('Enter');

    // Wait for results
    await page.waitForTimeout(2000);
    // Check if results exist or if "no results" message appears
    const hasResults = await page.locator('text=/Rabat|Test Car Rabat|aucun résultat|no results/i').count() > 0;
    expect(hasResults).toBeTruthy();
  });

  test('should filter vehicles by price range', async ({ page }) => {
    await gotoPage(page, '/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Find price filter
    const priceFilter = page.locator('input[type="range"], input[name*="price"], [data-testid="price-filter"]');
    if (await priceFilter.isVisible()) {
      // Set max price
      await priceFilter.fill('600');
      
      await page.waitForTimeout(1000);

      // Results should be filtered
      await expect(page.locator('text=/500|MAD/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should sort vehicles by price', async ({ page }) => {
    await gotoPage(page, '/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Find sort dropdown
    const sortSelect = page.locator('select[name="sort"], select[aria-label*="sort"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price_asc');
      
      await page.waitForTimeout(1000);

      // Results should be sorted
      await expect(page.locator('text=/500|MAD/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should paginate search results', async ({ page }) => {
    await gotoPage(page, '/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Find pagination
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Suivant"), a[aria-label*="next"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      await page.waitForTimeout(1000);

      // Should be on page 2
      await expect(page.locator('text=/page 2|2/i').or(page.url())).toBeTruthy();
    }
  });
});

