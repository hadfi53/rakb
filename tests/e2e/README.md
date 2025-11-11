# RAKB E2E Test Suite

Comprehensive end-to-end testing suite for RAKB car rental platform using Playwright.

## 📋 Overview

This test suite covers all major user flows for:
- **Tenants (Renters)** - Registration, booking, payments, reviews
- **Agencies (Owners)** - Car listings, booking management, earnings
- **RAKB Admins** - Platform management, verification, disputes

## 🚀 Quick Start

### Prerequisites

1. Node.js 20+ installed
2. Supabase project with test database
3. Environment variables configured (see below)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Environment Setup

**Important:** Create a `.env.test` file in the project root with your test credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_APP_URL=http://localhost:5173
```

**Note:** The `.env.test` file is automatically loaded by Playwright. If it doesn't exist, the config will fall back to `.env`. Never commit `.env.test` to version control - it should contain sensitive test credentials.

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/tenant-booking-flow.spec.ts

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## 📁 Test Structure

```
tests/e2e/
├── helpers/
│   ├── auth-helper.ts      # Authentication utilities
│   ├── cleanup-helper.ts    # Test data cleanup
│   ├── stripe-helper.ts     # Stripe payment mocking
│   └── resend-helper.ts     # Email service mocking
├── tenant-*.spec.ts         # Tenant flow tests
├── agency-*.spec.ts         # Agency flow tests
├── admin-*.spec.ts          # Admin flow tests
├── search-flow.spec.ts      # Search functionality
├── payment-flow.spec.ts     # Payment processing
├── security.spec.ts         # Security tests
└── README.md                # This file
```

## 🧪 Test Categories

### Tenant Tests
- `tenant-registration.spec.ts` - User registration with validation
- `tenant-login.spec.ts` - Login flows
- `tenant-booking-flow.spec.ts` - Complete booking journey
- `tenant-cancellation.spec.ts` - Booking cancellation
- `tenant-reviews.spec.ts` - Review submission
- `tenant-profile.spec.ts` - Profile management

### Agency Tests
- `agency-registration.spec.ts` - Owner registration
- `agency-dashboard.spec.ts` - Dashboard overview
- `agency-add-car.spec.ts` - Car listing creation
- `agency-booking-approval.spec.ts` - Booking management
- `agency-earnings.spec.ts` - Revenue tracking
- `agency-availability.spec.ts` - Availability management

### Admin Tests
- `admin-login.spec.ts` - Admin authentication
- `admin-dashboard.spec.ts` - Admin dashboard

### Core System Tests
- `search-flow.spec.ts` - Search and filtering
- `payment-flow.spec.ts` - Payment processing
- `security.spec.ts` - Access control

## 🛠️ Helper Utilities

### Auth Helper
```typescript
import { createTestUser, signInUser, deleteTestUser, dismissCookieBanner } from './helpers/auth-helper';

// Create test user
const user = await createTestUser({
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'renter'
});

// Sign in (automatically handles cookie banners)
await signInUser(page, user.email, user.password);

// Manually dismiss cookie banner if needed
await dismissCookieBanner(page);

// Cleanup
await deleteTestUser(user.id);
```

### Cleanup Helper
```typescript
import { cleanupTestData } from './helpers/cleanup-helper';

// Clean up all test data
await cleanupTestData({
  userIds: [user.id],
  bookingIds: [booking.id],
  carIds: [car.id]
});
```

### Stripe Helper
```typescript
import { completeStripePayment, STRIPE_TEST_CARDS } from './helpers/stripe-helper';

// Complete payment with test card
await completeStripePayment(page, STRIPE_TEST_CARDS.success);
```

### Resend Helper
```typescript
import { setupEmailMocks } from './helpers/resend-helper';

// Mock email service
await setupEmailMocks(page);
```

## 🔍 Test Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeAll`/`afterAll` for setup/cleanup
- Clean up test data after tests

### 2. Waiting Strategies
```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific element
await page.waitForSelector('button', { timeout: 5000 });

// Wait for URL change
await page.waitForURL(/\/dashboard/, { timeout: 10000 });
```

### 3. Assertions
```typescript
// Use descriptive assertions
await expect(page.locator('text=/success/i')).toBeVisible();

// Verify database state
const { data } = await supabase.from('bookings').select('*');
expect(data).toBeDefined();
```

### 4. Error Handling
```typescript
try {
  await someOperation();
} finally {
  // Always cleanup
  await cleanupTestData(data);
}
```

## 📊 CI/CD Integration

Tests run automatically on:
- Pull requests to `main`
- Manual workflow dispatch

### GitHub Actions Secrets Required
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_APP_URL` (optional)

## 🐛 Debugging Tests

### View Test Videos
```bash
# Videos are saved in test-results/ on failure
open test-results/
```

### View Screenshots
```bash
# Screenshots on failure in test-results/
open test-results/
```

### Debug Mode
```bash
# Run with debugger
npm run test:e2e:debug

# Or with Playwright Inspector
PWDEBUG=1 npm run test:e2e
```

### Trace Viewer
```bash
# View trace (if enabled in config)
npx playwright show-trace trace.zip
```

## 📈 Coverage

See [E2E_COVERAGE_REPORT.md](./E2E_COVERAGE_REPORT.md) for detailed coverage metrics.

## 🤝 Contributing

### Adding New Tests

1. Create test file in appropriate category
2. Use helper utilities for common operations
3. Add cleanup in `afterAll` hook
4. Update coverage report

### Test Naming Convention

- File: `feature-flow.spec.ts`
- Describe: `Feature Flow`
- Test: `should do something specific`

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, signInUser } from './helpers/auth-helper';

test.describe('Feature Flow', () => {
  let testUser: any;

  test.beforeAll(async () => {
    // Setup
    testUser = await createTestUser({...});
  });

  test.afterAll(async () => {
    // Cleanup
    await deleteTestUser(testUser.id);
  });

  test('should do something', async ({ page }) => {
    await test.step('Step description', async () => {
      // Test code
    });
  });
});
```

## 🚨 Common Issues

### Missing Environment Variables
- **Error:** "Supabase credentials not configured"
- **Solution:** Create `.env.test` file with required variables (see Environment Setup section)
- Ensure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check network conditions
- Verify selectors are correct
- Cookie banners may intercept clicks - ensure `dismissCookieBanner()` is called

### Cookie Banner Intercepts Clicks
- **Error:** "element intercepts pointer events"
- **Solution:** Use `dismissCookieBanner(page)` before interactions, or use `signInUser()` which handles it automatically
- Cookie banners are automatically dismissed by `signInUser()` helper

### Authentication Issues
- Ensure Supabase credentials are correct
- Check user creation in `beforeAll`
- Verify session persistence
- Ensure `.env.test` file exists and is properly formatted

### Stripe Payment Fails
- Check Stripe test keys are configured
- Verify iframe selectors match current Stripe Elements
- Check network tab for API errors

## 📝 Notes

- Tests use test database (separate from production)
- All external APIs are mocked (Stripe, Resend)
- Test data is automatically cleaned up
- Videos/screenshots captured on failure

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)

---

**Last Updated:** {{DATE}}
**Maintained By:** QA Automation Team
