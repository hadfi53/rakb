# 🧪 Simple Website Testing Guide

## 🚀 FASTEST WAY: Browser Console Test (30 seconds)

### Step-by-Step:

1. **Open Your Website**
   - Go to: `https://rakb.ma` (or your URL)

2. **Open Developer Console**
   - Press: `F12` (Windows/Linux)
   - Press: `Cmd + Option + I` (Mac)
   - Or right-click → "Inspect" → "Console" tab

3. **Copy & Paste This Code:**
```javascript
(async function() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(
    'https://kcujctyosmjlofppntfb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw'
  );
  
  const email = prompt('📧 Enter YOUR email address:');
  if (!email || !email.includes('@')) {
    alert('❌ Invalid email!');
    return;
  }
  
  const res = await supabase.functions.invoke('send-event-email', {
    body: {
      event_type: 'user_registered',
      recipient_email: email,
      recipient_name: 'Test User',
      data: { user_id: 'test-' + Date.now(), first_name: 'Test', email }
    }
  });
  
  if (res.data?.success) {
    alert('✅ Email sent! Check: ' + email);
    console.log('✅', res.data);
  } else {
    alert('❌ Error: ' + JSON.stringify(res.error || res.data));
  }
})();
```

4. **Press Enter**

5. **Enter Your Email** when prompted

6. **Check Your Inbox!**
   - Email should arrive within seconds
   - Subject: "Bienvenue sur RAKB !"

---

## 🎯 TEST THROUGH ACTUAL WEBSITE ACTIONS

### Test User Registration (Automatic Email)

1. **Go to Registration Page:**
   - Visit: `https://rakb.ma/register`

2. **Fill the Form:**
   - Email: **Use YOUR real email**
   - Password: (any password)
   - First Name: Test
   - Last Name: User
   - Role: Select "Renter" or "Owner"

3. **Click "Sign Up"**

4. **Check Your Email:**
   - Should receive welcome email automatically
   - If not received, check spam folder
   - If still not received, email was queued (see "Process Queue" below)

---

### Test Booking Flow (Automatic Emails)

**Setup:** You need 2 accounts
- Account 1: Owner (has vehicles)
- Account 2: Renter (will book)

**Steps:**

1. **As Renter:**
   - Search for a vehicle
   - Select dates
   - Create booking
   - ✅ **Owner receives "Booking Created" email**

2. **As Owner:**
   - Log in
   - Go to bookings
   - Accept the booking
   - ✅ **Renter receives "Booking Confirmed" email**

---

## 📬 Process Queued Emails

If emails are queued but not sent automatically, process them:

### Method 1: Via Browser Console

```javascript
// Process email queue
(async function() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(
    'https://kcujctyosmjlofppntfb.supabase.co',
    'YOUR_SERVICE_ROLE_KEY' // Get from Supabase Dashboard → Settings → API
  );
  
  const res = await supabase.functions.invoke('process-email-queue');
  console.log('✅ Queue processed:', res.data);
})();
```

### Method 2: Via cURL

```bash
curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## ✅ Quick Test Checklist

- [ ] Open website in browser
- [ ] Open console (F12)
- [ ] Paste test code
- [ ] Enter email address
- [ ] Check email inbox
- [ ] Email received? ✅

---

## 🎉 Success Indicators

✅ **Email received** in inbox  
✅ **Subject:** "Bienvenue sur RAKB !" (or other event types)  
✅ **Content:** HTML formatted, links work  
✅ **Resend Dashboard:** Shows sent email  
✅ **Function Logs:** Shows "Email sent successfully"  

---

**Start with the browser console test - it's instant and always works!** ⚡

