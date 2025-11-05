# ✅ FINAL PRE-LAUNCH CHECKLIST

**Date:** 2025-02-02  
**Project:** RAKB Platform  
**Target Launch:** TBD

---

## 🔐 SECURITY & DATABASE (CRITICAL)

### Database Migrations
- [ ] Apply `20250202_rls_hardening.sql` to production
- [ ] Apply `20250202_indexes_and_perf.sql` to production
- [ ] Apply `20250202_function_security_fixes.sql` to production
- [ ] Verify RLS policies work correctly
- [ ] Test queries with new indexes (performance check)

### Secrets & Environment Variables
- [ ] Configure all Edge Functions secrets in Supabase Dashboard
  - [ ] `STRIPE_SECRET_KEY` (test mode first)
  - [ ] `RESEND_API_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RESEND_DOMAIN` (optional)
  - [ ] `RESEND_FROM` (optional)
  - [ ] `CONTACT_EMAIL` (optional)
- [ ] Set all client-side variables in hosting platform
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (test mode first)
  - [ ] `VITE_APP_URL`
  - [ ] `VITE_APP_NAME`
  - [ ] `VITE_GA_MEASUREMENT_ID` (optional)
  - [ ] `VITE_PLAUSIBLE_DOMAIN` (optional)
  - [ ] `VITE_MAPBOX_TOKEN` (optional)
- [ ] Verify no secrets are committed to git
- [ ] Test all secrets are working

### Auth Configuration
- [ ] Set OTP expiry to < 1 hour in Supabase Dashboard
- [ ] Enable leaked password protection
- [ ] Test password reset flow
- [ ] Test email verification flow
- [ ] Test session refresh flow

### Security Hardening
- [ ] Fix remaining function search_path issues (20+ functions)
- [ ] Move `pg_net` extension to `internal_extensions` (contact Supabase support)
- [ ] Move `http` extension to `internal_extensions` (contact Supabase support)
- [ ] Upgrade Postgres version (security patches available)
- [ ] Review `host_stats` materialized view access

---

## 💳 PAYMENTS (STRIPE)

- [ ] Verify Stripe test keys work (4242 4242 4242 4242)
- [ ] Test payment flow end-to-end
- [ ] Configure Stripe webhook endpoint
- [ ] Verify webhook signing secret
- [ ] Test webhook signature verification
- [ ] Test payment failure scenarios
- [ ] Test refund flow
- [ ] Document rollback plan for payment errors
- [ ] **Before going live:** Switch to production Stripe keys
- [ ] **Before going live:** Test with real card (small amount)

---

## 📧 EMAIL (RESEND)

- [ ] Verify `RESEND_API_KEY` is set in Edge Functions
- [ ] Test email sending via Resend
- [ ] Add retry logic to `process-email-queue` function
- [ ] Add `retry_count` and `next_attempt_at` columns to `email_queue`
- [ ] Test email queue processing
- [ ] Test 429 rate limit handling
- [ ] Verify DNS records for domain (SPF/DKIM)
- [ ] Test email templates (booking confirmation, etc.)

---

## 🖼️ STORAGE & IMAGES

- [ ] Verify all storage buckets exist and are configured correctly
- [ ] Test image upload (vehicles, avatars)
- [ ] Test image URLs return HTTP 200 (sample 50 images)
- [ ] Verify bucket policies (public vs private)
- [ ] Test document upload (verification documents)
- [ ] Test image deletion
- [ ] Verify storage cleanup policies

---

## 👥 USER FLOWS (E2E TESTS)

### Renter Flow
- [ ] Signup → Email verification
- [ ] Tenant verification → Document upload → Approval
- [ ] Search vehicles → View details
- [ ] Create booking → Payment (test mode)
- [ ] Receive booking confirmation email
- [ ] Send message to owner
- [ ] Check-out process

### Owner Flow
- [ ] Signup → Email verification
- [ ] Host verification → Document upload → Approval
- [ ] Add vehicle → Upload images
- [ ] Accept booking request
- [ ] Check-in process
- [ ] Manage deposits
- [ ] View revenue dashboard

### Admin Flow
- [ ] Access admin dashboard
- [ ] Review verification requests
- [ ] Process refunds
- [ ] View logs and analytics
- [ ] Export data (CSV/PDF)

---

## 🔔 NOTIFICATIONS & MESSAGING

- [ ] Test in-app notifications
- [ ] Test email notifications
- [ ] Test real-time message updates
- [ ] Test notification badges
- [ ] Test notification preferences

---

## 🚗 BOOKINGS & CANCELLATIONS

- [ ] Test booking creation
- [ ] Test booking cancellation (with fees)
- [ ] Test refund requests
- [ ] Test dispute creation
- [ ] Test check-in/check-out
- [ ] Test deposit handling

---

## 🌐 SEO & DOMAIN

- [ ] Verify DNS configuration (rakb.ma)
- [ ] Verify HTTPS is enabled
- [ ] Verify HSTS is configured
- [ ] Check robots.txt exists and is correct
- [ ] Check sitemap.xml exists and is correct
- [ ] Verify canonical tags on all pages
- [ ] Verify OpenGraph tags
- [ ] Run PageSpeed check (Home, Search, Car Detail)
- [ ] Fix LCP/CLS issues if found

---

## 📊 MONITORING & LOGS

- [ ] Configure Supabase advisors monitoring
- [ ] Set up error rate alerts (> X errors/hour)
- [ ] Set up failed payment alerts
- [ ] Set up email queue backlog alerts (> 100 pending)
- [ ] Verify DB backups are enabled
- [ ] Verify point-in-time recovery is enabled
- [ ] Test error logging

---

## 🧪 TESTING

- [ ] Run all E2E tests (Playwright)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test on slow network (3G)
- [ ] Test accessibility (keyboard navigation, screen readers)
- [ ] Test GDPR cookie consent
- [ ] Test analytics only load after consent

---

## 📝 DOCUMENTATION

- [ ] Update `DEPLOYMENT_GUIDE.md` with latest info
- [ ] Verify `.env.example` is complete and accurate
- [ ] Document all API endpoints
- [ ] Document all Edge Functions
- [ ] Create `IAC_ENV_TEMPLATE.env.example`

---

## 🚀 DEPLOYMENT

- [ ] Build production bundle (`npm run build`)
- [ ] Test production build locally
- [ ] Verify no console errors in production build
- [ ] Deploy to staging environment
- [ ] Test staging environment
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Set up monitoring alerts

---

## ✅ POST-LAUNCH

- [ ] Monitor error logs for first 24 hours
- [ ] Monitor payment success rate
- [ ] Monitor email delivery rate
- [ ] Check Supabase advisors daily
- [ ] Review user feedback
- [ ] Monitor performance metrics

---

## 📋 SIGN-OFF

**Database Migrations:** _________________ Date: ______  
**Secrets Configuration:** _________________ Date: ______  
**E2E Tests:** _________________ Date: ______  
**Security Review:** _________________ Date: ______  
**Final Approval:** _________________ Date: ______

---

**Checklist Version:** 1.0  
**Last Updated:** 2025-02-02

