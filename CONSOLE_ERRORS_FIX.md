# 🔧 Console Errors Fix Guide

## Errors You're Seeing

### 1. ✅ FIXED: Content Security Policy (CSP) Errors
**Error:** `Refused to execute a script because its hash... does not appear in the script-src directive`

**Fix Applied:** Updated `netlify.toml` and `vercel.json` with proper CSP headers allowing Stripe domains.

**Action Required:** 
- Restart your dev server
- Hard refresh browser (Cmd+Shift+R)

---

### 2. ⚠️ Missing Supabase Tables
**Error:** `Failed to load resource: 404 (email_queue)`

**Issue:** The `email_queue` and `email_logs` tables don't exist in your Supabase database.

**Fix:**
1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Run this migration:

```sql
-- Create email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  related_id UUID,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- Grant permissions
GRANT ALL ON public.email_queue TO authenticated;
GRANT ALL ON public.email_logs TO authenticated;
```

**Or use the migration file:**
- Run migration: `supabase/migrations/20240523_create_email_tables.sql`
- Or run via Supabase CLI: `supabase migration up`

---

### 3. ⚠️ Missing Supabase Storage Bucket
**Error:** `Failed to load resource: 404 (vehicles)`

**Issue:** The `vehicles` storage bucket doesn't exist or isn't public.

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Check if `vehicles` bucket exists
3. If not, create it:
   - Click "New bucket"
   - Name: `vehicles`
   - **Important:** Check "Public bucket" ✅
   - Click "Create bucket"
4. If it exists but is private:
   - Click on `vehicles` bucket
   - Go to Settings
   - Enable "Public bucket"
   - Save

---

### 4. ⚠️ Image Loading Errors
**Error:** `Failed to load resource: 400 (test-vehicle.jpg)`

**Issue:** Some test images don't exist or have incorrect paths.

**Fix:** 
- These are non-critical (test images)
- Real vehicle images should load fine if bucket is configured correctly
- If you see this on real vehicles, check image paths in database

---

### 5. ⚠️ Stripe Network Errors
**Error:** `XMLHttpRequest cannot load https://m.stripe.com/6`

**Issue:** Stripe measurement/analytics requests being blocked.

**Status:** These are non-critical - Stripe payment functionality will still work. They're just analytics/metrics requests.

**Optional Fix:** Already allowed in CSP, but may need browser refresh.

---

## Quick Fix Checklist

1. ✅ **CSP Headers Fixed** - Restart dev server
2. ⚠️ **Create email_queue table** - Run SQL migration above
3. ⚠️ **Create vehicles bucket** - Create public bucket in Supabase Storage
4. ✅ **Image errors** - Non-critical, ignore for now
5. ✅ **Stripe errors** - Non-critical analytics, payment will work

---

## Step-by-Step Fix

### Step 1: Fix CSP (Already Done)
Just restart your dev server:
```bash
npm run dev
```

### Step 2: Create Email Tables
1. Open Supabase Dashboard
2. SQL Editor
3. Copy/paste the SQL from section 2 above
4. Click "Run"

### Step 3: Fix Storage Bucket
1. Supabase Dashboard → Storage
2. Create `vehicles` bucket (if missing)
3. Make it **Public**
4. Save

### Step 4: Test
- Refresh browser
- Check console - errors should be gone
- Test image uploads
- Test contact form (uses email_queue)

---

## After Fixing

All errors should be resolved except:
- Stripe analytics errors (non-critical, can ignore)
- Test image errors (non-critical)

The app should work normally!

