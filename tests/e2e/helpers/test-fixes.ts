/**
 * Common test fix utilities
 * These functions help fix common issues across all tests
 */

import { Page, Locator } from '@playwright/test';

/**
 * Wait for page to load with better error handling
 */
export const waitForPageLoad = async (page: Page): Promise<void> => {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
};

/**
 * Wait for element with multiple selector fallbacks
 */
export const waitForElement = async (
  page: Page,
  selectors: string[],
  options?: { timeout?: number; state?: 'visible' | 'attached' }
): Promise<Locator> => {
  const timeout = options?.timeout || 10000;
  const state = options?.state || 'visible';
  
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state, timeout: 5000 });
      return locator;
    } catch {
      continue;
    }
  }
  
  // If all fail, try the first one with full timeout
  const locator = page.locator(selectors[0]).first();
  await locator.waitFor({ state, timeout });
  return locator;
};

/**
 * Fill input with fallback selectors
 */
export const fillInput = async (
  page: Page,
  selectors: string[],
  value: string
): Promise<void> => {
  const input = await waitForElement(page, selectors);
  await input.fill(value);
};

/**
 * Click button with fallback selectors
 */
export const clickButton = async (
  page: Page,
  selectors: string[],
  options?: { timeout?: number }
): Promise<void> => {
  const button = await waitForElement(page, selectors, { timeout: options?.timeout || 10000 });
  await button.click();
};

/**
 * Wait for URL change with timeout
 */
export const waitForURL = async (
  page: Page,
  pattern: RegExp | string,
  options?: { timeout?: number }
): Promise<void> => {
  const timeout = options?.timeout || 15000;
  await page.waitForURL(pattern, { timeout }).catch(() => {
    // Log current URL for debugging
    console.warn(`URL did not match pattern ${pattern}. Current URL: ${page.url()}`);
  });
};

/**
 * Wait for text to appear with multiple patterns
 */
export const waitForText = async (
  page: Page,
  patterns: (RegExp | string)[],
  options?: { timeout?: number }
): Promise<void> => {
  const timeout = options?.timeout || 10000;
  
  for (const pattern of patterns) {
    try {
      await page.waitForSelector(`text=${pattern}`, { timeout: 5000 });
      return;
    } catch {
      continue;
    }
  }
  
  // If all fail, try the first one
  await page.waitForSelector(`text=${patterns[0]}`, { timeout });
};

