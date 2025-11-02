# 🚨 Quick Fixes Checklist - Pre-Launch

## Critical Issues (Fix Before Launch)

### 1. Payment Integration ⏱️ 3-5 days
- [ ] Set up Stripe account
- [ ] Create Edge Function: `supabase/functions/stripe-payment/`
- [ ] Replace `src/lib/mock-payment.ts` with real Stripe integration
- [ ] Update `src/components/booking/PaymentSheet.tsx`
- [ ] Test payment flow end-to-end

### 2. Contact Information ⏱️ 1 hour
- [ ] Replace `+212 5XX XXX XXX` in `src/components/Footer.tsx` (line 110)
- [ ] Replace `+212 XXX XXX XXX` in `src/pages/contact/Contact.tsx` (line 158)
- [ ] Replace `+212 5XX XXX XXX` in `src/pages/emergency/Emergency.tsx` (lines 22, 29)
- [ ] Add real physical address to Footer if applicable
- [ ] Verify `contact@rakb.ma` email works

### 3. Broken Blog Links ⏱️ 2-4 hours
- [ ] Option A: Add route and component for `/blog/:id`
- [ ] Option B: Remove individual post links from Blog page
- [ ] Test all blog navigation

### 4. SEO Component Cleanup ⏱️ 30 minutes
- [ ] Option A: Install `npm install react-helmet-async` and use SEO component
- [ ] Option B: Delete unused `src/components/SEO.tsx` file

### 5. Social Media Links ⏱️ 15 minutes
- [ ] Option A: Add real social media URLs to Footer
- [ ] Option B: Remove social media icons if accounts don't exist

---

## High Priority (Fix Soon After Launch)

### 6. Console Statements ⏱️ 2-3 hours
- [ ] Wrap all `console.log/warn/error` in `if (import.meta.env.DEV)`
- [ ] Or remove entirely
- [ ] Files to check:
  - `src/lib/utils.ts`
  - `src/pages/contact/Contact.tsx`
  - `src/components/CookieConsent.tsx`

### 7. 404 Page Localization ⏱️ 1 hour
- [ ] Translate to French in `src/pages/NotFound.tsx`
- [ ] Improve design consistency
- [ ] Add navigation links

### 8. Contact Form Verification ⏱️ 1-2 hours
- [ ] Verify Edge Function exists: `supabase/functions/contact-form/`
- [ ] Test form submission
- [ ] Add error handling fallback

---

## Quick Wins (Do Immediately)

- [x] Read audit report
- [ ] Fix contact phone numbers (15 min)
- [ ] Fix social media links (15 min)
- [ ] Clean up SEO component (30 min)

**Total Quick Wins Time: ~1 hour**

---

## Post-Launch Improvements

- [ ] Add missing alt tags to images
- [ ] Generate dynamic sitemap for car pages
- [ ] Optimize images (WebP, compression)
- [ ] Connect blog newsletter form
- [ ] Add more location-specific keywords

---

## Testing Before Launch

- [ ] Test payment flow (once implemented)
- [ ] Test contact form
- [ ] Test on mobile devices (real devices)
- [ ] Test booking creation
- [ ] Test image uploads
- [ ] Test role-based access
- [ ] Test error scenarios

---

**Estimated Total Critical Fixes Time: 5-8 days**  
**Estimated Quick Wins Time: 1 hour**

