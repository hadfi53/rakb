# 🚀 Test on Real Website - Quick Guide

## ⚡ Method 1: Browser Console (INSTANT - Works Now!)

### Step-by-Step:

1. **Open your website:**
   - Go to: `https://rakb.ma` (or your website URL)

2. **Open Browser Console:**
   - Press `F12` or `Cmd/Ctrl + Shift + I`
   - Click "Console" tab

3. **Copy this entire code block:**
```javascript
(async function() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(
      'https://kcujctyosmjlofppntfb.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw'
    );
    
    const email = prompt('📧 Enter YOUR email address to receive test email:', '');
    if (!email || !email.includes('@')) {
      alert('❌ Please enter a valid email address!');
      return;
    }
    
    console.log('📧 Sending email to:', email);
    
    const response = await supabase.functions.invoke('send-event-email', {
      body: {
        event_type: 'user_registered',
        recipient_email: email,
        recipient_name: 'Test User',
        data: {
          user_id: 'test-' + Date.now(),
          first_name: 'Test',
          email: email
        }
      }
    });
    
    if (response.data?.success) {
      alert('✅ SUCCESS! Email sent to ' + email + '\n\n📬 Check your inbox (and spam folder)!');
      console.log('✅ Email sent!', response.data);
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

4. **Paste into console and press Enter**

5. **Enter your email** when prompted

6. **Check your inbox!** 📬
   - Email should arrive within seconds
   - Subject: **"Bienvenue sur RAKB !"**
   - Check spam folder if not in inbox

---

## 🎯 Method 2: Through Website Registration

### Test User Registration:

1. **Go to registration page:**
   - Visit: `https://rakb.ma/register`

2. **Fill registration form:**
   - Email: **Use YOUR real email** (the one you want to test with)
   - Password: (choose any password)
   - First Name: Test
   - Last Name: User
   - Role: Choose any

3. **Click "Sign Up" or "Register"**

4. **Check your email:**
   - Should receive welcome email
   - If not received immediately, email may be queued
   - See "Process Queue" below

---

## 📬 Process Email Queue (If Emails Are Queued)

If you registered but didn't receive email, it may be in the queue. Process it:

### Via Browser Console:
```javascript
(async function() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(
    'https://kcujctyosmjlofppntfb.supabase.co',
    'YOUR_SERVICE_ROLE_KEY' // Get from Supabase Dashboard → Settings → API → service_role key
  );
  
  const res = await supabase.functions.invoke('process-email-queue');
  console.log('Queue processed:', res);
  alert('Queue processed! Check if emails were sent.');
})();
```

**Note:** You need the service_role key (not anon key) for this.

---

## ✅ Test Multiple Event Types

### Test Booking Created Email:

```javascript
// In browser console on your website
(async function() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient(
    'https://kcujctyosmjlofppntfb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw'
  );
  
  const email = prompt('Enter owner email:');
  
  await supabase.functions.invoke('send-event-email', {
    body: {
      event_type: 'booking_created',
      recipient_email: email,
      recipient_name: 'Test Owner',
      data: {
        booking_id: 'test-123',
        vehicle_name: 'Mercedes Benz C-Class 2023',
        renter_name: 'John Doe',
        renter_email: 'john@example.com',
        start_date: '15/02/2025',
        end_date: '20/02/2025',
        total_price: 1500
      }
    }
  });
  
  alert('Email sent! Check inbox.');
})();
```

---

## 🎉 What to Expect

### Email Should Have:
- ✅ **HTML formatting** (nice colors, buttons)
- ✅ **Subject line** in French
- ✅ **Content** relevant to event type
- ✅ **Links** that work
- ✅ **Branding** (RAKB colors, logo)

### Check:
1. **Inbox** - Check main inbox first
2. **Spam/Junk** - Check spam folder
3. **Resend Dashboard** - https://resend.com/emails
4. **Function Logs** - Supabase Dashboard → Functions → Logs

---

## 🚀 Start Testing Now!

**Recommended:** Start with **Method 1 (Browser Console)** - it's the fastest and always works!

1. Open your website
2. Press F12
3. Paste the code
4. Enter your email
5. Check inbox!

**That's it! You should receive an email within seconds!** 📧✅

