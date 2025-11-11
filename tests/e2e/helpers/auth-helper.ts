import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Load environment variables - Playwright will use process.env from the environment
// No need for dotenv as Playwright config should load env vars

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'renter' | 'owner' | 'admin';
  id?: string;
}

/**
 * Create a Supabase client for test operations
 */
export const getSupabaseClient = (useServiceRole = false) => {
  const key = useServiceRole ? supabaseServiceKey : supabaseAnonKey;
  if (!supabaseUrl || !key) {
    const missing = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!key) missing.push(useServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'VITE_SUPABASE_ANON_KEY');
    
    throw new Error(
      `Supabase credentials not configured. Missing: ${missing.join(', ')}. ` +
      `Please set these environment variables or create a .env.test file.`
    );
  }
  return createClient(supabaseUrl, key);
};

/**
 * Generate a unique test user email
 * Note: Supabase requires valid email format - use mailinator.com for testing (disposable email service)
 * Alternative: Use gmail.com with plus addressing if mailinator is blocked
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  // Use mailinator.com (disposable email service) or gmail.com with plus addressing
  // Format: prefix + timestamp + random@mailinator.com
  // If mailinator is blocked, try: prefix+timestamp+random@gmail.com
  return `${prefix}${timestamp}${random}@mailinator.com`;
};

/**
 * Create a test user in Supabase
 */
export const createTestUser = async (
  userData: Omit<TestUser, 'id'>
): Promise<TestUser> => {
  const supabase = getSupabaseClient(true); // Use service role for user creation

  // Sign up the user
  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Auto-confirm email for testing
    user_metadata: {
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
    },
  });

  if (signUpError || !authData.user) {
    throw new Error(`Failed to create test user: ${signUpError?.message || 'Unknown error'}`);
  }

  // Wait for profile to be created by trigger
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Update profile role if needed
  const dbRole = userData.role === 'owner' ? 'proprietaire' : userData.role === 'renter' ? 'locataire' : 'admin';
  
  // Set verification flags based on role for testing purposes
  // Owners need verified_host=true to access dashboard, renters need verified_tenant=true
  const verificationFlags: any = {};
  if (userData.role === 'owner') {
    verificationFlags.verified_host = true;
  } else if (userData.role === 'renter') {
    verificationFlags.verified_tenant = true;
  }
  
  // Update profile (email column doesn't exist in profiles table, it's stored in auth.users)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: dbRole,
      first_name: userData.firstName,
      last_name: userData.lastName,
      ...verificationFlags,
    })
    .eq('id', authData.user.id);

  if (profileError) {
    console.warn('Profile update error (may be expected):', profileError);
  }

  return {
    ...userData,
    id: authData.user.id,
  };
};

/**
 * Delete a test user from Supabase
 */
export const deleteTestUser = async (userId: string): Promise<void> => {
  const supabase = getSupabaseClient(true);
  
  try {
    // First, try to delete related records that might prevent user deletion
    // Delete from profiles table (should cascade, but try explicit delete)
    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    } catch {
      // Ignore errors - profile might not exist or might be deleted by cascade
    }
    
    // Wait a moment for cascade operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Delete user (cascade will handle profile deletion)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      // If deletion fails, try to check if user still exists
      const { data: users } = await supabase.auth.admin.listUsers();
      const userExists = users?.users?.some(u => u.id === userId);
      
      if (userExists) {
        console.warn(`Failed to delete test user ${userId}:`, error.message || error);
      } else {
        // User doesn't exist, so deletion was successful (or user never existed)
        console.log(`User ${userId} does not exist (may have been already deleted)`);
      }
    }
  } catch (err) {
    // Log but don't throw - cleanup failures shouldn't break tests
    console.warn(`Error during test user cleanup for ${userId}:`, err);
  }
};

/**
 * Dismiss top announcement banner if it's blocking interactions
 */
export const handleTopBanner = async (page: Page): Promise<void> => {
  try {
    // The top banner with z-[60] might intercept clicks
    // Scroll down a bit to ensure elements are not behind the fixed banner
    await page.evaluate(() => {
      window.scrollTo(0, 100); // Scroll down to avoid banner
    });
    await page.waitForTimeout(200);
  } catch {
    // Continue if scroll fails
  }
};

/**
 * Dismiss cookie banner if present
 */
export const dismissCookieBanner = async (page: Page): Promise<void> => {
  try {
    // Wait a bit for cookie banner to appear
    await page.waitForTimeout(500);
    
    // Look for "Tout accepter" (Accept All) button in cookie banner
    // The banner has z-50 and is fixed at bottom, so it might intercept clicks
    const acceptAllButton = page.locator('button:has-text("Tout accepter"), button:has-text("Accept All"), button:has-text("Accept")').first();
    
    if (await acceptAllButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Scroll into view and click
      await acceptAllButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await acceptAllButton.click({ force: true });
      await page.waitForTimeout(500); // Wait for banner to disappear
    }
  } catch {
    // Cookie banner not present or already dismissed, continue
  }
};

