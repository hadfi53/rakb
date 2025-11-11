# 🚀 Step-by-Step: Deploy Email Functions (Secrets Already Configured)

**Status:** ✅ Secrets configured (RESEND_API_KEY, VITE_APP_URL)  
**Next:** Deploy functions and test

---

## Step 1: Verify You're in the Right Directory

```bash
cd "/Users/hamzahadfi/Desktop/RAKeB/untitled folder/rakeb-website-cursor"
pwd
```

Should show: `/Users/hamzahadfi/Desktop/RAKeB/untitled folder/rakeb-website-cursor`

---

## Step 2: Login to Supabase (if not already)

```bash
supabase login
```

This will open a browser window for authentication.

---

## Step 3: Link to Your Project

```bash
supabase link --project-ref kcujctyosmjlofppntfb
```

Expected output:
```
Linked to project kcujctyosmjlofppntfb
```

---

## Step 4: Deploy send-event-email Function

```bash
supabase functions deploy send-event-email --project-ref kcujctyosmjlofppntfb
```

**What to expect:**
- ✅ "Deploying send-event-email..."
- ✅ "Function send-event-email deployed successfully"

**If you see errors:**
- `"Function not found"` → Check that `supabase/functions/send-event-email/index.ts` exists
- `"Not authenticated"` → Run `supabase login` again
- `"Project not linked"` → Run `supabase link` command above

---

## Step 5: Deploy process-email-queue Function

```bash
supabase functions deploy process-email-queue --project-ref kcujctyosmjlofppntfb
```

**What to expect:**
- ✅ "Deploying process-email-queue..."
- ✅ "Function process-email-queue deployed successfully"

---

## Step 6: Verify Deployment

### Method A: Check in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions
2. Look for:
   - ✅ `send-event-email` (should be listed)
   - ✅ `process-email-queue` (should be listed)

### Method B: Check via CLI

```bash
supabase functions list --project-ref kcujctyosmjlofppntfb | grep -E "send-event|process-email"
```

Should show both functions.

---

## Step 7: Verify Secrets Are Attached

1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions
2. Click on `send-event-email`
3. Go to "Settings" or "Secrets" tab
4. Verify you see:
   - ✅ `RESEND_API_KEY` (value hidden as `***`)
   - ✅ `VITE_APP_URL` = `https://rakb.ma`
   - (Optional) `SUPABASE_URL`
   - (Optional) `SUPABASE_SERVICE_ROLE_KEY`

**Note:** If secrets are missing from the function, you may need to set them again specifically for this function, or they might be at the project level.

---

## Step 8: Test the Email Function

### Get Your Anon Key

1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/settings/api
2. Copy the "anon public" key

### Send Test Email

Replace `YOUR_ANON_KEY` and `your-email@example.com`:

```bash
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/send-event-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_registered",
    "recipient_email": "your-email@example.com",
    "recipient_name": "Test User",
    "data": {
      "user_id": "test-123",
      "first_name": "Test",
      "email": "your-email@example.com"
    }
  }'
```

### Expected Success Response:

```json
{
  "success": true,
  "message": "Email sent successfully",
  "email_id": "re_abc123xyz..."
}
```

### Check Your Email Inbox

- ✅ Subject: "Bienvenue sur RAKB !"
- ✅ HTML formatted welcome email
- ✅ Check spam folder if not in inbox

---

## Step 9: Check Function Logs (if email didn't arrive)

1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions/send-event-email/logs
2. Look for:
   - ✅ Success messages: "Email sent successfully"
   - ❌ Errors: "RESEND_API_KEY not configured" or other errors

---

## Step 10: Troubleshooting

### Problem: "RESEND_API_KEY not configured" error

**Solution:**
1. Go to Dashboard → Functions → `send-event-email` → Secrets
2. Verify `RESEND_API_KEY` is set
3. If missing, add it:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Redeploy function:
   ```bash
   supabase functions deploy send-event-email --project-ref kcujctyosmjlofppntfb
   ```

### Problem: Function deployed but not visible

**Solution:**
- Wait 30 seconds and refresh dashboard
- Check you're looking at the correct project
- Try deploying again

### Problem: Email sent but not received

**Check:**
1. Spam/junk folder
2. Resend Dashboard: https://resend.com/emails
3. Function logs for delivery status

---

## ✅ Completion Checklist

- [ ] Functions deployed (`send-event-email`, `process-email-queue`)
- [ ] Functions visible in Supabase Dashboard
- [ ] Secrets verified in Dashboard
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] No errors in function logs

---

## 🎯 Next Steps After Deployment

1. **Apply database migration:**
   ```bash
   supabase db push
   ```

2. **Test automatic triggers:**
   - Create a test user account
   - Create a test booking
   - Verify emails are sent automatically

3. **Set up queue processor (optional):**
   - Set up cron job to process email queue every 5 minutes
   - Or manually trigger: `process-email-queue` function

---

**Ready to start? Begin with Step 1!** 🚀

