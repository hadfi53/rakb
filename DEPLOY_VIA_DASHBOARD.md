# 📋 Deploy Email Functions via Supabase Dashboard

**Issue:** CLI deployment requires additional permissions  
**Solution:** Deploy via Dashboard (easier and works immediately)

---

## ✅ Option 1: Deploy via Supabase Dashboard (Recommended)

### Step 1: Access Edge Functions

1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions
2. Click "New Function" or "Create Function"

### Step 2: Deploy send-event-email

1. **Function Name:** `send-event-email`
2. **Code:** Copy content from `supabase/functions/send-event-email/index.ts`

**To get the code:**
```bash
cat supabase/functions/send-event-email/index.ts
```

Copy the entire file content.

3. **Deploy Settings:**
   - Verify JWT: ✅ Enabled
   - Import Map: Leave empty (if using Deno imports)

4. Click "Deploy"

### Step 3: Deploy process-email-queue

1. **Function Name:** `process-email-queue`
2. **Code:** Copy content from `supabase/functions/process-email-queue/index.ts`

**To get the code:**
```bash
cat supabase/functions/process-email-queue/index.ts
```

Copy the entire file content.

3. Click "Deploy"

---

## ✅ Option 2: Fix CLI Permissions (Alternative)

### Check Authentication

```bash
# Re-authenticate
supabase login --token YOUR_ACCESS_TOKEN
```

**To get access token:**
1. Go to: https://supabase.com/dashboard/account/tokens
2. Create new access token
3. Use it in the login command above

### Or Use Service Role Key

If you have service role key, try:
```bash
supabase functions deploy send-event-email \
  --project-ref kcujctyosmjlofppntfb \
  --access-token YOUR_ACCESS_TOKEN
```

---

## 📝 Quick Copy Commands

Run these to display the function code for copying:

### Display send-event-email code:
```bash
cd "/Users/hamzahadfi/Desktop/RAKeB/untitled folder/rakeb-website-cursor"
cat supabase/functions/send-event-email/index.ts
```

### Display process-email-queue code:
```bash
cat supabase/functions/process-email-queue/index.ts
```

---

## ✅ After Deployment - Verify Secrets

Once functions are deployed:

1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions
2. Click on `send-event-email`
3. Go to "Secrets" tab
4. Verify these are set:
   - ✅ `RESEND_API_KEY`
   - ✅ `VITE_APP_URL`
   - (Optional) `SUPABASE_URL`
   - (Optional) `SUPABASE_SERVICE_ROLE_KEY`

**If secrets are missing:**
- Click "Add Secret"
- Key: `RESEND_API_KEY`
- Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Click "Save"

---

## 🧪 Test After Deployment

1. Get your anon key: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/settings/api

2. Send test email:
```bash
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/send-event-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_registered",
    "recipient_email": "your-email@example.com",
    "recipient_name": "Test User",
    "data": {"user_id": "test", "first_name": "Test"}
  }'
```

3. Check email inbox (and spam folder)

---

**Recommended:** Use Dashboard method (Option 1) - it's faster and doesn't require CLI permissions! 🚀

