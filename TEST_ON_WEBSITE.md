# 🧪 Testing Email System on Real Website

Complete guide to test email notifications through actual user actions on your website.

---

## ✅ Prerequisites

- ✅ Email functions deployed
- ✅ Secrets configured
- ✅ Website is running
- ✅ Your real email address ready to receive test emails

---

## 🎯 Test Scenarios

### Test 1: User Registration Email

**How to test:**
1. Go to your website: `https://rakb.ma` (or your URL)
2. Navigate to `/register` or sign up page
3. Fill in registration form:
   - Email: **Use YOUR real email address** (the one you want to receive test emails)
   - Password: (choose a test password)
   - First Name: Test
   - Last Name: User
   - Role: Select "Renter" or "Owner"
4. Click "Sign Up" or "Register"
5. **Check your email inbox** (and spam folder)

**Expected Result:**
- ✅ Email received with subject: **"Bienvenue sur RAKB !"**
- ✅ Email contains welcome message
- ✅ Email has link to dashboard

**If email doesn't arrive:**
- Check spam/junk folder
- Verify registration was successful (check database or dashboard)
- Check function logs in Supabase Dashboard

---

### Test 2: Booking Created Email (Owner Receives)

**How to test:**
1. **As a Renter:**
   - Log in with a renter account
   - Search for a vehicle
   - Select dates
   - Complete booking form
   - Submit booking
   
2. **As the Owner:**
   - Log in with the owner account (owner of that vehicle)
   - **Check email inbox** for notification

**Expected Result:**
- ✅ Owner receives email with subject: **"Nouvelle demande de réservation - [Vehicle Name]"**
- ✅ Email contains:
  - Booking details
  - Renter information
  - Dates and price
  - "Gérer cette réservation" button

**Note:** This email is sent automatically when a booking is created (if database triggers are set up)

---

### Test 3: Booking Confirmed Email (Renter Receives)

**How to test:**
1. **As Owner:**
   - Log in as owner
   - Go to dashboard/owner bookings
   - Find the pending booking
   - Click "Accept" or "Confirm" booking
   
2. **As Renter:**
   - **Check email inbox**

**Expected Result:**
- ✅ Renter receives email with subject: **"Réservation confirmée - [Vehicle Name]"**
- ✅ Green header with checkmark
- ✅ Booking confirmation details
- ✅ Link to view booking

---

### Test 4: Booking Rejected Email (Renter Receives)

**How to test:**
1. **As Owner:**
   - Log in as owner
   - Go to dashboard/owner bookings
   - Find a pending booking
   - Click "Reject" or "Decline" booking
   - (Optional) Add rejection reason
   
2. **As Renter:**
   - **Check email inbox**

**Expected Result:**
- ✅ Renter receives email with subject: **"Réservation refusée - [Vehicle Name]"**
- ✅ Red header
- ✅ Rejection message
- ✅ Link to search other vehicles

---

### Test 5: Booking Cancelled Email (Both Parties Receive)

**How to test:**
1. **Cancel a booking:**
   - As renter OR owner, cancel an existing booking
   - Go to booking details
   - Click "Cancel Booking"
   
2. **Check both email inboxes** (renter and owner)

**Expected Result:**
- ✅ Both receive cancellation email
- ✅ Yellow/orange header
- ✅ Cancellation notification
- ✅ Refund information (if applicable)

---

### Test 6: Message Received Email

**How to test:**
1. **Send a message:**
   - As User A, go to messaging page
   - Find or start conversation with User B
   - Send a message to User B
   
2. **As User B:**
   - **Check email inbox**

**Expected Result:**
- ✅ User B receives email with subject: **"Nouveau message de [Sender Name]"**
- ✅ Email contains message preview
- ✅ "Répondre" button

---

### Test 7: Review Received Email (Owner Receives)

**How to test:**
1. **Leave a review:**
   - As a renter, complete a booking
   - Go to past bookings
   - Leave a review/rating for the vehicle
   
2. **As Owner:**
   - **Check email inbox**

**Expected Result:**
- ✅ Owner receives email with subject: **"Nouvel avis reçu - [Vehicle Name]"**
- ✅ Rating displayed (e.g., "5/5")
- ✅ Review comment (if provided)

---

### Test 8: Tenant Verification Approved Email

**How to test:**
1. **As Admin:**
   - Go to admin panel or dashboard
   - Find pending tenant verifications
   - Approve a tenant verification
   
2. **As the Tenant:**
   - **Check email inbox**

**Expected Result:**
- ✅ Tenant receives email with subject: **"Vérification locataire approuvée"**
- ✅ Green checkmark header
- ✅ Congratulations message
- ✅ Link to search vehicles

---

### Test 9: Host Verification Approved Email

**How to test:**
1. **As Admin:**
   - Go to admin panel
   - Find pending host verifications
   - Approve a host verification
   
2. **As the Host:**
   - **Check email inbox**

**Expected Result:**
- ✅ Host receives email with subject: **"Vérification propriétaire approuvée"**
- ✅ Green checkmark header
- ✅ Congratulations message
- ✅ Link to add vehicles

---

## 🛠️ Manual Test via Browser Console

