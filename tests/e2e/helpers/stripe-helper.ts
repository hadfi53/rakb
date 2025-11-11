import { Page } from '@playwright/test';

/**
 * Mock Stripe test card numbers
 * These are Stripe's official test card numbers
 */
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficientFunds: '4000000000009995',
  requiresAuth: '4000002500003155',
  threeDSecure: '4000002760003184',
} as const;

/**
 * Fill Stripe payment form in the browser
 * Handles both Stripe Elements (iframes) and regular HTML inputs
 */
export const fillStripePaymentForm = async (
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.success,
  expiryDate: string = '12/25',
  cvc: string = '123',
  cardholderName: string = 'Test User',
  zipCode: string = '12345'
): Promise<void> => {
  let cardInputFilled = false;
  let expiryInputFilled = false;
  let cvcInputFilled = false;
  
  // First, try to fill regular HTML inputs (non-Stripe Elements)
  // These are common in simpler payment forms
  try {
    // Card number - try multiple selectors
    const cardInput = page.locator('input#cardNumber, input[name="cardNumber"], input[id*="cardNumber"], input[placeholder*="card" i], input[placeholder*="carte" i]').first();
    if (await cardInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardInput.fill(cardNumber);
      cardInputFilled = true;
      await page.waitForTimeout(500);
    }
  } catch (error) {
    // Continue to Stripe Elements
  }
  
  // Expiry date
  try {
    const expiryInput = page.locator('input#expiry, input[name="expiry"], input[id*="expiry"], input[id*="exp"], input[placeholder*="MM" i], input[placeholder*="expiration" i]').first();
    if (await expiryInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expiryInput.fill(expiryDate);
      expiryInputFilled = true;
      await page.waitForTimeout(500);
    }
  } catch (error) {
    // Continue to Stripe Elements
  }
  
  // CVC
  try {
    const cvcInput = page.locator('input#cvc, input[name="cvc"], input[name="cvv"], input[id*="cvc"], input[placeholder*="CVC" i], input[placeholder*="CVV" i]').first();
    if (await cvcInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cvcInput.fill(cvc);
      cvcInputFilled = true;
      await page.waitForTimeout(500);
    }
  } catch (error) {
    // Continue to Stripe Elements
  }
  
  // If regular inputs weren't found, try Stripe Elements (iframes)
  if (!cardInputFilled || !expiryInputFilled || !cvcInputFilled) {
    // Wait for Stripe Elements container to be present
    const cardElementContainer = page.locator('#card-element, [id*="card"], [class*="StripeElement"]').first();
    await cardElementContainer.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
    
    // Wait for Stripe iframes to load
    await page.waitForTimeout(2000);
    
    // Try to find and fill Stripe Elements using frameLocator
    const stripeFrames = page.frameLocator('iframe[src*="stripe"]');
    
    // Try to fill card number
    if (!cardInputFilled) {
      try {
        const cardInput = stripeFrames.locator('input[name*="cardnumber" i], input[name*="cardNumber" i], input[autocomplete="cc-number"]').first();
        if (await cardInput.count() > 0) {
          await cardInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          await cardInput.fill(cardNumber, { timeout: 5000 });
          cardInputFilled = true;
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Try position-based
      }
    }
    
    // Try to fill expiry date
    if (!expiryInputFilled) {
      try {
        const expiryInput = stripeFrames.locator('input[name*="exp" i], input[autocomplete="cc-exp"]').first();
        if (await expiryInput.count() > 0) {
          await expiryInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          await expiryInput.fill(expiryDate, { timeout: 5000 });
          expiryInputFilled = true;
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Try position-based
      }
    }
    
    // Try to fill CVC
    if (!cvcInputFilled) {
      try {
        const cvcInput = stripeFrames.locator('input[name*="cvc" i], input[name*="cvv" i], input[autocomplete="cc-csc"]').first();
        if (await cvcInput.count() > 0) {
          await cvcInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          await cvcInput.fill(cvc, { timeout: 5000 });
          cvcInputFilled = true;
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Try position-based
      }
    }
    
    // Position-based fallback for Stripe Elements
    if (!cardInputFilled || !expiryInputFilled || !cvcInputFilled) {
      try {
        const allInputs = stripeFrames.locator('input');
        const inputCount = await allInputs.count();
        
        if (inputCount >= 1 && !cardInputFilled) {
          await allInputs.nth(0).fill(cardNumber, { timeout: 5000 }).catch(() => {});
          cardInputFilled = true;
        }
        
        if (inputCount >= 2 && !expiryInputFilled) {
          await allInputs.nth(1).fill(expiryDate, { timeout: 5000 }).catch(() => {});
          expiryInputFilled = true;
        }
        
        if (inputCount >= 3 && !cvcInputFilled) {
          await allInputs.nth(2).fill(cvc, { timeout: 5000 }).catch(() => {});
          cvcInputFilled = true;
        }
      } catch (error) {
        // Position-based failed
      }
    }
  }
  
  // Fill cardholder name (usually outside iframe)
  const cardholderInput = page.locator('input#cardName, input#cardholderName, input[name="cardholderName"], input[name="cardholder"], input[name="cardName"], input[placeholder*="Cardholder" i], input[placeholder*="titulaire" i], input[placeholder*="John Doe" i]').first();
  if (await cardholderInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cardholderInput.fill(cardholderName);
    await page.waitForTimeout(500);
  }
  
  // Fill zip code if field exists
  const zipInput = page.locator('input[name="postalCode"], input[name="zip"], input[name="postal"], input[placeholder*="ZIP" i]').first();
  if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zipInput.fill(zipCode);
    await page.waitForTimeout(500);
  }
  
  // Wait for form to process inputs
  await page.waitForTimeout(1000);
};

/**
 * Submit Stripe payment form
 */
export const submitStripePayment = async (page: Page): Promise<void> => {
  // Look for submit button with various text options (French and English)
  // The ReservationPage uses "Confirmer la réservation" button
  const submitButton = page.locator(
    'button:has-text("Confirmer la réservation"), ' +
    'button:has-text("Procéder au paiement"), ' +
    'button[type="submit"]:has-text("Pay"), ' +
    'button[type="submit"]:has-text("Payer"), ' +
    'button[type="submit"]:has-text("Procéder"), ' +
    'button[type="submit"]:has-text("Confirm"), ' +
    'button:has-text("Réservation")'
  ).first();
  
  // Wait for button to be visible and enabled
  await submitButton.waitFor({ state: 'visible', timeout: 10000 });
  
  // Scroll into view if needed
  await submitButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  
  // Check if button is disabled
  const isDisabled = await submitButton.isDisabled().catch(() => false);
  if (isDisabled) {
    console.warn('Submit button is disabled, waiting a bit...');
    await page.waitForTimeout(2000);
  }
  
  // Click the submit button
  await submitButton.click({ force: true });
  
  // Wait for payment processing
  await page.waitForTimeout(3000);
  
  // Handle 3D Secure if it appears
  try {
    // Try multiple selectors for 3D Secure iframe
    const threeDSecureFrame1 = page.frameLocator('iframe[src*="stripe"][src*="3d"]').last();
    const threeDSecureFrame2 = page.frameLocator('iframe[src*="stripe"][src*="challenge"]').last();
    
    const completeButton1 = threeDSecureFrame1.locator('button:has-text("Complete"), button:has-text("Authenticate"), button:has-text("Complete authentication")');
    const completeButton2 = threeDSecureFrame2.locator('button:has-text("Complete"), button:has-text("Authenticate"), button:has-text("Complete authentication")');
    
    if (await completeButton1.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeButton1.click();
      await page.waitForTimeout(2000);
    } else if (await completeButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeButton2.click();
      await page.waitForTimeout(2000);
    }
  } catch (error) {
    // 3D Secure not required, continue
  }
};

/**
 * Mock Stripe payment intent creation
 * This intercepts the API call to create-payment-intent edge function
 */
export const mockStripePaymentIntent = async (
  page: Page,
  amount: number = 10000,
  currency: string = 'mad'
): Promise<void> => {
  await page.route('**/functions/v1/create-payment-intent', async (route) => {
    const request = route.request();
    const body = await request.postDataJSON();
    
    // Mock successful payment intent creation
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        clientSecret: `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
        paymentIntentId: `pi_test_${Date.now()}`,
        amount,
        currency,
      }),
    });
  });
};

/**
 * Mock Stripe payment capture
 * This intercepts the API call to capture-payment edge function
 */
export const mockStripePaymentCapture = async (
  page: Page,
  success: boolean = true
): Promise<void> => {
  await page.route('**/functions/v1/capture-payment', async (route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          paymentIntent: {
            id: `pi_test_${Date.now()}`,
            status: 'succeeded',
            amount: 10000,
            currency: 'mad',
          },
          booking: {
            id: `booking_${Date.now()}`,
            status: 'confirmed',
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment failed',
        }),
      });
    }
  });
};

/**
 * Complete Stripe payment flow
 */
export const completeStripePayment = async (
  page: Page,
  cardNumber: string = STRIPE_TEST_CARDS.success
): Promise<void> => {
  // Determine if this should be a success or failure based on card number
  const isSuccess = cardNumber === STRIPE_TEST_CARDS.success;
  
  // Set up mocks
  await mockStripePaymentIntent(page);
  await mockStripePaymentCapture(page, isSuccess);
  
  // Fill and submit payment form
  await fillStripePaymentForm(page, cardNumber);
  await submitStripePayment(page);
  
  // Wait for confirmation (success or error)
  if (isSuccess) {
    // Wait for success confirmation
    await page.waitForSelector('text=/success|successful|confirmation|réservation|confirmé/i', { timeout: 10000 }).catch(() => {});
  } else {
    // For failure cases, wait a bit but don't fail if error message isn't found immediately
    // The test will check for error messages separately
    await page.waitForTimeout(2000);
  }
};

