# 📧 Resend Email Testing Guide

This guide explains how to test Resend email notifications for all events in the RAKB application.

## 🎯 Overview

The application now sends emails via Resend for **all major events**:
- ✅ User registration
- ✅ Booking created/confirmed/rejected/cancelled
- ✅ Payment received
- ✅ Messages received
- ✅ Reviews received
- ✅ Tenant/Host verification approved
- ✅ Password reset

## 🏗️ Architecture

### Components

1. **`send-event-email` Edge Function** (`supabase/functions/send-event-email/`)
   - Main email service with templates for all event types
   - Directly calls Resend API

2. **`process-email-queue` Edge Function** (`supabase/functions/process-email-queue/`)
   - Processes queued emails from database
   - Can be called manually or via cron job

3. **Database Triggers** (`supabase/migrations/20250131_email_notifications_all_events.sql`)
   - Automatically queue emails when events occur
   - Triggers on bookings, profiles, messages, reviews, payments

4. **Email Service Helper** (`src/lib/email-service.ts`)
   - Frontend helper functions to send emails programmatically

## 🔧 Setup

### 1. Deploy Edge Functions

```bash
# Deploy send-event-email function
supabase functions deploy send-event-email

# Deploy process-email-queue function
supabase functions deploy process-email-queue

# Deploy updated contact-form (if needed)
supabase functions deploy contact-form
```

### 2. Configure Secrets

In Supabase Dashboard → Edge Functions → Secrets:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_APP_URL=https://rakb.ma
```

### 3. Apply Migration

```bash
# Apply the email notifications migration
supabase db push

# Or manually in Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20250131_email_notifications_all_events.sql
```

### 4. Setup Cron Job (Optional)

To automatically process queued emails, set up a cron job:

**Option A: Supabase Cron (if available)**
```sql
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://kcujctyosmjlofppntfb.supabase.co/functions/v1/process-email-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Option B: External Cron Service**
Use a service like cron-job.org or GitHub Actions to call:
```
POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/process-email-queue
Headers: Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

## 🧪 Testing Methods

### Method 1: Test via Application (Automatic Triggers)

1. **User Registration**
   - Navigate to `/register`
   - Sign up with a new account
   - ✅ Check email inbox for welcome email

2. **Booking Created**
   - As a renter, create a booking
   - ✅ Owner should receive email notification

3. **Booking Confirmed**
   - As owner, accept a booking
   - ✅ Renter should receive confirmation email

4. **Booking Rejected**
   - As owner, reject a booking
   - ✅ Renter should receive rejection email

5. **Booking Cancelled**
   - Cancel an existing booking
   - ✅ Both parties should receive cancellation email

6. **Message Received**
   - Send a message to another user
   - ✅ Recipient should receive email notification

7. **Review Received**
   - Leave a review for a vehicle
   - ✅ Owner should receive email notification

8. **Verification Approved**
   - As admin, approve tenant/host verification
   - ✅ User should receive approval email

### Method 2: Test via Browser Console

Open browser console on your app and run:

```javascript
// Import email service
const { sendEventEmail } = await import('/src/lib/email-service.ts');

// Test user registration email
await sendEventEmail({
  event_type: 'user_registered',
  recipient_email: 'your-email@example.com',
  recipient_name: 'Test User',
  data: {
    user_id: 'test-id',
    first_name: 'Test',
    email: 'your-email@example.com'
  }
});
```

### Method 3: Test via Edge Function Directly

```bash
# Using curl
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/send-event-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking_created",
    "recipient_email": "test@example.com",
    "recipient_name": "Test User",
    "data": {
      "booking_id": "123",
      "vehicle_name": "Test Car 2024",
      "renter_name": "John Doe",
      "start_date": "01/02/2025",
      "end_date": "05/02/2025",
      "total_price": 500
    }
  }'
```

### Method 4: Test All Event Types Script

Create `test-all-emails.js`:

```javascript
// Test all email event types
const TEST_EMAIL = 'your-test-email@example.com';
const SUPABASE_URL = 'https://kcujctyosmjlofppntfb.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key';

