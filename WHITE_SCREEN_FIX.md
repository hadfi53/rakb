# 🔧 White Screen Fix Guide

## Problem
The app shows a white screen, usually caused by missing environment variables or runtime errors.

## Quick Fix

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Look for any red error messages
4. Common errors:
   - `Missing VITE_SUPABASE_URL environment variable`
   - `Missing VITE_SUPABASE_ANON_KEY environment variable`
   - Import/module errors

### Step 2: Create `.env` File
Create a `.env` file in the root of your project:

```bash
# .env file (create this in project root)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key_here
```

### Step 3: Get Your Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 4: Restart Dev Server
After creating `.env`, restart your dev server:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Alternative: Check Error Boundary
If you see an error message in the UI, the ErrorBoundary is catching it. Check:
- `/contact` link - Should show a contact form
- Error message should indicate what's wrong

## Still Not Working?

### Check These Common Issues:

1. **`.env` file location**
   - Must be in project root (same level as `package.json`)
   - Not in `src/` folder

2. **Environment variables naming**
   - Must start with `VITE_` prefix
   - Case-sensitive

3. **Browser cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Import errors**
   - Check terminal for build errors
   - Run `npm install` to ensure dependencies are installed

## Debug Mode
Open browser console and look for:
- Red error messages
- Network errors (check Network tab)
- Component errors

## Need Help?
Share the console error message for specific assistance.

