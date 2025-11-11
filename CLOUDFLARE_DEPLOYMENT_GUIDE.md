# 🚀 Cloudflare Pages Deployment Guide for RAKB

**Platform:** Cloudflare Pages + GitHub  
**Domain:** rakb.ma  
**Repository:** https://github.com/hadfi53/rakb

---

## 📋 Step 1: Prerequisites

Before starting, ensure you have:
- ✅ GitHub repository updated with new code (`https://github.com/hadfi53/rakb`)
- ✅ Cloudflare account (free tier works)
- ✅ Domain `rakb.ma` managed in Cloudflare (DNS)

---

## 🌐 Step 2: Connect GitHub Repository to Cloudflare Pages

### 2.1: Access Cloudflare Pages

1. Go to: https://dash.cloudflare.com
2. In the left sidebar, click **Pages**
3. Click **Create a project**

### 2.2: Connect GitHub Repository

1. Click **Connect to Git**
2. Select **GitHub** as your Git provider
3. Authorize Cloudflare to access your GitHub account (if not already done)
4. Select repository: **hadfi53/rakb**
5. Click **Begin setup**

### 2.3: Configure Build Settings

**Project name:** `rakeb-website` (or your preference)

**Production branch:** `main`

**Build settings:**
- **Framework preset:** `Vite` (or `Create React App` if Vite not available)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave empty or set to `/`)

**Note:** If Vite is not in the preset list:
- Select **None** or **Other**
- Then configure manually below

### 2.4: Environment Variables

**IMPORTANT:** Set these BEFORE first deployment!

Click **Add environment variable** for each:

#### Required Variables:

```
Variable name: VITE_SUPABASE_URL
Value: https://kcujctyosmjlofppntfb.supabase.co
Environment: Production, Preview, Browser Preview
```

```
Variable name: VITE_SUPABASE_ANON_KEY
Value: your_anon_key_here
Environment: Production, Preview, Browser Preview
```

```
Variable name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... (or pk_test_... for testing)
Environment: Production, Preview, Browser Preview
```

```
Variable name: VITE_APP_URL
Value: https://rakb.ma
Environment: Production, Preview, Browser Preview
```

```
Variable name: VITE_APP_NAME
Value: RAKB
Environment: Production, Preview, Browser Preview
```

#### Optional Variables:

```
Variable name: VITE_GA_MEASUREMENT_ID
Value: G-XXXXXXXXXX
Environment: Production (only)
```

```
Variable name: VITE_PLAUSIBLE_DOMAIN
Value: rakb.ma
Environment: Production (only)
```

```
Variable name: VITE_MAPBOX_TOKEN
Value: pk.xxxxx
Environment: Production, Preview, Browser Preview
```

**How to add variables:**
1. Scroll down to **Environment variables** section
2. Click **Add variable**
3. Enter name and value
4. Select environments (Production, Preview, Browser Preview)
5. Click **Save**

### 2.5: Advanced Build Settings (Optional)

If needed, add custom build settings:

**Node version:**
- Key: `NODE_VERSION`
- Value: `20.9.0`

### 2.6: Deploy

1. Review all settings
2. Click **Save and Deploy**
3. Wait for build to complete (2-5 minutes)

---

## 🔗 Step 3: Configure Custom Domain (rakb.ma)

### 3.1: Add Custom Domain in Cloudflare Pages

1. After deployment succeeds, go to your project dashboard
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `rakb.ma`
5. Click **Continue**

### 3.2: Configure DNS in Cloudflare

Cloudflare will show you the DNS records needed. Since your domain is already in Cloudflare:

**Option 1: CNAME Record (Recommended)**
1. Go to Cloudflare Dashboard → Select `rakb.ma` domain
2. Click **DNS** → **Records**
3. Find existing `rakb.ma` record (if any)
4. Update or create:
   - **Type:** `CNAME`
   - **Name:** `@` (or leave blank for root)
   - **Target:** `rakeb-website.pages.dev` (Cloudflare will show exact value)
   - **Proxy status:** Proxied (orange cloud) ✅
   - Click **Save**

**Option 2: If CNAME doesn't work, use A Record**
- Cloudflare Pages will provide IP addresses
- Create A record pointing to those IPs
- But CNAME is preferred

### 3.3: Wait for SSL Certificate

1. Cloudflare will automatically issue SSL certificate
2. Usually takes 5-15 minutes
3. You'll see SSL status in **Custom domains** section
4. Status will change from "Pending" to "Active"

### 3.4: Verify Domain

1. Visit `https://rakb.ma`
2. Should load your new React website
3. Check SSL certificate (🔒 icon in browser)

---

## 🔄 Step 4: Configure Auto-Deployments

Cloudflare Pages automatically deploys when you push to GitHub:

### Automatic Deployments:
- **Production:** Pushes to `main` branch → Production deployment
- **Preview:** Pull requests → Preview deployments
- **Build logs:** Available in Cloudflare Dashboard

### Manual Deployments:
1. Cloudflare Dashboard → Your project
2. Click **Deployments** tab
3. Find previous deployment
4. Click **Retry deployment** or **Create deployment**

---

## 🔧 Step 5: Update Build Configuration (if needed)

If you need to customize build settings later:

1. Cloudflare Dashboard → Your project → **Settings** → **Builds & deployments**
2. Update:
   - Build command
   - Output directory
   - Node version
   - Environment variables

---

## 🗂️ Step 6: Handle SPA Routing (React Router)

Your React app uses client-side routing. Cloudflare Pages needs to serve `index.html` for all routes.

