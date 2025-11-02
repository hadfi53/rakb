# 🚀 Step-by-Step Deployment Update Guide

**Current Situation:**
- Old website (HTML/CSS) was in `https://github.com/hadfi53/rakb`
- New React/Vite website code is now pushed to `https://github.com/hadfi53/rakb`
- Domain: `rakb.ma` (currently pointing to old site)

**Goal:** Update deployment to serve the new React/Vite website

---

## 📋 Step 1: Choose Your Hosting Platform

Based on your configuration files, you have 3 options:

### Option A: Vercel (Recommended - Best for React/Vite)
- ✅ Auto-deploys on Git push
- ✅ Free SSL certificates
- ✅ Fast global CDN
- ✅ Easy environment variable management

### Option B: Netlify
- ✅ Similar to Vercel
- ✅ Free tier available
- ✅ Good for static sites

### Option C: Render
- ✅ Good alternative
- ✅ Free tier available

---

## 🎯 Step 2: Environment Variables Setup

**Before deploying, you need these variables:**

### Required Variables:
```bash
VITE_SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
VITE_APP_URL=https://rakb.ma
VITE_APP_NAME=RAKB
```

### Optional Variables:
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_PLAUSIBLE_DOMAIN=rakb.ma
VITE_MAPBOX_TOKEN=pk.xxxxx
```

**Where to find Supabase keys:**
1. Go to: https://supabase.com/dashboard/project/_/settings/api
2. Copy `Project URL` → `VITE_SUPABASE_URL`
3. Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

**Where to find Stripe keys:**
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy `Publishable key` → `VITE_STRIPE_PUBLISHABLE_KEY`
3. For production, use LIVE keys (`pk_live_...`)
4. For testing, use TEST keys (`pk_test_...`)

---

## 🌐 Step 3: Deploy to Your Chosen Platform

### **Option A: Deploy to Vercel** (Recommended)

#### Step 3.1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 3.2: Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

#### Step 3.3: Deploy to Vercel
```bash
cd "/Users/hamzahadfi/Desktop/RAKeB/untitled folder/rakeb-website-cursor"
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time) or Yes (if project exists)
- **Project name?** → `rakeb-website` (or your preference)
- **Directory?** → `./` (current directory)
- **Override settings?** → No (it will auto-detect Vite)

This creates a preview deployment. Test it first!

#### Step 3.4: Configure Environment Variables in Vercel

1. Go to: https://vercel.com/dashboard
2. Click on your project: `rakeb-website`
3. Go to: **Settings** → **Environment Variables**
4. Add each variable:
   - Click **Add New**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://kcujctyosmjlofppntfb.supabase.co`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**
5. Repeat for all variables:
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_APP_URL` = `https://rakb.ma`
   - `VITE_APP_NAME` = `RAKB`
   - (Optional: Analytics variables)

#### Step 3.5: Deploy to Production
```bash
vercel --prod
```

#### Step 3.6: Configure Custom Domain (rakb.ma)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `rakb.ma`
4. Click **Add**
5. Vercel will show DNS configuration:
   - **Option 1 (CNAME - Recommended):**
     - Type: `CNAME`
     - Name: `@` or leave blank
     - Value: `cname.vercel-dns.com`
   - **Option 2 (A Record):**
     - Type: `A`
     - Name: `@`
     - Value: `76.76.21.21`
6. Go to your domain registrar (where you bought rakb.ma)
7. Add the DNS record shown by Vercel
8. Wait 5-30 minutes for DNS propagation
9. Vercel will automatically issue SSL certificate

---

### **Option B: Deploy to Netlify**

#### Step 3.1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 3.2: Login to Netlify
```bash
netlify login
```

#### Step 3.3: Initialize Netlify
```bash
cd "/Users/hamzahadfi/Desktop/RAKeB/untitled folder/rakeb-website-cursor"
netlify init
```

When prompted:
- **Create & configure a new site?** → Yes
- **Team:** → Select your team
- **Site name:** → `rakeb-website` (or auto-generated)

#### Step 3.4: Configure Environment Variables

1. Go to: https://app.netlify.com
2. Click on your site
3. Go to: **Site Settings** → **Environment Variables**
4. Add all variables (same as Vercel above)

#### Step 3.5: Deploy to Production
```bash
netlify deploy --prod
```

#### Step 3.6: Configure Custom Domain

1. Netlify Dashboard → **Site Settings** → **Domain Management**
2. Click **Add custom domain**
3. Enter: `rakb.ma`
4. Follow DNS instructions (similar to Vercel)

---

### **Option C: Deploy to Render**

#### Step 3.1: Connect GitHub Repository

