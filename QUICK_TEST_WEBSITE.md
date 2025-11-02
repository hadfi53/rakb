# 🚀 Quick Test Guide - Real Website

Fastest way to test emails on your actual website.

---

## ⚡ Method 1: Browser Console Test (30 seconds)

### Step 1: Open Your Website
Go to: `https://rakb.ma` (or your website URL)

### Step 2: Open Browser Console
- **Chrome/Edge:** Press `F12` or `Cmd/Ctrl + Shift + I`
- **Firefox:** Press `F12` or `Cmd/Ctrl + Shift + K`
- **Safari:** Press `Cmd + Option + I`

### Step 3: Paste Test Code
Copy and paste this entire code block into the console:

```javascript
(async function() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(
      'https://kcujctyosmjlofppntfb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw'
    );
    
    const testEmail = prompt('Enter your email address:', 'your-email@example.com');
    if (!testEmail || testEmail.includes('example.com')) {
      alert('Please enter your real email!');
      return;
    }
    
    console.log('📧 Sending email to:', testEmail);
    const response = await supabase.functions.invoke('send-event-email', {
      body: {
        event_type: 'user_registered',
        recipient_email: testEmail,
        recipient_name: 'Test User',
        data: { user_id: 'test-' + Date.now(), first_name: 'Test', email: testEmail }
      }
    });
    
    if (response.data?.success) {
      alert('✅ Email sent! Check your inbox: ' + testEmail);
      console.log('✅ Success:', response.data);
    } else {
      alert('❌ Error: ' + JSON.stringify(response.error || response.data));
      console.error('❌ Error:', response.error);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
    console.error(error);
  }
})();
```

### Step 4: Press Enter
- The code will run
- A prompt will ask for your email address
- Enter your real email address
- Press OK

### Step 5: Check Your Email!
- ✅ You should receive "Bienvenue sur RAKB !" email
- ✅ Check spam folder if not in inbox

---

## 🎯 Method 2: Test Through Actual User Actions

### Test 1: Register New User (Easiest)

1. **Go to Registration Page:**
   - Visit: `https://rakb.ma/register` (or your signup URL)
   
2. **Fill Registration Form:**
   - Email: **Use YOUR real email** (the one you want to receive test emails)
   - Password: (choose a password)
   - First Name: Test
   - Last Name: User
   - Role: Select any role
   
3. **Click "Sign Up" or "Register"**

4. **Check Your Email Inbox:**
   - Subject: **"Bienvenue sur RAKB !"**
   - Should arrive within seconds

**Note:** This only works if database triggers are set up (after migration is applied)

---

## 📋 Before Testing - Verify Migration Applied

**IMPORTANT:** For automatic emails to work, you need to apply the database migration first!

### Check if Migration is Applied:

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/sql/new

2. **Run this query:**
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%email%';
```

3. **You should see triggers like:**
   - `send_email_on_user_registration`
   - `send_email_on_booking_created`
   - `send_email_on_booking_confirmed`
   - etc.

### If Triggers Don't Exist:

**Apply the migration:**
```bash
cd "/Users/hamzahadfi/Desktop/RAKeB/untitled folder/rakeb-website-cursor"
supabase db push
```

Or manually in Supabase Dashboard:
1. Go to SQL Editor
2. Open: `supabase/migrations/20250131_email_notifications_all_events.sql`
3. Copy and paste the entire file
4. Click "Run"

---

## 🧪 Complete Test Scenario

### Full Flow Test (5 minutes)

**Setup:**
- Email 1: `owner@example.com` (for owner account)
- Email 2: `renter@example.com` (for renter account)
- Email 3: `your-real-email@example.com` (your email)

**Steps:**

1. **Register as Owner:**
   - Use Email 1
   - Check inbox → Should receive welcome email ✅

2. **Register as Renter:**
   - Use Email 2
   - Check inbox → Should receive welcome email ✅

3. **Create Booking (as Renter):**
   - Search for vehicle (owned by Email 1)
   - Create booking
   - **Check Email 1 inbox** → Should receive "Booking Created" email ✅

4. **Accept Booking (as Owner):**
   - Log in with Email 1
   - Accept the booking
   - **Check Email 2 inbox** → Should receive "Booking Confirmed" email ✅

5. **Check All Inboxes:**
   - You should have received multiple emails!
   - All should be HTML formatted
   - All links should work

---

## 🔍 Verify Emails Are Being Sent

### Check Resend Dashboard:
1. Go to: https://resend.com/emails
2. View sent emails
3. Should see all your test emails listed
4. Check delivery status (should be "Delivered")

### Check Function Logs:
1. Go to: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/functions/send-event-email/logs
2. Look for:
   - ✅ "Email sent successfully" messages
   - ✅ Email IDs from Resend

### Check Database:
```sql
SELECT 
  email_type,
  recipient_email,
  status,
  created_at
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Testing Checklist

**Before Testing:**
- [ ] Database migration applied (`supabase db push`)
- [ ] Website is running and accessible
- [ ] Real email address ready

**During Testing:**
- [ ] Register new account → Check welcome email
- [ ] Create booking → Check owner receives email
- [ ] Accept booking → Check renter receives email
- [ ] Send message → Check recipient receives email
- [ ] Leave review → Check owner receives email

**After Testing:**
- [ ] All emails received
- [ ] Email content correct
- [ ] Links in emails work
- [ ] Resend dashboard shows sent emails

---

## 💡 Pro Tips

1. **Use Multiple Email Addresses:**
   - Create separate accounts for renter and owner
   - This lets you test both sides of bookings

2. **Check Spam Folder:**
   - Emails might go to spam initially
   - Mark as "Not Spam" to train your email provider

3. **Use Email Aliases:**
   - Gmail: `your-email+test1@gmail.com` and `your-email+test2@gmail.com`
   - All go to same inbox but look like different addresses

4. **Monitor Resend Dashboard:**
   - Real-time view of all sent emails
   - Delivery status and open rates

---

## 🐛 Quick Troubleshooting

**No email received after registration:**
- Check if migration was applied
- Check function logs for errors
- Verify email address is correct
- Check spam folder

**Email arrives but wrong content:**
- Check function logs
- Verify data is being passed correctly
- Check email_logs table for details

**Some events not sending:**
- Verify database triggers exist
- Check if migration was fully applied
- Review trigger logs

---

**Ready? Start with Method 1 (Browser Console) - it's the fastest!** ⚡

