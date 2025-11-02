# 🚀 RAKB Deployment Guide

Complete guide for deploying RAKB car rental platform to production.

## 📋 Pre-Deployment Checklist

### Environment Variables
Ensure all required environment variables are set in your hosting platform:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Required for payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Mapbox (Optional)
REACT_APP_MAPBOX_TOKEN=your_mapbox_token

# Email Service (Optional - for contact form)
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL=admin@rakb.ma

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_PLAUSIBLE_DOMAIN=rakb.ma

# Application
VITE_APP_URL=https://rakb.ma
```

### Supabase Setup

1. **Deploy Edge Functions:**
   ```bash
   # Deploy contact form handler
   supabase functions deploy contact-form
   
   # Set environment variables for Edge Functions
   supabase secrets set RESEND_API_KEY=your_key
   supabase secrets set CONTACT_EMAIL=admin@rakb.ma
   ```

2. **Verify Storage Buckets:**
   - `vehicles` (public) - Vehicle images
   - `avatars` (public) - User avatars
   - `user_documents` (private) - User documents
   - `booking_photos` (private) - Booking photos

3. **Verify RLS Policies:**
   - All tables have appropriate RLS policies
   - Public tables allow anonymous reads where needed
   - Private tables require authentication

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository:**
   - Import your GitHub repository to Vercel
   - Select framework: Vite

2. **Configure Build:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables:**
   - Add all environment variables in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy:**
   - Push to main branch (auto-deploy)
   - Or deploy manually from dashboard

5. **Custom Domain:**
   - Settings → Domains
   - Add your domain (rakb.ma)
   - Configure DNS records as instructed

### Netlify

1. **Build Settings:**
   ```toml
   # netlify.toml (already configured)
   [build]
     command = "npm run build"
     publish = "dist"
   ```

2. **Environment Variables:**
   - Site settings → Environment variables
   - Add all required variables

3. **Deploy:**
   - Connect repository
   - Configure build settings
   - Deploy

### Manual Deployment

1. **Build:**
   ```bash
   npm install
   npm run build
   ```

2. **Upload `dist/` folder** to your hosting:
   - Ensure `index.html` is at root
   - All assets in `assets/` folder

3. **Configure Server:**
   - SPA routing: redirect all routes to `index.html`
   - HTTPS enabled
   - GZIP compression enabled

## 🔐 Security Configuration

### CORS Settings
- Update Supabase CORS to only allow your production domain
- Supabase Dashboard → Settings → API → CORS

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use environment variables in hosting platform
- ✅ Rotate keys regularly
- ✅ Use separate keys for production/staging

### Content Security Policy
Add to `vercel.json` or server headers:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
        }
      ]
    }
  ]
}
```

## 📧 Email Configuration

### Resend Setup
1. Create account at https://resend.com
2. Verify domain (rakb.ma)
3. Get API key
4. Set as `RESEND_API_KEY` in Supabase Edge Functions

### Email Templates
Contact form emails are sent via Edge Function.
Admin email: Set `CONTACT_EMAIL` environment variable.

## 💳 Stripe Integration

### Setup Steps

1. **Create Stripe Account:**
   - Sign up at https://stripe.com
   - Complete business verification

2. **Get API Keys:**
   - Dashboard → Developers → API keys
   - Copy Publishable key → `VITE_STRIPE_PUBLISHABLE_KEY`
   - Copy Secret key → Store in Supabase Edge Function secrets

3. **Configure Webhooks:**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-supabase-url.functions.supabase.co/stripe-webhook`
   - Events to listen: `payment_intent.succeeded`, `payment_intent.payment_failed`

4. **Deploy Stripe Edge Functions:**
   ```bash
   supabase functions deploy create-payment-intent
   supabase functions deploy capture-payment
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   ```

5. **Test Mode:**
   - Use test keys initially
   - Test cards: 4242 4242 4242 4242
   - Switch to live keys when ready

## 🗄️ Database Migrations

### Apply Migrations
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard
# SQL Editor → Run migration files from supabase/migrations/
```

### Verify Tables
Ensure all required tables exist:
- `profiles`
- `cars` / `vehicles`
- `bookings`
- `payments`
- `reviews`
- `notifications`
- `email_queue`
- `email_logs`

## 🔍 SEO Configuration

### Verify Files
- ✅ `public/robots.txt` exists
- ✅ `public/sitemap.xml` exists
- ✅ Meta tags in `index.html`
- ✅ Dynamic SEO on pages

### Google Search Console
1. Verify domain ownership
2. Submit sitemap: `https://rakb.ma/sitemap.xml`
3. Monitor indexing status

### Analytics
- Google Analytics: Set `VITE_GA_MEASUREMENT_ID`
- Plausible: Set `VITE_PLAUSIBLE_DOMAIN`
- Analytics only load after cookie consent

## 🧪 Testing Before Launch

### Functional Tests
- [ ] User registration/login
- [ ] Search vehicles
- [ ] View vehicle details
- [ ] Create booking
- [ ] Payment processing (test mode)
- [ ] Contact form submission
- [ ] Cookie consent banner
- [ ] Error boundaries

### Performance Tests
- [ ] Page load times < 3s
- [ ] Images optimized
- [ ] Bundle size optimized
- [ ] Lighthouse score > 80

### Security Tests
- [ ] HTTPS enabled
- [ ] No console errors in production
- [ ] Environment variables not exposed
- [ ] RLS policies working
- [ ] CORS configured correctly

## 📊 Post-Deployment

### Monitoring
- Set up error tracking (Sentry recommended)
- Monitor Supabase logs
- Track performance metrics
- Monitor payment success rates

### Maintenance
- Regular security updates
- Database backups
- Monitor storage usage
- Review error logs weekly

## 🆘 Troubleshooting

### Build Fails
- Check Node version (>= 20.9.0)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

### Environment Variables Not Working
- Verify variable names start with `VITE_`
- Restart build after adding variables
- Check variable visibility (not secret)

### Supabase Connection Issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check CORS settings
- Verify RLS policies

### Payment Not Working
- Verify Stripe keys are correct
- Check webhook configuration
- Verify Edge Functions are deployed
- Check Stripe dashboard for errors

## 📞 Support

For deployment issues:
1. Check error logs in hosting platform
2. Review Supabase logs
3. Check browser console for errors
4. Contact support if needed

---

**Last Updated:** January 2025

