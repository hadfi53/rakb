# 🚀 RAKB Final Deployment Guide

**Version:** 1.0.0  
**Date:** January 30, 2025  
**Platform:** RAKB Car Rental Platform for Morocco

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you've completed `FINAL_CHECKLIST.md`.

---

## 🔧 Step 1: Configure Environment Variables

### 1.1 Local Environment (.env)

Create `.env` file from template:

```bash
cp FINAL_ENV_TEMPLATE.env.example .env
```

Fill in your values (see `FINAL_ENV_TEMPLATE.env.example` for details).

**Required Variables:**
```bash
VITE_SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Test mode
VITE_APP_URL=https://rakb.ma
VITE_APP_NAME=RAKB
```

### 1.2 Supabase Edge Function Secrets

In Supabase Dashboard → Edge Functions → Secrets, configure:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CONTACT_EMAIL=contact@rakb.ma
STRIPE_SECRET_KEY=sk_test_... # Test mode
SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🗄️ Step 2: Apply Database Migrations

### 2.1 Security Migration

**CRITICAL:** Apply security fixes before launch.

In Supabase Dashboard → SQL Editor, run:

```sql
-- Run: supabase/migrations/20250130_production_security_fixes.sql
```

This enables RLS on critical tables and adds missing policies.

**Verification:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('refund_requests', 'app_config');
-- Both should show rowsecurity = true
```

---

## 🏗️ Step 3: Build Production Bundle

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Build for Production

```bash
npm run build
```

This will:
- ✅ Remove all console.logs automatically (via Vite config)
- ✅ Minify code
- ✅ Optimize assets
- ✅ Create `dist/` folder

### 3.3 Test Production Build Locally

```bash
npm run preview
```

Visit `http://localhost:4173` and test:
- [ ] Homepage loads
- [ ] User can register/login
- [ ] Search works
- [ ] Booking flow works
- [ ] Payment form displays test mode indicator
- [ ] No console errors

---

## 🌐 Step 4: Deploy to Hosting Platform

### Option A: Vercel (Recommended)

#### 4.1 Install Vercel CLI

```bash
npm i -g vercel
```

#### 4.2 Deploy

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### 4.3 Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

Add all variables from `.env` file (VITE_* variables only).

#### 4.4 Configure Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add `rakb.ma`
3. Configure DNS (add CNAME record pointing to Vercel)
4. Wait for SSL certificate (automatic)

---

### Option B: Netlify

#### 4.1 Install Netlify CLI

```bash
npm i -g netlify-cli
```

#### 4.2 Deploy

```bash
# Login
netlify login

# Deploy
netlify deploy --prod
```

#### 4.3 Configure

Same as Vercel - set environment variables in Netlify Dashboard.

---

### Option C: Custom Server (VPS)

#### 4.1 Build Locally

```bash
npm run build
```

#### 4.2 Upload to Server

```bash
# Copy dist/ to server
scp -r dist/ user@server:/var/www/rakb/
```

#### 4.3 Configure Nginx

Create `/etc/nginx/sites-available/rakb`:

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
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
}
```

#### 4.4 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/rakb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Step 5: Post-Deployment Verification

### 5.1 Functional Tests

Test on production URL (`https://rakb.ma`):

- [ ] Homepage loads correctly
- [ ] Registration works
- [ ] Login works
- [ ] Search vehicles works
- [ ] View vehicle details
- [ ] Create booking (test payment)
- [ ] Contact form submits
- [ ] Messages work
- [ ] Dashboard loads

### 5.2 Email Tests

- [ ] Submit contact form → email received
- [ ] Create booking → confirmation email received
- [ ] Password reset → email received

### 5.3 Security Tests

- [ ] HTTPS enforced (no HTTP access)
- [ ] Cookie banner appears
- [ ] RLS policies working (can't access other users' data)
- [ ] No console errors exposing secrets

### 5.4 SEO Tests

- [ ] `https://rakb.ma/robots.txt` accessible
- [ ] `https://rakb.ma/sitemap.xml` accessible
- [ ] Meta tags present (view page source)
- [ ] Social sharing works (test with Facebook/Twitter debugger)

---

## 🔍 Step 6: Monitor Post-Launch

### 6.1 Set Up Monitoring

**Error Tracking:**
- [ ] Sign up for Sentry (or similar)
- [ ] Configure error reporting
- [ ] Test error capture

**Uptime Monitoring:**
- [ ] Set up UptimeRobot or Pingdom
- [ ] Configure alerts
- [ ] Test notifications

**Analytics:**
- [ ] Google Analytics configured (after cookie consent)
- [ ] Or Plausible Analytics (privacy-friendly)
- [ ] Verify tracking works

### 6.2 First 24 Hours

Monitor:
- [ ] Error rates (should be low)
- [ ] Booking conversions
- [ ] Payment success rate
- [ ] Email delivery rate
- [ ] Site uptime
- [ ] User registrations

---

## 🚨 Rollback Plan

If critical issues occur:

### Immediate Rollback

**Vercel:**
- Dashboard → Deployments → Select previous → Promote

**Netlify:**
- Dashboard → Deploys → Previous → Publish

**Custom Server:**
- Restore previous `dist/` backup
- Or redeploy previous Git commit

### Database Rollback

- Supabase Dashboard → Database → Migrations
- Revert specific migration if needed

---

## 📞 Support & Resources

### Documentation
- `FINAL_LAUNCH_REPORT.md` - Complete status report
- `FINAL_CHECKLIST.md` - Pre-launch checklist
- `FINAL_ENV_TEMPLATE.env.example` - Environment variables

### Key Files
- `vite.config.ts` - Build configuration
- `src/lib/config/company.ts` - Company info configuration
- `supabase/migrations/` - Database migrations

### Support
- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Resend Dashboard: https://resend.com/emails

---

## ✅ Deployment Complete

**Deployed By:** _______________  
**Date:** _______________  
**Time:** _______________  
**URL:** https://rakb.ma

**Status:** 🟢 **LIVE**

---

**Last Updated:** January 30, 2025