### Solution: _redirects file (already in your project)

Your `public/_redirects` file should contain:
```
/*    /index.html   200
```

This is already configured in your project! ✅

**Verify:**
- File exists: `public/_redirects`
- Contains: `/*    /index.html   200`

If missing, Cloudflare will automatically add it, but it's better to have it in your repo.

---

## 📝 Step 7: Update Environment Variables Later

To update environment variables:

1. Cloudflare Dashboard → Your project
2. Go to **Settings** → **Environment variables**
3. Edit existing variables or add new ones
4. Click **Save**
5. **Important:** After changing variables, trigger a new deployment:
   - Push a commit to `main` branch, OR
   - Go to **Deployments** → Click **Retry deployment** on latest deployment

---

## ✅ Step 8: Post-Deployment Verification

### 8.1: Test Website

Visit `https://rakb.ma` and verify:

- [ ] Homepage loads correctly
- [ ] No console errors (F12 → Console)
- [ ] SSL certificate active (🔒)
- [ ] Images load correctly
- [ ] Navigation works
- [ ] User registration form loads
- [ ] Login form loads

### 8.2: Test Build Process

1. Make a small change (e.g., update README)
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```
3. Watch Cloudflare Dashboard → Deployments
4. Verify new deployment starts automatically
5. Wait for completion (2-5 minutes)
6. Verify changes are live

### 8.3: Test Environment Variables

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Run: `console.log(import.meta.env.VITE_APP_NAME)`
4. Should output: `RAKB`
5. **Note:** Only `VITE_*` variables are accessible in browser
6. Secret keys should NOT be in environment variables (use Supabase Edge Functions)

---

## 🔐 Step 9: Supabase Edge Function Secrets (Separate from Pages)

**Important:** These are configured in Supabase, NOT Cloudflare!

1. Go to: https://supabase.com/dashboard/project/_/functions
2. For each Edge Function → **Settings** → **Secrets**:
   ```
   STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
   SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CONTACT_EMAIL=contact@rakb.ma
   ```

---

## 🚨 Troubleshooting

### Issue: Build fails

**Check build logs:**
1. Cloudflare Dashboard → Your project → **Deployments**
2. Click on failed deployment
3. View build logs
4. Common issues:
   - Missing environment variables → Add them
   - Wrong build command → Check `package.json` scripts
   - Node version mismatch → Set `NODE_VERSION` environment variable

### Issue: Website shows 404 for routes

**Solution:**
- Verify `public/_redirects` file exists with: `/*    /index.html   200`
- If missing, create it and push to GitHub
- Cloudflare will auto-deploy

### Issue: Environment variables not working

**Solution:**
- Variables must start with `VITE_` to be exposed to browser
- After adding/changing variables, trigger new deployment
- Clear browser cache and hard refresh (Cmd+Shift+R)

### Issue: Domain not connecting

**Solution:**
- Check DNS records in Cloudflare → DNS section
- Ensure CNAME record points to correct Pages subdomain
- Wait 15-30 minutes for DNS propagation
- Check SSL certificate status in Pages dashboard

### Issue: Old website still showing

**Solution:**
- Clear browser cache
- Clear Cloudflare cache:
  1. Cloudflare Dashboard → Your domain → **Caching** → **Purge Everything**
- Wait 5 minutes
- Check if DNS is pointing to correct location

---

## 📊 Step 10: Monitoring & Analytics

### View Deployments:
- Cloudflare Dashboard → Your project → **Deployments**
- See build status, logs, and deployment history

### View Analytics:
- Cloudflare Dashboard → Your project → **Analytics**
- See traffic, bandwidth, and performance metrics

### View Logs:
- Cloudflare Dashboard → Your project → **Deployments** → Click deployment → **Build logs**

---

## 🔄 Step 11: Update Deployment Settings

To change build settings after initial setup:

1. Cloudflare Dashboard → Your project
2. **Settings** → **Builds & deployments**
3. Update:
   - Framework preset
   - Build command
   - Build output directory
   - Root directory
4. Click **Save**
5. New deployment will use updated settings

---

## ✅ Final Checklist

- [ ] GitHub repository connected to Cloudflare Pages
- [ ] Build settings configured (Vite, npm run build, dist)
- [ ] All environment variables added (VITE_* variables)
- [ ] Custom domain `rakb.ma` added and configured
- [ ] DNS CNAME record pointing to Cloudflare Pages
- [ ] SSL certificate issued and active
- [ ] Website loads at `https://rakb.ma`
- [ ] All pages/routes work correctly
- [ ] Environment variables accessible in browser
- [ ] Auto-deployment working (test with a commit)
- [ ] Supabase Edge Function secrets configured
- [ ] No console errors on website
- [ ] Mobile responsive
- [ ] Performance acceptable (Lighthouse score)

---

## 🎯 Quick Command Reference

### Manual Deployment Trigger:
```bash
# Make a small change and push
git add .
git commit -m "Trigger deployment"
git push origin main
```

### Check Deployment Status:
- Visit: Cloudflare Dashboard → Pages → Your project → Deployments

### Clear Cloudflare Cache:
- Cloudflare Dashboard → Your domain → Caching → Purge Everything

---

## 📞 Support Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Cloudflare Status:** https://www.cloudflarestatus.com/
- **GitHub Issues:** Check your repository for deployment logs

---

**Last Updated:** November 2, 2025  
**Status:** Ready for Cloudflare Pages deployment  
**Repository:** https://github.com/hadfi53/rakb