1. Go to: https://dashboard.render.com
2. Click **New +** → **Static Site**
3. Connect your GitHub account
4. Select repository: `hadfi53/rakb`
5. Configure:
   - **Name:** `rakeb-website`
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

#### Step 3.2: Configure Environment Variables

1. In Render dashboard → Your service → **Environment**
2. Add all environment variables

#### Step 3.3: Configure Custom Domain

1. Render dashboard → **Settings** → **Custom Domains**
2. Add `rakb.ma`
3. Follow DNS instructions

---

## 🔧 Step 4: Update DNS Records (if using custom domain)

**Important:** If `rakb.ma` is currently pointing to GitHub Pages, you need to update DNS:

### For Vercel:
```
Type: CNAME
Name: @ (or root)
Value: cname.vercel-dns.com
```

### For Netlify:
```
Type: CNAME
Name: @
Value: your-site-name.netlify.app
```

### For Render:
Follow instructions shown in Render dashboard.

**DNS Changes:**
1. Go to your domain registrar (where you bought rakb.ma)
2. Find DNS management section
3. Remove old GitHub Pages DNS records
4. Add new records based on your hosting platform
5. Wait 5-30 minutes for propagation

---

## ✅ Step 5: Verify Deployment

### 5.1: Test the Website

1. Visit your deployment URL (provided by platform)
2. Check:
   - ✅ Homepage loads
   - ✅ No console errors (F12 → Console)
   - ✅ Images load correctly
   - ✅ Can navigate between pages

### 5.2: Test Custom Domain

1. Visit `https://rakb.ma`
2. Verify SSL certificate is active (🔒 in browser)
3. Test all major features:
   - User registration/login
   - Vehicle search
   - Booking flow (in test mode)
   - Payment form displays

### 5.3: Check Environment Variables

1. Open browser DevTools (F12)
2. Go to **Console**
3. Variables starting with `VITE_` should be available
4. **DO NOT** check for secret keys (they should be in Supabase Edge Functions only)

---

## 🔐 Step 6: Configure Supabase Edge Functions

**Important:** These secrets are separate from frontend environment variables!

1. Go to: https://supabase.com/dashboard/project/_/functions
2. Click on each Edge Function → **Settings** → **Secrets**
3. Add:
   ```
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
   SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=re_9Q24cFrs_JrdqYVHrFj69pvotjjUvbmxB
   CONTACT_EMAIL=contact@rakb.ma
   ```

---

## 🚨 Step 7: Remove Old GitHub Pages Deployment (if applicable)

If `rakb.ma` was using GitHub Pages:

1. Go to: https://github.com/hadfi53/rakb/settings/pages
2. Scroll to **Custom domain**
3. Remove `rakb.ma` from custom domain field
4. Save changes
5. GitHub Pages will be disabled for this repository

---

## 📝 Step 8: Post-Deployment Checklist

- [ ] Website loads at `https://rakb.ma`
- [ ] SSL certificate active (🔒 icon)
- [ ] All pages accessible
- [ ] User registration works
- [ ] Login works
- [ ] Vehicle search works
- [ ] Booking flow works (test mode)
- [ ] Payment form displays (test mode)
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Contact form works
- [ ] Environment variables set correctly
- [ ] Supabase connection works
- [ ] Stripe integration works (test mode)

---

## 🔄 Step 9: Enable Auto-Deployment

### Vercel:
- ✅ Already enabled by default
- Every push to `main` branch auto-deploys

### Netlify:
- ✅ Already enabled by default
- Every push to `main` branch auto-deploys

### Render:
- ✅ Already enabled by default
- Every push to `main` branch auto-deploys

---

## 🆘 Troubleshooting

### Issue: Website shows 404 or blank page
**Solution:**
- Check build command is `npm run build`
- Check output directory is `dist`
- Verify environment variables are set
- Check build logs in hosting platform

### Issue: Environment variables not working
**Solution:**
- Variables must start with `VITE_` to be exposed to browser
- Restart deployment after adding variables
- Check browser console for errors

### Issue: Domain not connecting
**Solution:**
- Wait 24-48 hours for DNS propagation
- Check DNS records are correct
- Verify SSL certificate is issued

### Issue: Stripe payment not working
**Solution:**
- Check you're using correct key (test vs live)
- Verify Stripe webhook is configured
- Check Supabase Edge Function secrets

---

## 📞 Next Steps

1. **Test thoroughly** before switching to LIVE Stripe keys
2. **Monitor** first few deployments for errors
3. **Set up** error tracking (Sentry, LogRocket, etc.)
4. **Configure** analytics (Google Analytics or Plausible)
5. **Document** your deployment process

---

**Last Updated:** November 2, 2025  
**Status:** Ready for deployment

