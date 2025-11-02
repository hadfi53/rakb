# 🚀 RAKB Launch Checklist

**Use this checklist before going live with RAKB**

---

## 🔐 1. ENVIRONMENT VARIABLES SETUP

### Supabase Configuration

- [ ] Create `.env` file in project root
- [ ] Set `VITE_SUPABASE_URL` (from Supabase Dashboard → Settings → API)
- [ ] Set `VITE_SUPABASE_ANON_KEY` (from Supabase Dashboard → Settings → API)
- [ ] Verify Supabase project is active and healthy

### Stripe Configuration

- [ ] Create Stripe account (https://stripe.com)
- [ ] Get test API keys from Stripe Dashboard → Developers → API keys
- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` (starts with `pk_test_`)
- [ ] Set `STRIPE_SECRET_KEY` in Supabase Edge Function secrets (starts with `sk_test_`)
- [ ] Test payment with test card: `4242 4242 4242 4242`
- [ ] **Before production:** Switch to production Stripe keys
- [ ] Set Stripe webhook endpoint (optional but recommended)

### Supabase Edge Function Secrets

Configure in Supabase Dashboard → Edge Functions → Secrets:

- [ ] `STRIPE_SECRET_KEY` - Your Stripe secret key
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (from Settings → API)
- [ ] `RESEND_API_KEY` (optional) - For contact form emails
- [ ] `CONTACT_EMAIL` (optional) - Default: `contact@rakb.ma`

### Email Service (Optional)

- [ ] Create Resend account (https://resend.com) or use alternative
- [ ] Set `RESEND_API_KEY` in Edge Function secrets
- [ ] Set `CONTACT_EMAIL` to your support email
- [ ] Test contact form email delivery

---

## 🧪 2. TESTING

### Payment Flow Testing

- [ ] **Create a test booking:**
  - [ ] Search for a vehicle
  - [ ] Select dates
  - [ ] Enter payment details (test card: `4242 4242 4242 4242`)
  - [ ] Verify payment succeeds
  - [ ] Verify booking appears in Supabase `bookings` table
  - [ ] Verify payment record in `payments` table
  - [ ] Verify notifications are created

- [ ] **Test payment failures:**
  - [ ] Use declined card: `4000 0000 0000 0002`
  - [ ] Verify error message displays
  - [ ] Verify no booking is created

- [ ] **Test availability:**
  - [ ] Book same vehicle for overlapping dates
  - [ ] Verify second booking is rejected

### Contact Form Testing

- [ ] Submit contact form with valid data
- [ ] Verify success message appears
- [ ] If Resend configured: Verify email received
- [ ] Check `email_queue` table in Supabase
- [ ] Test form validation (empty fields, invalid email)

### Route Testing

- [ ] Test all main routes:
  - [ ] `/` - Homepage
  - [ ] `/search` - Search results
  - [ ] `/cars/:id` - Car detail page
  - [ ] `/blog` - Blog listing
  - [ ] `/blog/1`, `/blog/2`, etc. - Blog posts
  - [ ] `/contact` - Contact page
  - [ ] `/auth/login` - Login
  - [ ] `/auth/register` - Register

- [ ] Test 404 page with invalid route
- [ ] Test protected routes require authentication

### Mobile Testing

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify responsive design works
- [ ] Test payment flow on mobile
- [ ] Test image uploads on mobile

---

## 📝 3. CONTENT UPDATES

### Contact Information

- [ ] Replace `+212 6 00 00 00 00` with real phone number in:
  - [ ] `src/components/Footer.tsx`
  - [ ] `src/pages/contact/Contact.tsx`
  - [ ] `src/pages/emergency/Emergency.tsx`

- [ ] Verify email `contact@rakb.ma` is active and monitored

- [ ] Add physical address if applicable

### Social Media

- [ ] Create social media accounts OR remove social links:
  - [ ] Facebook: `https://facebook.com/rakb.ma`
  - [ ] Twitter: `https://twitter.com/rakb_ma`
  - [ ] Instagram: `https://instagram.com/rakb.ma`
  - [ ] LinkedIn: `https://linkedin.com/company/rakb`

- [ ] Update links in `src/components/Footer.tsx` or remove if unavailable

---

## 🚀 4. DEPLOYMENT

### Supabase Setup

- [ ] Deploy Edge Functions:
  ```bash
  supabase functions deploy create-payment-intent
  supabase functions deploy capture-payment
  supabase functions deploy contact-form
  ```

- [ ] Verify Edge Functions are deployed and active

- [ ] Test Edge Functions manually:
  ```bash
  curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-payment-intent \
    -H "Authorization: Bearer YOUR_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"amount": 1000, "currency": "mad"}'
  ```

### Frontend Deployment

- [ ] Build production bundle:
  ```bash
  npm run build
  ```

- [ ] Verify build completes without errors
- [ ] Test production build locally:
  ```bash
  npm run preview
  ```

- [ ] Deploy to hosting platform:
  - [ ] Vercel: Push to main branch or use Vercel CLI
  - [ ] Netlify: Deploy via Git or Netlify CLI
  - [ ] Other: Follow platform-specific instructions

- [ ] Verify production URL loads correctly
- [ ] Test production payment flow

---

## ✅ 5. VERIFICATION

### Functionality

- [ ] User registration works
- [ ] User login works
- [ ] Vehicle search works
- [ ] Vehicle detail pages load
- [ ] Booking creation works
- [ ] Payment processing works
- [ ] Booking confirmation email sent (if configured)
- [ ] Notifications work
- [ ] Image uploads work

### Security

- [ ] HTTPS enabled on production domain
- [ ] Environment variables not exposed in client code
- [ ] RLS policies verified in Supabase
- [ ] API keys secured
- [ ] CORS configured correctly

### Performance

- [ ] Page load times acceptable (< 3s)
- [ ] Images optimized
- [ ] No console errors in production
- [ ] No broken links

---

## 📊 6. MONITORING SETUP

- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Configure Supabase monitoring alerts
- [ ] Set up Stripe webhook for payment events
- [ ] Monitor booking success rates

---

## 🔄 7. POST-LAUNCH

### Immediate (First 24 hours)

- [ ] Monitor error logs
- [ ] Check payment success rate
- [ ] Respond to support requests
- [ ] Verify first real booking completes successfully

### First Week

- [ ] Review analytics data
- [ ] Collect user feedback
- [ ] Fix any critical bugs
- [ ] Optimize slow pages

### Ongoing

- [ ] Regular backups verification
- [ ] Security updates
- [ ] Performance monitoring
- [ ] Content updates (blog, etc.)

---

## 📞 8. SUPPORT PREPARATION

- [ ] Document common issues and solutions
- [ ] Set up support email monitoring
- [ ] Prepare response templates
- [ ] Test refund process
- [ ] Document cancellation policy

---

## ⚠️ IMPORTANT NOTES

1. **Stripe Test Mode:** Ensure you switch to production Stripe keys before accepting real payments.

2. **Phone Number:** The placeholder `+212 6 00 00 00 00` MUST be replaced before launch.

3. **Social Media:** Either create accounts and update links, or remove social icons from footer.

4. **Backup:** Ensure Supabase backups are configured and tested.

5. **Legal:** Verify all legal pages are complete and accurate.

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Test locally
npm run dev

# Build for production
npm run build

# Deploy Edge Functions
supabase functions deploy create-payment-intent
supabase functions deploy capture-payment
```

---

**Once all items are checked, RAKB is ready for launch! 🚀**