const eventTypes = [
  {
    event_type: 'user_registered',
    data: { user_id: 'test-1', first_name: 'Test', email: TEST_EMAIL }
  },
  {
    event_type: 'booking_created',
    data: {
      booking_id: 'test-2',
      vehicle_name: 'Test Vehicle 2024',
      renter_name: 'John Doe',
      renter_email: 'renter@example.com',
      start_date: '01/02/2025',
      end_date: '05/02/2025',
      total_price: 500
    }
  },
  {
    event_type: 'booking_confirmed',
    data: {
      booking_id: 'test-3',
      vehicle_name: 'Test Vehicle 2024',
      start_date: '01/02/2025',
      end_date: '05/02/2025',
      total_price: 500
    }
  },
  {
    event_type: 'booking_rejected',
    data: {
      booking_id: 'test-4',
      vehicle_name: 'Test Vehicle 2024',
      rejection_reason: 'Vehicle unavailable'
    }
  },
  {
    event_type: 'message_received',
    data: {
      message_id: 'test-5',
      sender_name: 'Test Sender',
      message_content: 'This is a test message'
    }
  },
  {
    event_type: 'review_received',
    data: {
      review_id: 'test-6',
      vehicle_name: 'Test Vehicle 2024',
      reviewer_name: 'Test Reviewer',
      rating: 5,
      comment: 'Great vehicle!'
    }
  },
  {
    event_type: 'tenant_verification_approved',
    data: { user_id: 'test-7', first_name: 'Test' }
  },
  {
    event_type: 'host_verification_approved',
    data: { user_id: 'test-8', first_name: 'Test' }
  },
  {
    event_type: 'payment_received',
    data: {
      payment_id: 'test-9',
      amount: 500,
      booking_id: 'test-booking'
    }
  }
];

async function testAllEmails() {
  console.log(`Testing ${eventTypes.length} email types...`);
  
  for (const event of eventTypes) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-event-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          event_type: event.event_type,
          recipient_email: TEST_EMAIL,
          recipient_name: 'Test User',
          data: event.data
        })
      });

      const result = await response.json();
      console.log(`✅ ${event.event_type}:`, result.success ? 'Sent' : 'Failed', result);
    } catch (error) {
      console.error(`❌ ${event.event_type}:`, error.message);
    }
    
    // Wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Test complete! Check your email inbox.');
}

testAllEmails();
```

Run with:
```bash
node test-all-emails.js
```

### Method 5: Check Email Queue

View queued emails in database:

```sql
-- View pending emails
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;

-- View sent emails
SELECT * FROM email_logs 
WHERE status = 'sent' 
ORDER BY created_at DESC 
LIMIT 10;

-- View failed emails
SELECT * FROM email_logs 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 10;
```

Process queue manually:
```bash
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 📊 Monitoring

### Resend Dashboard
- Visit: https://resend.com/emails
- View sent emails, delivery status, open rates

### Email Logs
Check `email_logs` table in Supabase:
```sql
SELECT 
  email_type,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_sent
FROM email_logs
GROUP BY email_type, status
ORDER BY last_sent DESC;
```

### Queue Status
```sql
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;
```

## 🔍 Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**
   ```bash
   # In Supabase Dashboard → Edge Functions → Secrets
   # Verify RESEND_API_KEY is set correctly
   ```

2. **Check Edge Function Logs**
   - Supabase Dashboard → Edge Functions → `send-event-email` → Logs
   - Look for errors or API responses

3. **Check Email Queue**
   ```sql
   SELECT * FROM email_queue WHERE status = 'error' LIMIT 5;
   ```

4. **Verify Domain in Resend**
   - Resend Dashboard → Domains
   - Ensure `rakb.ma` domain is verified

### Emails Going to Spam

- Verify SPF/DKIM records in Resend
- Use verified sender email addresses
- Avoid spam trigger words in subject/content
- Test email deliverability in Resend dashboard

### Queue Not Processing

1. **Manually Process Queue**
   ```bash
   curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/process-email-queue \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
   ```

2. **Check Queue Size**
   ```sql
   SELECT COUNT(*) FROM email_queue WHERE status = 'pending';
   ```

3. **Set Up Cron Job** (see Setup section above)

## ✅ Verification Checklist

- [ ] Resend API key configured in Supabase secrets
- [ ] Edge functions deployed
- [ ] Database migration applied
- [ ] Test email sent successfully
- [ ] All event types tested
- [ ] Email queue processing works
- [ ] Emails appear in Resend dashboard
- [ ] Domain verified in Resend (if using custom domain)

## 📚 Related Files

- `supabase/functions/send-event-email/index.ts` - Main email service
- `supabase/functions/process-email-queue/index.ts` - Queue processor
- `supabase/migrations/20250131_email_notifications_all_events.sql` - Database triggers
- `src/lib/email-service.ts` - Frontend helper functions
- `supabase/functions/contact-form/index.ts` - Contact form emails

## 🚀 Next Steps

1. Deploy Edge Functions
2. Apply migration
3. Configure secrets
4. Test one event type
5. Verify in Resend dashboard
6. Test all event types
7. Set up cron job for queue processing
8. Monitor email delivery rates

---

**Last Updated:** January 31, 2025  
**Status:** ✅ Ready for Testing

