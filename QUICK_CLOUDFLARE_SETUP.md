# ⚡ Quick Cloudflare Pages Setup

## 🚀 Step-by-Step (5 Minutes)

### Step 1: Go to Cloudflare Pages
1. Visit: https://dash.cloudflare.com
2. Click **Pages** in left sidebar
3. Click **Create a project**

### Step 2: Connect GitHub
1. Click **Connect to Git**
2. Select **GitHub**
3. Authorize if needed
4. Select repository: **hadfi53/rakb**
5. Click **Begin setup**

### Step 3: Configure Build
- **Project name:** `rakeb-website`
- **Production branch:** `main`
- **Framework preset:** `Vite` (or select "None" and enter manually)
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### Step 4: Add Environment Variables (IMPORTANT!)
Click **Add environment variable** for each:

```
VITE_SUPABASE_URL = https://kcujctyosmjlofppntfb.supabase.co
VITE_SUPABASE_ANON_KEY = [your_anon_key]
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_... (or pk_test_...)
VITE_APP_URL = https://rakb.ma
VITE_APP_NAME = RAKB
```

**Set for:** Production, Preview, Browser Preview

### Step 5: Deploy
1. Click **Save and Deploy**
2. Wait 2-5 minutes for build

### Step 6: Add Custom Domain
1. After deployment → **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter: `rakb.ma`
4. Click **Continue**

### Step 7: Update DNS in Cloudflare
1. Go to Cloudflare Dashboard → **DNS** → **Records**
2. Find/create record for `rakb.ma`:
   - **Type:** `CNAME`
   - **Name:** `@` (or blank)
   - **Target:** `[your-project].pages.dev` (shown by Cloudflare)
   - **Proxy:** ✅ Proxied (orange cloud)
3. Click **Save**

### Step 8: Wait for SSL
- Cloudflare will auto-generate SSL certificate
- Takes 5-15 minutes
- Check status in **Custom domains** section

### Step 9: Test!
Visit: https://rakb.ma

---

## ✅ That's It!

Your site will auto-deploy whenever you push to `main` branch!

---

**Need detailed steps?** See `CLOUDFLARE_DEPLOYMENT_GUIDE.md`

