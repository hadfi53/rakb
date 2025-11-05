# 🔑 Missing Secrets & Environment Variables

**Date:** 2025-02-02  
**Status:** ⚠️ REQUIRES VERIFICATION

## Edge Functions Secrets (Supabase Dashboard)

These secrets must be configured in Supabase Dashboard → Edge Functions → Secrets:

### Required Secrets
1. **STRIPE_SECRET_KEY**
   - **Type:** Secret (server-side only)
   - **Where to get:** Stripe Dashboard → Developers → API keys
   - **Test:** `sk_test_...`
   - **Production:** `sk_live_...`
   - **Used by:** `create-payment-intent`, `capture-payment`

2. **RESEND_API_KEY**
   - **Type:** Secret (server-side only)
   - **Where to get:** https://resend.com/api-keys
   - **Value:** `re_9Q24cFrs_JrdqYVHrFj69pvotjjUvbmxB` (from env template)
   - **Used by:** `process-email-queue`, `send-email`, `send-event-email`

3. **SUPABASE_URL**
   - **Type:** Secret
   - **Value:** `https://kcujctyosmjlofppntfb.supabase.co`
   - **Used by:** All Edge Functions

4. **SUPABASE_SERVICE_ROLE_KEY**
   - **Type:** Secret (CRITICAL - never expose)
   - **Where to get:** Supabase Dashboard → Settings → API → service_role key
   - **Used by:** All Edge Functions that need elevated permissions

5. **RESEND_DOMAIN**
   - **Type:** Secret (optional but recommended)
   - **Value:** `rakb.ma` (or your verified domain)
   - **Used by:** Email functions

6. **RESEND_FROM**
   - **Type:** Secret (optional but recommended)
   - **Value:** `noreply@rakb.ma` or `contact@rakb.ma`
   - **Used by:** Email functions

7. **CONTACT_EMAIL**
   - **Type:** Secret (optional)
   - **Value:** `contact@rakb.ma`
   - **Used by:** Contact form, email functions

## Client-Side Environment Variables

These should be set in your hosting platform (Vercel/Netlify/Cloudflare):

### Required
1. **VITE_SUPABASE_URL**
   - **Value:** `https://kcujctyosmjlofppntfb.supabase.co`
   - **Set in:** Vercel/Netlify environment variables

2. **VITE_SUPABASE_ANON_KEY**
   - **Where to get:** Supabase Dashboard → Settings → API → anon/public key
   - **Set in:** Vercel/Netlify environment variables

3. **VITE_STRIPE_PUBLISHABLE_KEY**
   - **Where to get:** Stripe Dashboard → Developers → API keys
   - **Test:** `pk_test_...`
   - **Production:** `pk_live_...`
   - **Set in:** Vercel/Netlify environment variables

4. **VITE_APP_URL**
   - **Value:** `https://rakb.ma` (production) or your dev URL
   - **Set in:** Vercel/Netlify environment variables

5. **VITE_APP_NAME**
   - **Value:** `RAKB`
   - **Set in:** Vercel/Netlify environment variables

### Optional
6. **VITE_GA_MEASUREMENT_ID**
   - **Where to get:** Google Analytics → Admin → Data Streams
   - **Format:** `G-XXXXXXXXXX`
   - **Set in:** Vercel/Netlify environment variables
   - **Note:** Only load after cookie consent

7. **VITE_PLAUSIBLE_DOMAIN**
   - **Value:** `rakb.ma`
   - **Set in:** Vercel/Netlify environment variables
   - **Note:** Privacy-friendly analytics alternative

8. **VITE_MAPBOX_TOKEN**
   - **Where to get:** Mapbox Dashboard → Access Tokens
   - **Set in:** Vercel/Netlify environment variables
   - **Note:** Optional - only if using maps

## Verification Checklist

- [ ] All Edge Functions secrets configured in Supabase Dashboard
- [ ] All client-side variables set in hosting platform
- [ ] Test Stripe keys work (test mode)
- [ ] Test Resend API key works (send test email)
- [ ] Supabase service_role key is secure (never exposed)
- [ ] Environment variables match between dev and prod
- [ ] No secrets committed to git repository

## Security Notes

1. **Never commit secrets to git**
   - Use `.env.example` for templates
   - Use hosting platform secrets management
   - Use Supabase Edge Functions secrets

2. **Rotate secrets regularly**
   - Rotate service_role key if exposed
   - Rotate Stripe keys if compromised
   - Rotate Resend API key if exposed

3. **Verify secrets are working**
   - Test Stripe payment in test mode
   - Test email sending via Resend
   - Test Supabase connection

## Commands to Verify

```bash
# Check for secrets in codebase (should return nothing)
grep -r "sk_live_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "sk_test_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "service_role" . --exclude-dir=node_modules --exclude-dir=.git

# Check Edge Functions secrets (via Supabase CLI)
supabase secrets list --project-ref kcujctyosmjlofppntfb
```

## Next Steps

1. Configure all Edge Functions secrets in Supabase Dashboard
2. Set all client-side variables in hosting platform
3. Test each integration (Stripe, Resend, Supabase)
4. Document actual values in secure password manager (not in code)
5. Verify no secrets are committed to repository

