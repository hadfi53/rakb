# 🔄 Cloudflare Cache Fix Guide

## Problem: Old Version Still Showing on rakb.ma

Even after pushing to GitHub, Cloudflare may still serve a cached version.

---

## ✅ Solution 1: Clear Cloudflare Cache (Recommended)

### Step 1: Clear Cloudflare Pages Cache
1. Go to: https://dash.cloudflare.com
2. Navigate to **Pages** → Your project (`rakeb-website`)
3. Go to **Deployments** tab
4. Find the latest deployment (should show the new commit `943979c`)
5. If it's still building, wait for it to complete
6. If it's complete but still showing old version, click **Retry deployment**

### Step 2: Clear Browser Cache
1. **Chrome/Edge:** Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Or do a **Hard Refresh:**
   - Windows: `Ctrl+F5` or `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

### Step 3: Clear Cloudflare CDN Cache (If Still Not Working)
1. Go to Cloudflare Dashboard
2. Select your domain: **rakb.ma**
3. Go to **Caching** → **Configuration**
4. Click **Purge Everything**
5. Wait 30 seconds
6. Refresh your browser

---

## ✅ Solution 2: Verify Deployment

### Check Deployment Status
1. Cloudflare Dashboard → **Pages** → Your project
2. Check **Deployments** tab
3. Latest deployment should show:
   - ✅ Status: **Success**
   - Commit: `943979c` (security(auth): redirect to login...)
   - Branch: `main`

### If Deployment Failed
1. Click on the failed deployment
2. Check build logs for errors
3. Fix any errors and push again

---

## ✅ Solution 3: Force New Deployment

### Manual Deployment
1. Cloudflare Dashboard → **Pages** → Your project
2. Go to **Deployments** tab
3. Click **Create deployment**
4. Select branch: `main`
5. Click **Deploy**

---

## ✅ Solution 4: Add Cache-Busting Headers

If the issue persists, we can add cache-busting to your build. The `vite.config.ts` already has cache-busting built-in via file hashing, but we can also add headers.

### Check Current Build Output
Your Vite build already includes content hashing in filenames (e.g., `index-abc123.js`), which should prevent caching issues.

---

## 🔍 Verification Steps

After clearing cache:

1. **Visit:** https://rakb.ma
2. **Open DevTools:** `F12` or `Right-click → Inspect`
3. **Go to Network tab**
4. **Check "Disable cache" checkbox**
5. **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
6. **Verify:**
   - No translation/i18n code visible in source
   - No `t()` function calls
   - No `useTranslation` hooks
   - No `locales/` folder references

---

## ⚠️ Important Notes

- **Cloudflare Pages auto-deploys** when you push to `main` branch
- **First deployment** after a force push may take 3-5 minutes
- **Cache clearing** may take 1-2 minutes to propagate globally
- **Browser cache** can persist even after server cache is cleared

---

## 🆘 Still Not Working?

If you're still seeing the old version after:
1. ✅ Verified deployment succeeded
2. ✅ Cleared Cloudflare cache
3. ✅ Cleared browser cache
4. ✅ Hard refreshed

Then:
1. Check Cloudflare Pages **Settings** → **Builds & deployments**
2. Verify **Production branch** is set to `main`
3. Check if there are multiple deployments and which one is "Active"
4. Try accessing via direct Pages URL: `https://[project-name].pages.dev` (without custom domain)

---

## 📝 Current Status

**Main branch:** `943979c` (pre-translation state)  
**Deployed:** Should auto-deploy from `main`  
**Last push:** Force pushed to `main` at `943979c`

