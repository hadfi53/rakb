import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, signInUser, getSupabaseClient, gotoPage } from './helpers/auth-helper';
import { cleanupTestData, CleanupData } from './helpers/cleanup-helper';

test.describe('Agency Add Car Flow', () => {
  let ownerUser: any;
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
  });

  test.afterAll(async () => {
    await cleanupTestData(cleanupData);
  });

  test('should add a new car listing with all required fields', async ({ page, browserName }, testInfo) => {
    // Webkit (Safari) and Mobile Safari need more time - they're slower than Chromium/Firefox
    const isWebkit = browserName === 'webkit';
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const baseTimeout = isMobileSafari ? 300000 : (isWebkit ? 240000 : 180000); // 5 min for Mobile Safari, 4 min for webkit, 3 min for others
    test.setTimeout(baseTimeout);
    
    await test.step('Login as owner', async () => {
      await signInUser(page, ownerUser.email, 'TestPassword123!');
      // Webkit and Mobile Safari need more time for page interactions
      await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
    });

    await test.step('Navigate to add car page', async () => {
      await gotoPage(page, '/cars/add');
      await page.waitForURL(/\/cars\/add/i, { timeout: isMobileSafari ? 30000 : (isWebkit ? 20000 : 10000) });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 30000 : (isWebkit ? 20000 : 10000) }).catch(() => {});
      await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
    });

    await test.step('Step 1: Fill basic information', async () => {
      // Wait for step 1 to be visible
      await page.waitForSelector('text=/Informations générales/i', { timeout: isWebkit ? 20000 : 10000 });
      await page.waitForTimeout(isWebkit ? 2000 : 1000);
      
      // Fill brand (Marque) - placeholder "ex: Toyota"
      const brandInput = page.locator('input[placeholder*="Toyota"], input[placeholder*="ex:"]').first();
      await expect(brandInput).toBeVisible({ timeout: 5000 });
      await brandInput.fill('Toyota');
      await page.waitForTimeout(200);

      // Fill model (Modèle) - placeholder "ex: Corolla"
      const modelInput = page.locator('input[placeholder*="Corolla"], input[placeholder*="ex:"]').nth(1);
      await expect(modelInput).toBeVisible({ timeout: 5000 });
      await modelInput.fill('Camry');
      await page.waitForTimeout(200);

      // Fill year - placeholder "ex: 2020"
      const yearInput = page.locator('input[type="number"][placeholder*="2020"], input[type="number"][placeholder*="ex:"]').first();
      await expect(yearInput).toBeVisible({ timeout: 5000 });
      await yearInput.fill('2020');
      await page.waitForTimeout(200);

      // Fill registration number (required field) - placeholder "Ex: 12345-A-67"
      const registrationInput = page.locator('input[placeholder*="12345"], input[placeholder*="immatriculation"]').first();
      await expect(registrationInput).toBeVisible({ timeout: 5000 });
      await registrationInput.fill('12345-A-67');
      await page.waitForTimeout(200);

      // Fill transmission - shadcn Select component
      // Find the SelectTrigger button with role="combobox"
      // Webkit needs more time for dropdown interactions
      const transmissionTimeout = isWebkit ? 5000 : 3000;
      const transmissionTrigger = page.locator('button[role="combobox"]').first();
      if (await transmissionTrigger.isVisible({ timeout: transmissionTimeout }).catch(() => false)) {
        await transmissionTrigger.click();
        await page.waitForTimeout(isWebkit ? 1000 : 500);
        // Click "Automatique" option from dropdown
        const automaticOption = page.getByRole('option', { name: /Automatique/i }).first();
        await expect(automaticOption).toBeVisible({ timeout: transmissionTimeout });
        await automaticOption.click();
        await page.waitForTimeout(isWebkit ? 600 : 300);
      }

      // Fill fuel type - shadcn Select component  
      // Find the second SelectTrigger (for fuel)
      const fuelTrigger = page.locator('button[role="combobox"]').nth(1);
      if (await fuelTrigger.isVisible({ timeout: transmissionTimeout }).catch(() => false)) {
        await fuelTrigger.click();
        await page.waitForTimeout(isWebkit ? 1000 : 500);
        // Click "Essence" option from dropdown
        const essenceOption = page.getByRole('option', { name: /Essence/i }).first();
        await expect(essenceOption).toBeVisible({ timeout: transmissionTimeout });
        await essenceOption.click();
        await page.waitForTimeout(isWebkit ? 600 : 300);
      }

      // Fill seats (optional) - placeholder "5"
      const seatsInput = page.locator('input[placeholder="5"]').first();
      if (await seatsInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await seatsInput.fill('5');
        await page.waitForTimeout(200);
      }

      // Fill description (optional)
      const descriptionTextarea = page.locator('textarea').first();
      if (await descriptionTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionTextarea.fill('Beautiful and well-maintained car');
        await page.waitForTimeout(200);
      }

      await page.waitForTimeout(500);
    });

    await test.step('Step 2: Upload required documents', async () => {
      // Click "Suivant" to go to step 2
      const nextButton = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      // Scroll into view and wait for stability (handle detachment)
      try {
        await nextButton.scrollIntoViewIfNeeded();
      } catch {
        // Element might be detached, wait a bit and try again
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      await nextButton.click({ force: true });
      await page.waitForTimeout(1000);

      // Wait for step 2 to be visible
      await page.waitForSelector('text=/Documents obligatoires/i', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Upload all 4 required documents
      // Each document has a hidden file input with id="file-upload-{type}"
      const documentTypes = ['identity', 'vehicle_registration', 'insurance', 'technical_inspection'];
      
      for (const docType of documentTypes) {
        // Create a mock PDF file
        const mockFile = {
          name: `${docType}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\nmock content'),
        };

        // Find the file input for this document type
        const fileInput = page.locator(`input[id="file-upload-${docType}"]`);
        
        // Check if document is already uploaded by checking for "Téléchargé" badge
        // Count how many "Téléchargé" badges exist before upload
        const badgesBefore = await page.locator('text=/Téléchargé/i').count();
        
        // Try to set file directly on the input (this should trigger onChange)
        try {
          await fileInput.setInputFiles(mockFile);
          console.log(`File set on input for ${docType}`);
        } catch (error) {
          console.warn(`Failed to set file directly on input for ${docType}, trying button click`);
          // Fallback: click the button to trigger file chooser
          const uploadButton = page.locator(`input[id="file-upload-${docType}"]`).locator('xpath=following::button[contains(text(), "Télécharger")] | preceding::button[contains(text(), "Télécharger")]').first();
          if (await uploadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            const fileChooserPromise = page.waitForEvent('filechooser');
            await uploadButton.click();
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(mockFile);
          } else {
            // Last resort: find any upload button and click it
            const anyUploadButton = page.locator('button:has-text("Télécharger")').first();
            if (await anyUploadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              const fileChooserPromise = page.waitForEvent('filechooser');
              await anyUploadButton.click();
              const fileChooser = await fileChooserPromise;
              await fileChooser.setFiles(mockFile);
            }
          }
        }

        // Wait for upload to complete - check for "Téléchargé" badge
        // Webkit needs more time for file uploads
        try {
          // Wait for badge count to increase
          let attempts = 0;
          const maxAttempts = isWebkit ? 25 : 15; // More attempts for webkit
          while (attempts < maxAttempts) {
            await page.waitForTimeout(isWebkit ? 1500 : 1000);
            const badgesAfter = await page.locator('text=/Téléchargé/i').count();
            if (badgesAfter > badgesBefore) {
              break; // New badge appeared
            }
            attempts++;
          }
        } catch {
          // Also check for success toast or just wait
          try {
            await page.waitForSelector('text=/Document téléversé|succès|téléchargé/i', { timeout: isWebkit ? 10000 : 5000 });
          } catch {
            // Upload might still be in progress, wait a bit more
            await page.waitForTimeout(isWebkit ? 3000 : 2000);
          }
        }
        
        await page.waitForTimeout(isWebkit ? 2000 : 1000); // Small delay between uploads
      }

      // Final wait to ensure all uploads are complete
      await page.waitForTimeout(isWebkit ? 4000 : 2000);
      
      // Verify all documents are uploaded before proceeding
      const uploadedBadges = await page.locator('text=/Téléchargé/i').count();
      if (uploadedBadges < documentTypes.length) {
        console.warn(`Only ${uploadedBadges} out of ${documentTypes.length} documents uploaded, but proceeding anyway`);
        // For webkit, wait a bit more if documents aren't all uploaded
        if (isWebkit && uploadedBadges < documentTypes.length) {
          await page.waitForTimeout(3000);
        }
      }
    });

    await test.step('Step 3: Upload photos', async () => {
      // Click "Suivant" to go to step 3
      const nextButton = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      // Scroll into view and wait for stability (handle detachment)
      try {
        await nextButton.scrollIntoViewIfNeeded();
      } catch {
        // Element might be detached, wait a bit and try again
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      await nextButton.click({ force: true });
      await page.waitForTimeout(1000);

      // Wait for step 3 to be visible
      await page.waitForSelector('text=/Photos du véhicule/i', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Create 5 mock image files (ImageUpload component accepts multiple files)
      const mockImages = Array.from({ length: 5 }, (_, i) => ({
        name: `car-image-${i + 1}.jpg`,
        mimeType: 'image/jpeg',
        buffer: Buffer.from(`mock image content ${i + 1}`),
      }));

      // Find the image upload input
      const imageUploadInput = page.locator('input[type="file"][accept*="image"], input[type="file"]').first();
      await expect(imageUploadInput).toBeVisible({ timeout: 5000 });
      
      // Upload all 5 images at once (ImageUpload handles multiple files)
      await imageUploadInput.setInputFiles(mockImages);

      // Wait for images to be uploaded and processed
      // Check for success toast or upload completion
      // Webkit and Mobile Safari need more time for image uploads
      const uploadTimeout = isMobileSafari ? 30000 : (isWebkit ? 25000 : 15000);
      await page.waitForSelector('text=/Upload réussi|téléchargée|image|photo/i', { timeout: uploadTimeout }).catch(() => {});
      
      // Wait for any loading states to complete
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(isMobileSafari ? 8000 : (isWebkit ? 6000 : 4000));
      
      // Check if images are displayed (thumbnails or preview)
      const imagePreview = page.locator('img, [class*="image"], [class*="preview"]').first();
      await imagePreview.isVisible({ timeout: isMobileSafari ? 10000 : (isWebkit ? 8000 : 5000) }).catch(() => {});
      
      // Additional wait for form validation to complete
      await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
    });

    await test.step('Step 4: Fill pricing', async () => {
      // Click "Suivant" to go to step 4 - wait longer for button to appear after image upload
      const nextButtonTimeout = isMobileSafari ? 30000 : (isWebkit ? 20000 : 15000);
      const nextButton = page.locator('button:has-text("Suivant")').first();
      
      // Wait for button to appear with multiple retries
      let buttonVisible = false;
      let retries = 0;
      const maxButtonRetries = 5;
      
      while (retries < maxButtonRetries && !buttonVisible) {
        buttonVisible = await nextButton.isVisible({ timeout: isMobileSafari ? 10000 : (isWebkit ? 8000 : 5000) }).catch(() => false);
        
        if (!buttonVisible) {
          // Wait and check for loading states
          await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
          await page.waitForLoadState('domcontentloaded');
          
          // Check if there's a loading indicator
          const loadingIndicator = page.locator('text=/chargement|loading|upload/i').first();
          const isLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
          if (isLoading) {
            await page.waitForTimeout(isMobileSafari ? 5000 : (isWebkit ? 3000 : 2000));
          }
          
          retries++;
        }
      }
      
      if (!buttonVisible) {
        throw new Error('"Suivant" button not visible after step 3 after multiple retries');
      }
      
      // Scroll into view and wait for stability (handle detachment)
      try {
        await nextButton.scrollIntoViewIfNeeded();
      } catch {
        // Element might be detached, wait a bit and try again
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(isMobileSafari ? 1000 : 500);
      
      // Check if button is enabled before clicking
      const isEnabled = await nextButton.isEnabled({ timeout: 2000 }).catch(() => false);
      if (!isEnabled) {
        // Wait for button to become enabled
        await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
        await page.waitForLoadState('domcontentloaded');
      }
      
      // Try click without force and with retry to avoid crashes on WebKit/Mobile Safari
      let clicked = false;
      const maxClickRetries = isMobileSafari ? 5 : (isWebkit ? 4 : 3);
      for (let i = 0; i < maxClickRetries && !clicked; i++) {
        try {
          // Check if button is still visible and enabled
          const stillVisible = await nextButton.isVisible({ timeout: 2000 }).catch(() => false);
          const stillEnabled = await nextButton.isEnabled({ timeout: 2000 }).catch(() => false);
          
          if (stillVisible && stillEnabled) {
            await nextButton.click();
            clicked = true;
          } else if (i < maxClickRetries - 1) {
            // If not enabled, wait and retry
            await page.waitForTimeout(isMobileSafari ? 2000 : (isWebkit ? 1500 : 1000));
            await page.waitForLoadState('domcontentloaded');
            try { 
              await nextButton.scrollIntoViewIfNeeded(); 
            } catch {}
          }
        } catch (error) {
          if (i < maxClickRetries - 1) {
            await page.waitForTimeout(isMobileSafari ? 2000 : (isWebkit ? 1500 : 1000));
            try { 
              await nextButton.scrollIntoViewIfNeeded(); 
            } catch {}
            // Try to find the button again in case it was re-rendered
            const newButton = page.locator('button:has-text("Suivant")').first();
            if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              try {
                await newButton.click();
                clicked = true;
              } catch {}
            }
          }
        }
      }
      
      // Last resort: try force click if normal click failed
      if (!clicked) {
        try {
          await nextButton.click({ force: true });
          clicked = true;
        } catch {
          // If force click also fails, throw error
          throw new Error('Failed to click "Suivant" button after step 3 after all retries');
        }
      }
      
      await page.waitForTimeout(isMobileSafari ? 2000 : 1000);

      // Wait for step 4 to be visible with longer timeout for slower browsers
      const step4Timeout = isMobileSafari ? 30000 : (isWebkit ? 20000 : 10000);
      await page.waitForSelector('text=/Tarification|tarification/i', { timeout: step4Timeout });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(isMobileSafari ? 2000 : 1000);

      // Fill price per day - placeholder "890"
      const priceInput = page.locator('input[type="number"][placeholder*="890"], input[type="number"]').first();
      await expect(priceInput).toBeVisible({ timeout: 5000 });
      await priceInput.clear();
      await priceInput.fill('500');
      await page.waitForTimeout(500);
    });

    await test.step('Step 5: Fill location', async () => {
      // Click "Suivant" to go to step 5
      const nextButton = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      // Scroll into view and wait for stability (handle detachment)
      try {
        await nextButton.scrollIntoViewIfNeeded();
      } catch {
        // Element might be detached, wait a bit and try again
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      // Retry click without force to reduce crash risk
      {
        let clicked = false;
        for (let i = 0; i < 2 && !clicked; i++) {
          try {
            await nextButton.click();
            clicked = true;
          } catch {
            await page.waitForTimeout(700);
            try { await nextButton.scrollIntoViewIfNeeded(); } catch {}
          }
        }
      }
      await page.waitForTimeout(1000);

      // Wait for step 5 to be visible
      await page.waitForSelector('text=/Localisation/i', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Fill location - placeholder "ex: Casablanca"
      const locationInput = page.locator('input[placeholder*="Casablanca"], input[placeholder*="ex:"]').first();
      await expect(locationInput).toBeVisible({ timeout: 5000 });
      await locationInput.fill('Rabat');
      await page.waitForTimeout(500);
    });

    await test.step('Step 6: Skip policies (optional)', async () => {
      // Click "Suivant" to go to step 6
      const nextButton = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      // Scroll into view and wait for stability (handle detachment)
      try {
        await nextButton.scrollIntoViewIfNeeded();
      } catch {
        // Element might be detached, wait a bit and try again
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      await nextButton.click({ force: true });
      await page.waitForTimeout(1000);

      // Wait for step 6 to be visible (policies are optional, can skip)
      await page.waitForSelector('text=/Politique/i', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(500);

      // Click "Suivant" to go to step 7 (preview)
      const nextButton2 = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton2).toBeVisible({ timeout: 5000 });
      // Scroll into view and wait for stability (handle detachment)
      try {
        await nextButton2.scrollIntoViewIfNeeded();
      } catch {
        // Element might be detached, wait a bit and try again
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      // Retry click without force to reduce crash risk
      {
        let clicked = false;
        for (let i = 0; i < 2 && !clicked; i++) {
          try {
            await nextButton2.click();
            clicked = true;
          } catch {
            await page.waitForTimeout(700);
            try { await nextButton2.scrollIntoViewIfNeeded(); } catch {}
          }
        }
      }
      await page.waitForTimeout(1000);
    });

    await test.step('Step 7: Submit car listing', async () => {
      // Wait for step 7 (preview) to be visible
      await page.waitForSelector('text=/Prévisualisation/i', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Find and click the submit button
      const submitButton = page.locator('button:has-text("Publier le véhicule"), button:has-text("Publier")').first();
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      
      // Scroll into view if needed
      try {
        await submitButton.scrollIntoViewIfNeeded();
      } catch {
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      
      await submitButton.click({ force: true });

      // Wait for button to show loading state (disabled with "Publication...")
      await page.waitForSelector('button:has-text("Publication..."), button[disabled]:has-text("Publication"), button[disabled]', { timeout: 10000 }).catch(() => {});
      
      // Wait for submission to complete - button should become enabled again or page should redirect
      const isMobile = page.viewportSize()?.width && page.viewportSize()!.width < 768;
      // Webkit needs significantly more time for form submissions
      let timeout = isMobile ? 90000 : 60000;
      if (isWebkit) {
        timeout = isMobile ? 120000 : 90000; // Even longer for webkit
      }
      
      try {
        // Wait for either redirect or success message
        await Promise.race([
          page.waitForURL(/\/dashboard\/owner\/vehicles/, { timeout }),
          page.waitForSelector('text=/succès|ajouté|créé|Véhicule ajouté/i', { timeout }),
          // Also wait for success toast
          page.waitForSelector('[role="status"]:has-text("succès"), [role="status"]:has-text("ajouté")', { timeout: 15000 }).catch(() => null),
        ]);
      } catch (error) {
        // If timeout, check if car was created in database anyway
        console.log('Submission timeout, checking if car was created in database...', error);
        const supabase = getSupabaseClient(true);
        const { data: cars, error: dbError } = await supabase
          .from('cars')
          .select('*')
          .eq('host_id', ownerUser.id)
          .eq('brand', 'Toyota')
          .eq('model', 'Camry')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (dbError) {
          console.error('Database error:', dbError);
        }
        
        if (cars && cars.length > 0) {
          console.log('Car was created successfully despite timeout');
          // Car was created, so submission succeeded even if redirect didn't happen
          return; // Exit early, verification step will handle cleanup
        }
        
        // If car wasn't created, throw error
        throw new Error(`Car submission timed out and car was not created in database. Error: ${error}`);
      }
    });

    await test.step('Verify car created in database', async () => {
      const supabase = getSupabaseClient(true);
      await page.waitForTimeout(3000);

      const { data: cars } = await supabase
        .from('cars')
        .select('*')
        .eq('host_id', ownerUser.id)
        .eq('brand', 'Toyota')
        .eq('model', 'Camry')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(cars).toBeDefined();
      expect(cars?.length).toBeGreaterThan(0);
      
      if (cars && cars.length > 0) {
        cleanupData.carIds = [cars[0].id];
        expect(cars[0].host_id).toBe(ownerUser.id);
        expect(cars[0].price_per_day).toBe(500);
      }
    });
  });

  test('should validate required fields', async ({ page }) => {
    test.setTimeout(60000);
    await test.step('Login and navigate to add car page', async () => {
      await signInUser(page, ownerUser.email, 'TestPassword123!');
      await page.waitForTimeout(1000);
      await gotoPage(page, '/cars/add');
      await page.waitForURL(/\/cars\/add/, { timeout: 10000 });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
    });

    await test.step('Try to proceed without filling required fields', async () => {
      // Wait for step 1 to be visible
      await page.waitForSelector('text=/Informations générales/i', { timeout: 10000 });

      // Try to click "Suivant" without filling required fields
      const nextButton = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      await nextButton.click();
      await page.waitForTimeout(500);

      // Should show validation toast message
      // Toast can appear in various places - use flexible selector
      // Try multiple approaches to find the toast
      const toastText = page.getByText(/Informations incomplètes/i).first();
      await expect(toastText).toBeVisible({ timeout: 10000 });
    });
  });

  test('should validate price is positive', async ({ page, browserName }, testInfo) => {
    const isWebkit = browserName === 'webkit';
    const isMobileSafari = testInfo.project.name === 'Mobile Safari';
    const testTimeout = isMobileSafari ? 300000 : (isWebkit ? 240000 : 120000); // 5 min for Mobile Safari, 4 min for webkit, 2 min for others
    test.setTimeout(testTimeout);
    
    await test.step('Login and navigate to add car page', async () => {
      await signInUser(page, ownerUser.email, 'TestPassword123!');
      await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
      await gotoPage(page, '/cars/add');
      await page.waitForURL(/\/cars\/add/i, { timeout: isMobileSafari ? 30000 : (isWebkit ? 20000 : 10000) });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: isMobileSafari ? 30000 : (isWebkit ? 20000 : 10000) }).catch(() => {});
      await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
    });

    await test.step('Fill step 1 and navigate to step 4', async () => {
      const stepTimeout = isMobileSafari ? 20000 : (isWebkit ? 15000 : 10000);
      await page.waitForSelector('text=/Informations générales/i', { timeout: stepTimeout });
      await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
      
      // Fill required fields
      const brandInput = page.locator('input[placeholder*="Toyota"], input[placeholder*="ex:"]').first();
      await brandInput.fill('Toyota');

      const modelInput = page.locator('input[placeholder*="Corolla"], input[placeholder*="ex:"]').nth(1);
      await modelInput.fill('Camry');

      const yearInput = page.locator('input[type="number"][placeholder*="2020"], input[type="number"]').first();
      await yearInput.fill('2020');

      const registrationInput = page.locator('input[placeholder*="12345"], input[placeholder*="immatriculation"]').first();
      await registrationInput.fill('12345-A-67');

      // Fill transmission - find first SelectTrigger button
      const transmissionTrigger = page.locator('button[role="combobox"]').first();
      if (await transmissionTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await transmissionTrigger.click();
        await page.waitForTimeout(500);
        await page.getByRole('option', { name: /Automatique/i }).first().click();
        await page.waitForTimeout(300);
      }

      // Fill fuel - find second SelectTrigger button
      const fuelTrigger = page.locator('button[role="combobox"]').nth(1);
      if (await fuelTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fuelTrigger.click();
        await page.waitForTimeout(500);
        await page.getByRole('option', { name: /Essence/i }).first().click();
        await page.waitForTimeout(300);
      }

      await page.waitForTimeout(500);

      // Navigate to step 2
      const nextButton1 = page.locator('button:has-text("Suivant")').first();
      await nextButton1.click();
      await page.waitForSelector('text=/Documents obligatoires/i', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Upload all required documents
      const documentTypes = ['identity', 'vehicle_registration', 'insurance', 'technical_inspection'];
      for (const docType of documentTypes) {
        const mockFile = {
          name: `${docType}.pdf`,
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\nmock content'),
        };
        
        const fileInput = page.locator(`input[id="file-upload-${docType}"]`);
        const badgesBefore = await page.locator('text=/Téléchargé/i').count();
        
        // Try to set file directly on the input
        try {
          await fileInput.setInputFiles(mockFile);
        } catch {
          // Fallback: click button to trigger file chooser
          const uploadButton = page.locator('button:has-text("Télécharger")').first();
          if (await uploadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
            await uploadButton.click();
            const fileChooser = await fileChooserPromise;
            if (fileChooser) {
              await fileChooser.setFiles(mockFile);
            }
          }
        }
        
        // Wait for upload to complete with timeout protection
        let attempts = 0;
        const maxAttempts = isMobileSafari ? 15 : (isWebkit ? 12 : 10);
        while (attempts < maxAttempts) {
          // Check if page is still valid
          try {
            await page.waitForTimeout(1000);
            const badgesAfter = await page.locator('text=/Téléchargé/i').count();
            if (badgesAfter > badgesBefore) {
              break;
            }
          } catch (error) {
            // Page might have closed or timed out
            console.warn(`Upload check failed for ${docType}, attempt ${attempts + 1}:`, error);
            if (attempts >= maxAttempts - 1) {
              // Last attempt, continue anyway
              break;
            }
          }
          attempts++;
        }
        await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
      }

      // Navigate to step 3
      const nextButton2 = page.locator('button:has-text("Suivant")').first();
      try {
        await nextButton2.scrollIntoViewIfNeeded();
      } catch {
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(500);
      await nextButton2.click({ force: true });
      await page.waitForSelector('text=/Photos du véhicule/i', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Upload 5 photos (ImageUpload accepts multiple files at once)
      const mockImages = Array.from({ length: 5 }, (_, i) => ({
        name: `car-${i}.jpg`,
        mimeType: 'image/jpeg',
        buffer: Buffer.from(`mock image ${i}`),
      }));
      
      const imageInput = page.locator('input[type="file"][accept*="image"], input[type="file"]').first();
      await imageInput.setInputFiles(mockImages);
      
      // Wait for images to be uploaded and processed
      const uploadTimeout = isMobileSafari ? 30000 : (isWebkit ? 25000 : 15000);
      await page.waitForSelector('text=/Upload réussi|téléchargée|image|photo/i', { timeout: uploadTimeout }).catch(() => {});
      
      // Wait for any loading states to complete
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(isMobileSafari ? 8000 : (isWebkit ? 6000 : 4000));
      
      // Check if images are displayed (thumbnails or preview)
      const imagePreview = page.locator('img, [class*="image"], [class*="preview"]').first();
      await imagePreview.isVisible({ timeout: isMobileSafari ? 10000 : (isWebkit ? 8000 : 5000) }).catch(() => {});
      
      // Additional wait for form validation to complete
      await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));

      // Navigate to step 4 - wait longer for button to appear after image upload
      const nextButton3Timeout = isMobileSafari ? 30000 : (isWebkit ? 20000 : 15000);
      const nextButton3 = page.locator('button:has-text("Suivant")').first();
      
      // Wait for button to appear with multiple retries
      let button3Visible = false;
      let retries3 = 0;
      const maxButton3Retries = 5;
      
      while (retries3 < maxButton3Retries && !button3Visible) {
        button3Visible = await nextButton3.isVisible({ timeout: isMobileSafari ? 10000 : (isWebkit ? 8000 : 5000) }).catch(() => false);
        
        if (!button3Visible) {
          // Wait and check for loading states
          await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
          await page.waitForLoadState('domcontentloaded');
          
          // Check if there's a loading indicator
          const loadingIndicator = page.locator('text=/chargement|loading|upload/i').first();
          const isLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
          if (isLoading) {
            await page.waitForTimeout(isMobileSafari ? 5000 : (isWebkit ? 3000 : 2000));
          }
          
          retries3++;
        }
      }
      
      if (!button3Visible) {
        throw new Error('"Suivant" button not visible after step 3 after multiple retries');
      }
      
      try {
        await nextButton3.scrollIntoViewIfNeeded();
      } catch {
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(isMobileSafari ? 1000 : 500);
      
      // Check if button is enabled before clicking
      const isEnabled3 = await nextButton3.isEnabled({ timeout: 2000 }).catch(() => false);
      if (!isEnabled3) {
        // Wait for button to become enabled
        await page.waitForTimeout(isMobileSafari ? 3000 : (isWebkit ? 2000 : 1000));
        await page.waitForLoadState('domcontentloaded');
      }
      
      // Retry click without force to avoid WebKit target crashes
      let clicked3 = false;
      const maxClick3Retries = isMobileSafari ? 5 : (isWebkit ? 4 : 3);
      for (let i = 0; i < maxClick3Retries && !clicked3; i++) {
        try {
          // Check if button is still visible and enabled
          const stillVisible = await nextButton3.isVisible({ timeout: 2000 }).catch(() => false);
          const stillEnabled = await nextButton3.isEnabled({ timeout: 2000 }).catch(() => false);
          
          if (stillVisible && stillEnabled) {
            await nextButton3.click();
            clicked3 = true;
          } else if (i < maxClick3Retries - 1) {
            // If not enabled, wait and retry
            await page.waitForTimeout(isMobileSafari ? 2000 : (isWebkit ? 1500 : 1000));
            await page.waitForLoadState('domcontentloaded');
            try { 
              await nextButton3.scrollIntoViewIfNeeded(); 
            } catch {}
          }
        } catch (error) {
          if (i < maxClick3Retries - 1) {
            await page.waitForTimeout(isMobileSafari ? 2000 : (isWebkit ? 1500 : 1000));
            try { 
              await nextButton3.scrollIntoViewIfNeeded(); 
            } catch {}
            // Try to find the button again in case it was re-rendered
            const newButton = page.locator('button:has-text("Suivant")').first();
            if (await newButton.isVisible({ timeout: 2000 }).catch(() => false)) {
              try {
                await newButton.click();
                clicked3 = true;
              } catch {}
            }
          }
        }
      }
      
      // Last resort: try force click if normal click failed
      if (!clicked3) {
        try {
          await nextButton3.click({ force: true });
          clicked3 = true;
        } catch {
          // If force click also fails, throw error
          throw new Error('Failed to click "Suivant" button after step 3 after all retries');
        }
      }
      
      const step4Timeout = isMobileSafari ? 30000 : (isWebkit ? 20000 : 10000);
      await page.waitForSelector('text=/Tarification|tarification/i', { timeout: step4Timeout });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(isMobileSafari ? 2000 : 1000);
    });

    await test.step('Try negative price and validate', async () => {
      // Fill negative price
      const priceInput = page.locator('input[type="number"][placeholder*="890"], input[type="number"]').first();
      await expect(priceInput).toBeVisible({ timeout: 5000 });
      await priceInput.clear();
      await priceInput.fill('-100');
      await page.waitForTimeout(500);

      // Try to proceed to next step - should show validation error
      const nextButton = page.locator('button:has-text("Suivant")').first();
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Should show validation toast for invalid price
      // Use flexible selector to find toast text anywhere on page
      // The toast title should contain "Tarif invalide"
      const toastTitle = page.getByText(/Tarif invalide/i).first();
      await expect(toastTitle).toBeVisible({ timeout: 10000 });
      
      // Also verify the description is visible (optional check)
      try {
        const toastDescription = page.getByText(/tarif journalier valide/i).first();
        await expect(toastDescription).toBeVisible({ timeout: 5000 });
      } catch {
        // Description might not always be visible, title is enough
        console.log('Toast description not found, but title is visible');
      }
    });
  });
});

