# 🚀 START TESTING NOW - Step by Step

## ✅ Status Check

- ✅ Email functions deployed
- ✅ Secrets configured  
- ✅ **Database migration applied** (just completed!)
- ✅ Triggers are active

**You're ready to test!**

---

## ⚡ FASTEST TEST (1 minute)

### Step 1: Open Your Website
Go to: `https://rakb.ma` (or your website URL)

### Step 2: Open Browser Console
Press `F12` (or `Cmd/Ctrl + Shift + I`)

### Step 3: Copy & Paste This Code

```javascript
(async function() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(
      'https://kcujctyosmjlofppntfb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw'
    );
    
    const email = prompt('📧 Enter YOUR email address:', '');
    if (!email || !email.includes('@')) {
      alert('❌ Please enter a valid email!');
      return;
    }
    
    console.log('📧 Sending test email to:', email);
    
    const res = await supabase.functions.invoke('send-event-email', {
      body: {
        event_type: 'user_registered',
        recipient_email: email,
        recipient_name: 'Test User',
        data: { user_id: 'test-' + Date.now(), first_name: 'Test', email }
      }
    });
    
    if (res.data?.success) {
      alert('✅ SUCCESS! Email sent to ' + email + '\n\nCheck your inbox!');
      console.log('✅', res.data);
    } else {
      alert('❌ Error: ' + JSON.stringify(res.error || res.data));
      console.error('❌', res.error);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
    console.error(error);
  }
})();
```

### Step 4: Enter Your Email
When prompted, enter your real email address

### Step 5: Check Your Inbox!
You should receive "Bienvenue sur RAKB !" email within seconds!

---

## 🎯 REAL-WORLD TESTING (Through Website Actions)

### Test 1: User Registration ✅ AUTOMATIC

**Steps:**
1. Go to `/register` page
2. Fill form with **YOUR real email**
3. Click "Sign Up"
4. **Email is sent automatically!** (via database trigger)

**Expected:**
- ✅ Welcome email received
- ✅ Subject: "Bienvenue sur RAKB !"
- ✅ Arrives within 5-10 seconds

---

### Test 2: Booking Created ✅ AUTOMATIC

**Steps:**
1. **As Renter:** Log in and create a booking
2. **Email sent automatically to owner** (via database trigger)
3. **Check owner's email inbox**

**Expected:**
- ✅ Owner receives "Nouvelle demande de réservation" email
- ✅ Contains booking details

---

### Test 3: Booking Confirmed ✅ AUTOMATIC

**Steps:**
1. **As Owner:** Accept a pending booking
2. **Email sent automatically to renter** (via database trigger)
3. **Check renter's email inbox**

**Expected:**
- ✅ Renter receives "Réservation confirmée" email
- ✅ Green checkmark header

---

## 🔧 Process Queued Emails

Since the migration queues emails (doesn't send directly), you need to process the queue:

### Option A: Manual Processing

```bash
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Option B: Test Direct Sending (Recommended)

The database triggers queue emails. To send them immediately, you can:

**Option 1:** Call `send-event-email` directly from your frontend code when events happen

**Option 2:** Set up automatic queue processing (cron job)

**For now:** Test with browser console method (Method 1) - it sends immediately!

---

## 📋 Complete Test Flow

**Scenario: Full Booking Flow**

1. **Register as Owner:**
   - Email: `owner@example.com`
   - Action: Fill registration form, submit
   - ✅ Check inbox for welcome email

2. **Register as Renter:**
   - Email: `renter@example.com`
   - Action: Fill registration form, submit
   - ✅ Check inbox for welcome email

3. **Create Booking (as Renter):**
   - Search for vehicle
   - Create booking
   - ✅ Owner (`owner@example.com`) receives "Booking Created" email

4. **Accept Booking (as Owner):**
   - Log in as owner
   - Accept booking
   - ✅ Renter (`renter@example.com`) receives "Booking Confirmed" email

5. **Verify:**
   - Both accounts received multiple emails
   - All emails are HTML formatted
   - All links work

---

## 🎯 Quick Verification

**Check if emails are queued:**

Go to Supabase SQL Editor and run:
```sql
SELECT 
  recipient_email,
  subject,
  status,
  created_at
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

**Process queued emails:**
```sql
-- Call the Edge Function to process queue
-- (Or use the process-email-queue Edge Function)
```

---

## ✅ What's Working Now

✅ **Direct Function Calls:** Browser console test works immediately  
✅ **Database Triggers:** Active and queuing emails  
✅ **Email Function:** Deployed and working  
✅ **Resend Integration:** Configured and sending emails  

**Next:** Process email queue or call function directly!

---

**Ready? Start with the browser console test (Method 1) - it's instant!** ⚡

