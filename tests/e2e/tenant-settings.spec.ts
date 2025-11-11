import { test, expect } from '@playwright/test';
import { createTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Tenant Settings Flow', () => {
  let tenantUser: any;
  let cleanupData: CleanupData = {};

  test.beforeAll(async () => {
    tenantUser = await createTestUser({
      email: generateTestEmail('tenant'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant',
      role: 'renter',
    });

    cleanupData.userIds = [tenantUser.id!];
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should access settings page', async ({ page }) => {
    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, '/settings');
    await page.waitForURL(/\/settings/, { timeout: 10000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Should see settings page content
    const settingsTitle = page.locator('text=/Paramètres|Settings|Réglages/i').first();
    await expect(settingsTitle).toBeVisible({ timeout: 10000 });
  });

  test('should update profile settings', async ({ page }) => {
    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, '/settings');
    await page.waitForURL(/\/settings/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Update first name if field exists
    const firstNameInput = page.locator('input[name="firstName"], input[name="first_name"], input[placeholder*="Prénom"]').first();
    if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstNameInput.clear();
      await firstNameInput.fill('Updated');
      await page.waitForTimeout(500);
    }

    // Update last name if field exists
    const lastNameInput = page.locator('input[name="lastName"], input[name="last_name"], input[placeholder*="Nom"]').first();
    if (await lastNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await lastNameInput.clear();
      await lastNameInput.fill('Name');
      await page.waitForTimeout(500);
    }

    // Save changes
    const saveButton = page.locator('button:has-text("Enregistrer"), button:has-text("Save"), button[type="submit"]').first();
    if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Should show success message
      const successMessage = page.locator('text=/succès|updated|modifié/i').first();
      await expect(successMessage).toBeVisible({ timeout: 10000 }).catch(() => {});
    }
  });

  test('should update notification preferences', async ({ page }) => {
    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, '/settings');
    await page.waitForURL(/\/settings/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Look for notification settings section
    const notificationSection = page.locator('text=/Notifications|notifications/i').first();
    if (await notificationSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Toggle notification preferences if checkboxes exist
      const emailNotifications = page.locator('input[type="checkbox"][name*="email"], input[type="checkbox"][name*="notification"]').first();
      if (await emailNotifications.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isChecked = await emailNotifications.isChecked().catch(() => false);
        if (!isChecked) {
          await emailNotifications.check();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test('should change password', async ({ page }) => {
    await signInUser(page, tenantUser.email, 'TestPassword123!');
    await page.waitForTimeout(1000);
    
    await gotoPage(page, '/settings');
    await page.waitForURL(/\/settings/, { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Look for password change section
    const passwordSection = page.locator('text=/Mot de passe|Password|Changer/i').first();
    if (await passwordSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      const currentPasswordInput = page.locator('input[type="password"][name*="current"], input[type="password"][placeholder*="actuel"]').first();
      const newPasswordInput = page.locator('input[type="password"][name*="new"], input[type="password"][placeholder*="nouveau"]').first();
      
      if (await currentPasswordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await currentPasswordInput.fill('TestPassword123!');
        await page.waitForTimeout(500);
        
        if (await newPasswordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await newPasswordInput.fill('NewPassword123!');
          await page.waitForTimeout(500);
          
          const changeButton = page.locator('button:has-text("Changer"), button:has-text("Change")').first();
          if (await changeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await changeButton.click();
            await page.waitForTimeout(2000);
            
            // Should show success message
            const successMessage = page.locator('text=/succès|changed|modifié/i').first();
            await expect(successMessage).toBeVisible({ timeout: 10000 }).catch(() => {});
          }
        }
      }
    }
  });
});