If you want to test without going through the full flow, you can use the browser console:

### Open Browser Console
- Chrome/Edge: `F12` or `Cmd/Ctrl + Shift + I`
- Firefox: `F12` or `Cmd/Ctrl + Shift + K`
- Safari: `Cmd + Option + I`

### Run Test Code

```javascript
// Test email directly from browser
(async function() {
  try {
    // Get Supabase client (adjust import path if needed)
    const supabaseUrl = 'https://kcujctyosmjlofppntfb.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw';
    
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Replace with YOUR email address
    const yourEmail = 'your-email@example.com';
    
    console.log('📧 Sending test email...');
    
    const response = await supabase.functions.invoke('send-event-email', {
      body: {
        event_type: 'user_registered',
        recipient_email: yourEmail,
        recipient_name: 'Test User',
        data: {
          user_id: 'test-' + Date.now(),
          first_name: 'Test',
          email: yourEmail
        }
      }
    });
    
    console.log('✅ Response:', response);
    
    if (response.data?.success) {
      alert('✅ Email sent successfully! Check your inbox: ' + yourEmail);
    } else {
      alert('❌ Error: ' + JSON.stringify(response.error || response.data));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error: ' + error.message);
  }
})();
```

**Steps:**
1. Open your website in browser
2. Open browser console (F12)
3. Paste the code above
4. Replace `your-email@example.com` with your real email
5. Press Enter
6. Check your email!

---

## 📋 Complete Testing Checklist

### Website Testing Checklist

- [ ] **User Registration**
  - [ ] Register new account
  - [ ] Check email received (subject: "Bienvenue sur RAKB !")
  - [ ] Email renders correctly in inbox
  - [ ] Links in email work

- [ ] **Booking Flow**
  - [ ] Create booking as renter
  - [ ] Owner receives "Booking Created" email
  - [ ] Owner accepts booking
  - [ ] Renter receives "Booking Confirmed" email
  - [ ] Owner rejects booking
  - [ ] Renter receives "Booking Rejected" email
  - [ ] Cancel booking (as renter or owner)
  - [ ] Both parties receive "Booking Cancelled" email

- [ ] **Messages**
  - [ ] Send message to another user
  - [ ] Recipient receives "Message Received" email

- [ ] **Reviews**
  - [ ] Leave review for vehicle
  - [ ] Owner receives "Review Received" email

- [ ] **Verifications**
  - [ ] Approve tenant verification (as admin)
  - [ ] Tenant receives approval email
  - [ ] Approve host verification (as admin)
  - [ ] Host receives approval email

---

## 🔍 Verification Steps

### 1. Check Email Inbox
- Look for emails with subjects starting with:
  - "Bienvenue sur RAKB"
  - "Nouvelle demande de réservation"
  - "Réservation confirmée"
  - "Nouveau message"
  - etc.

### 2. Check Email Content
- ✅ Email should be HTML formatted
- ✅ All links should work
- ✅ Content matches the event type
- ✅ Branding/colors correct

### 3. Check Resend Dashboard
1. Go to: https://resend.com/emails
2. View sent emails
3. Check delivery status
4. View open/click rates (if available)

### 4. Check Function Logs
1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions/send-event-email/logs
2. Look for:
   - ✅ "Email sent successfully" messages
   - ❌ Any error messages

### 5. Check Database Logs
```sql
-- View email logs
SELECT 
  email_type,
  recipient_email,
  status,
  created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### Problem: Email not received after registration

**Check:**
1. Is registration successful? (check if user appears in database)
2. Are database triggers set up? (run migration if not done)
3. Check function logs for errors
4. Check spam folder

**Solution:**
```bash
# Apply database migration to enable triggers
supabase db push
```

### Problem: Email received but content is wrong

**Check:**
1. Function logs for template generation errors
2. Verify data is being passed correctly
3. Check email_logs table for error messages

### Problem: Some events not sending emails

**Check:**
1. Database triggers are created:
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE trigger_name LIKE '%email%';
   ```
2. Migration was applied:
   ```bash
   supabase db push
   ```

---

## 🎯 Quick Test (5 Minutes)

**Fastest way to test everything:**

1. **Register a new account** with your email
   - ✅ Tests: User registration email

2. **Create a booking** (as renter)
   - ✅ Tests: Booking created email (to owner)

3. **Accept the booking** (as owner)
   - ✅ Tests: Booking confirmed email (to renter)

4. **Check all inboxes** - Should have received 3 emails!

---

## 📊 Expected Results

After completing all tests, you should have received:

| Email Type | Recipient | Status |
|------------|-----------|--------|
| User Registered | New User | ✅ Received |
| Booking Created | Vehicle Owner | ✅ Received |
| Booking Confirmed | Renter | ✅ Received |
| Booking Rejected | Renter | ✅ Received |
| Booking Cancelled | Both | ✅ Received |
| Message Received | Message Recipient | ✅ Received |
| Review Received | Vehicle Owner | ✅ Received |
| Verification Approved | Verified User | ✅ Received |

---

**Ready to test? Start with Test 1 (User Registration) - it's the easiest!** 🚀

