# 🔧 Fix Domain Verification for Email Testing

## Quick Fix: Update Function to Use Resend Test Domain

If you want to test immediately before verifying your domain, you can temporarily update the function to use Resend's default test domain.

### Current Issue
The function uses `rakb.ma` emails which require domain verification.

### Temporary Solution
Update the function to use `onboarding@resend.dev` for testing.

### Steps

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions/send-event-email

2. **Edit the function code:**
   Find these lines (around line 518-525):
   ```typescript
   let fromEmail = "RAKB <noreply@rakb.ma>";
   if (emailRequest.event_type.includes("booking")) {
     fromEmail = "RAKB Réservations <reservations@rakb.ma>";
   } else if (emailRequest.event_type.includes("payment")) {
     fromEmail = "RAKB Paiements <payments@rakb.ma>";
   } else if (emailRequest.event_type.includes("message")) {
     fromEmail = "RAKB Messages <messages@rakb.ma>";
   }
   ```

3. **Replace with:**
   ```typescript
   let fromEmail = "RAKB <onboarding@resend.dev>";
   if (emailRequest.event_type.includes("booking")) {
     fromEmail = "RAKB Réservations <onboarding@resend.dev>";
   } else if (emailRequest.event_type.includes("payment")) {
     fromEmail = "RAKB Paiements <onboarding@resend.dev>";
   } else if (emailRequest.event_type.includes("message")) {
     fromEmail = "RAKB Messages <onboarding@resend.dev>";
   }
   ```

4. **Save and deploy**

5. **Test again** - emails should work!

**Note:** Remember to change back to `rakb.ma` once you verify your domain.

---

## Permanent Solution: Verify Domain

For production, verify your domain in Resend:

1. Go to: https://resend.com/domains
2. Click "Add Domain"
3. Enter: `rakb.ma`
4. Add DNS records provided by Resend
5. Wait for verification ✅
6. Change function back to use `rakb.ma` emails

---

## Test Command

```bash
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/send-event-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_registered",
    "recipient_email": "your-real-email@example.com",
    "recipient_name": "Test User",
    "data": {
      "user_id": "test-123",
      "first_name": "Test",
      "email": "your-real-email@example.com"
    }
  }'
```

After fixing, you should see:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "email_id": "re_..."
}
```