/**
 * Dismiss all overlays that might intercept clicks
 */
export const dismissAllOverlays = async (page: Page): Promise<void> => {
  await handleTopBanner(page);
  await dismissCookieBanner(page);
};

/**
 * Navigate to a page and dismiss all overlays
 */
export const gotoPage = async (page: Page, url: string, options?: { timeout?: number }): Promise<void> => {
  const timeout = options?.timeout || 60000; // Default 60 seconds for mobile browsers
  const targetPath = url.split('?')[0]; // Get path without query params
  
  try {
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout 
    });
  } catch (error) {
    // If navigation times out, check if we're already on the page
    const currentUrl = page.url();
    let currentPath: string;
    
    try {
      currentPath = new URL(currentUrl).pathname;
    } catch {
      // If URL parsing fails, extract pathname manually
      currentPath = currentUrl.split('?')[0].split('#')[0];
    }
    
    if (currentPath === targetPath || currentUrl.includes(targetPath)) {
      // We're already on the page, continue
      console.log(`Navigation timeout but already on target page: ${currentUrl}`);
    } else {
      // Check if page is still loading
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        const finalUrl = page.url();
        let finalPath: string;
        
        try {
          finalPath = new URL(finalUrl).pathname;
        } catch {
          finalPath = finalUrl.split('?')[0].split('#')[0];
        }
        
        if (finalPath === targetPath || finalUrl.includes(targetPath)) {
          console.log(`Page loaded after timeout check: ${finalUrl}`);
        } else {
          // Retry once with a longer timeout
          console.log(`Navigation timeout, retrying with longer timeout...`);
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: timeout * 2 
          });
        }
      } catch {
        // If still failing, check one more time if we're on the right page
        const checkUrl = page.url();
        if (!checkUrl.includes(targetPath)) {
          throw error; // Re-throw if we're definitely not on the right page
        }
      }
    }
  }
  
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await dismissAllOverlays(page);
};

/**
 * Sign in a user in the browser
 */
export const signInUser = async (
  page: Page,
  email: string,
  password: string
): Promise<void> => {
  // Retry navigation with exponential backoff if server isn't ready
  let retries = 3;
  let lastError: Error | null = null;
  
  while (retries > 0) {
    try {
      await page.goto('/auth/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      break; // Success, exit retry loop
    } catch (error) {
      lastError = error as Error;
      retries--;
      
      if (retries > 0) {
        const waitTime = (4 - retries) * 2000; // 2s, 4s, 6s
        console.log(`Navigation failed, retrying in ${waitTime}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  if (retries === 0 && lastError) {
    throw new Error(`Failed to navigate to login page after retries: ${lastError.message}`);
  }
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  // Dismiss cookie banner if present
  await dismissCookieBanner(page);
  
  // Wait for email input to be visible
  await page.waitForSelector('input[type="email"], input#email', { timeout: 10000 });
  
  // Fill email (try multiple selectors)
  const emailInput = page.locator('input#email, input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill(email);
  
  // Fill password (try multiple selectors)
  const passwordInput = page.locator('input#password, input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(password);
  
  // Click submit button (try multiple selectors)
  const submitButton = page.locator('button[type="submit"]:has-text("Se connecter"), button[type="submit"]:has-text("Connexion"), button[type="submit"]:has-text("Login"), button[type="submit"]').first();
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  
  // Dismiss cookie banner again before clicking (in case it appeared)
  await dismissCookieBanner(page);
  
  await submitButton.click();
  
  // Wait for redirect after login (with longer timeout)
  await page.waitForURL(/\/dashboard|\/search|\//, { timeout: 15000 }).catch(() => {});
  
  // Wait for auth state to settle
  await page.waitForTimeout(2000);
};

/**
 * Sign out the current user
 */
export const signOutUser = async (page: Page): Promise<void> => {
  // Find and click sign out button (adjust selector as needed)
  const signOutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Sign out"), [data-testid="sign-out"]').first();
  
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL(/\/auth\/login|\//, { timeout: 5000 });
  }
};

/**
 * Get current user session
 */
export const getCurrentSession = async (page: Page): Promise<string | null> => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const projectId = supabaseUrl.split('//')[1]?.split('.')[0] || 'supabase';
  
  return await page.evaluate((projectId) => {
    try {
      // Try common localStorage keys
      const keys = Object.keys(localStorage);
      const authKey = keys.find(key => key.includes('auth-token') || key.includes('supabase'));
      return authKey ? localStorage.getItem(authKey) : null;
    } catch {
      return null;
    }
  }, projectId);
};

/**
 * Set authentication state in localStorage
 */
export const setAuthState = async (
  page: Page,
  user: TestUser
): Promise<void> => {
  // Sign in to get actual session
  await signInUser(page, user.email, user.password);
};

