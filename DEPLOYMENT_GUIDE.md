# 🚀 RAKB Deployment Guide

**Version:** 1.0.0  
**Date:** January 2025  
**Status:** Production-Ready (after applying fixes)

---

## 📋 Pre-Deployment Checklist

### ✅ 1. Security Fixes Applied

- [ ] Run migration: `supabase/migrations/20250130_production_security_fixes.sql`
- [ ] Verify RLS is enabled on all tables (see verification queries in migration)
- [ ] Enable Password Leak Protection in Supabase Dashboard
- [ ] Remove or wrap all `console.log` statements in production build

### ✅ 2. Environment Variables Configured

Create `.env.production` with:

```bash
# Supabase (Production)
VITE_SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Stripe (LIVE keys - NOT test keys!)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email Service (Optional)
VITE_RESEND_API_KEY=re_...
VITE_CONTACT_EMAIL=contact@rakb.ma

# Analytics (Load after cookie consent)
VITE_GA_MEASUREMENT_ID=G-...
VITE_PLAUSIBLE_DOMAIN=rakb.ma

# App Config
VITE_APP_URL=https://rakb.ma
VITE_APP_NAME=RAKB
```

### ✅ 3. Supabase Edge Function Secrets

Configure in Supabase Dashboard → Edge Functions → Secrets:

```bash
STRIPE_SECRET_KEY=sk_live_...  # LIVE key!
SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_... (optional)
CONTACT_EMAIL=contact@rakb.ma
```

### ✅ 4. Database Migrations

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard
# SQL Editor → Run: supabase/migrations/20250130_production_security_fixes.sql
```

### ✅ 5. Stripe Configuration

1. **Create Stripe Account** (if not exists)
   - Complete business verification
   - Add bank account for payouts

2. **Get LIVE API Keys**
   - Dashboard → Developers → API keys
   - Copy **Publishable key** (starts with `pk_live_`)
   - Copy **Secret key** (starts with `sk_live_`)

3. **Configure Webhooks**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://kcujctyosmjlofppntfb.supabase.co/functions/v1/stripe-webhook`
   - Events to listen:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `charge.refunded`

4. **Test Webhook** (use Stripe CLI or Dashboard)
   ```bash
   stripe listen --forward-to https://kcujctyosmjlofppntfb.supabase.co/functions/v1/stripe-webhook
   ```

---

## 🏗️ Build & Deploy

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.production`

4. **Custom Domain**:
   - Vercel Dashboard → Project → Settings → Domains
   - Add `rakb.ma`
   - Configure DNS (add CNAME record)

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

3. **Configure**:
   - Netlify Dashboard → Site Settings → Build & Deploy → Environment Variables
   - Add all variables from `.env.production`

### Option 3: Custom Server (VPS/Cloud)

1. **Build**:
   ```bash
   npm run build
   ```

2. **Deploy to server**:
   ```bash
   # Copy dist/ to server
   scp -r dist/ user@server:/var/www/rakb/
   ```

3. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name rakb.ma www.rakb.ma;
       
       root /var/www/rakb/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Enable HTTPS (Let's Encrypt)
       listen 443 ssl http2;
       ssl_certificate /etc/letsencrypt/live/rakb.ma/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/rakb.ma/privkey.pem;
   }
   ```

---

## ✅ Post-Deployment Verification

### 1. Functional Tests

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Search vehicles works
- [ ] View vehicle details works
- [ ] Create booking (test mode first!)
- [ ] Payment processing works
- [ ] Booking confirmation email received
- [ ] Contact form submits successfully
- [ ] Cookie consent banner works

### 2. Security Verification

- [ ] RLS policies working (try accessing other users' data - should fail)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] No secrets in browser console
- [ ] CSP headers not blocking functionality
- [ ] Cookie consent required before analytics

### 3. SEO Verification

- [ ] `https://rakb.ma/robots.txt` accessible
- [ ] `https://rakb.ma/sitemap.xml` accessible
- [ ] Meta tags present (check page source)
- [ ] OpenGraph tags work (test with Facebook Debugger)
- [ ] Twitter Cards work (test with Twitter Card Validator)

### 4. Performance Verification

- [ ] Lighthouse score > 90 (all categories)
- [ ] Page load time < 3 seconds
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size reasonable (< 1MB initial load)

---

## 🔧 Maintenance

### Monitoring

1. **Error Tracking**
   - Set up Sentry or similar
   - Monitor production errors

2. **Analytics**
   - Google Analytics or Plausible
   - Track key metrics (bookings, revenue, conversions)

3. **Uptime Monitoring**
   - UptimeRobot, Pingdom, or similar
   - Alert on downtime

### Updates

1. **Code Updates**:
   ```bash
   git pull origin main
   npm install
   npm run build
   # Deploy using your method
   ```

2. **Database Migrations**:
   ```bash
   supabase db push
   # Or run migrations manually in Supabase Dashboard
   ```

3. **Edge Functions**:
   ```bash
   supabase functions deploy function-name
   ```

---

## 🚨 Rollback Plan

If issues occur after deployment:

### 1. Immediate Rollback

**Vercel**:
- Dashboard → Deployments → Select previous deployment → Promote

**Netlify**:
- Dashboard → Deploys → Select previous deploy → Publish deploy

**Custom Server**:
- Restore previous `dist/` backup
- Or redeploy previous Git commit

### 2. Database Rollback

- Supabase Dashboard → Database → Migrations
- Revert specific migration if needed

### 3. Feature Flags

- Use `app_config` table to disable features
- Set `maintenance_mode = true` if needed

---

## 📞 Support

- **Technical Issues**: Check `PRODUCTION_FINALIZATION_REPORT.md`
- **Company Info**: Configure in `src/lib/config/company.ts`
- **Stripe Issues**: See `STRIPE_SETUP_GUIDE.md`
- **Deployment Issues**: Review build logs and Supabase Dashboard

---

## 🔐 Security Reminders

1. **Never commit** `.env` files
2. **Always use** environment variables for secrets
3. **Rotate keys** regularly (especially Stripe)
4. **Monitor** Supabase Dashboard for unusual activity
5. **Review** RLS policies periodically
6. **Update** dependencies regularly (`npm audit`)

---

**Last Updated:** January 2025  
**Next Review:** After initial launch (1 week)

