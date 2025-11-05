# 📋 INVENTAIRE COMPLET - RAKB Platform

**Date:** 2025-02-02  
**Branche:** `ops/final-prod-audit-20250202`

## 🎯 RÉSUMÉ EXÉCUTIF

- **Total Routes:** 68 (22 public, 23 renter, 23 owner, 9 admin)
- **Edge Functions:** 7 (dont 1 test)
- **Storage Buckets:** 8 (4 public, 4 private)
- **Database Tables:** 81 (29 sensibles)
- **Migrations:** 84
- **Project Status:** ACTIVE_HEALTHY

---

## 🔑 VARIABLES D'ENVIRONNEMENT

### Client-side (VITE_*)
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅
- `VITE_APP_URL` ✅
- `VITE_GA_MEASUREMENT_ID` (optional)
- `VITE_PLAUSIBLE_DOMAIN` (optional)
- `VITE_MAPBOX_TOKEN` (optional)

### Server-side (Edge Functions secrets)
- `STRIPE_SECRET_KEY` ⚠️ **À VÉRIFIER**
- `RESEND_API_KEY` ⚠️ **À VÉRIFIER**
- `SUPABASE_URL` ⚠️ **À VÉRIFIER**
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **À VÉRIFIER**
- `RESEND_DOMAIN` ⚠️ **À VÉRIFIER**
- `RESEND_FROM` ⚠️ **À VÉRIFIER**
- `CONTACT_EMAIL` ⚠️ **À VÉRIFIER**

---

## 🗄️ STORAGE BUCKETS

| Bucket | Public | Usage | Status |
|--------|--------|-------|--------|
| `vehicles` | ✅ | Vehicle images (primary) | ✅ |
| `car-images` | ✅ | Vehicle images (legacy) | ✅ |
| `avatars` | ✅ | User avatars | ✅ |
| `booking_photos` | ❌ | Check-in/out photos | ✅ |
| `contrats` | ❌ | Contracts | ✅ |
| `identity-documents` | ❌ | Identity docs | ✅ |
| `user_documents` | ❌ | User documents | ✅ |
| `check-in-out` | ❌ | Check-in/out photos | ✅ |

---

## ⚙️ EDGE FUNCTIONS

1. **capture-payment** - Stripe payment capture
2. **create-payment-intent** - Creates Stripe Payment Intent (requires `STRIPE_SECRET_KEY`)
3. **process-email-queue** - Processes email queue via Resend (requires `RESEND_API_KEY`)
4. **send-email** - Sends individual emails
5. **send-event-email** - Event-triggered emails
6. **contact-form** - Contact form handler
7. **hello-world** - Test function

---

## 📊 TABLES SENSIBLES (RLS à vérifier)

- `bookings` (2 rows)
- `payments` (0 rows)
- `payment_transactions` (0 rows)
- `refund_requests` (0 rows)
- `email_queue` (2 rows)
- `email_logs` (0 rows)
- `profiles` (12 rows)
- `cars` (5 rows)
- `disputes` (0 rows)
- `messages` / `booking_messages` / `conversations`
- `verification_documents` / `identity_documents` / `host_documents`
- `stripe_customers` / `stripe_payment_methods`
- `transactions` / `wallets` / `host_wallets`
- `invoices` / `contracts`
- `audit_logs` (1 row)

---

## 🛣️ ROUTES PRINCIPALES

### Public
- Home, Search, Auth (login/register/forgot), Car detail/reviews, Legal pages, About/Blog/Help

### Renter
- Dashboard, Bookings, Profile, Favorites, Messages, Reservations, Check-out, Reviews

### Owner
- Dashboard, Vehicles, Bookings, Revenue, Deposits, Refunds, Cancellations, Claims, Availability, Stats, Messages

### Admin
- Dashboard, Emails, Vehicles, Documents, Users, Bookings

---

## 🔐 SÉCURITÉ

### RLS Status
- ✅ Toutes les tables sensibles ont `rls_enabled: true`
- ⚠️ **À VÉRIFIER:** Policies explicites pour chaque table
- ⚠️ **À VÉRIFIER:** Admin access policies
- ⚠️ **À VÉRIFIER:** Service role usage

### Secrets
- ⚠️ **À VÉRIFIER:** Aucun secret commité dans le repo
- ⚠️ **À VÉRIFIER:** Edge Functions secrets configurés

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Inventaire complété
2. ⏳ Vérification RLS et sécurité DB
3. ⏳ Validation Auth & Sessions
4. ⏳ Audit Storage/Images
5. ⏳ Validation Stripe
6. ⏳ Validation Email Queue
7. ⏳ Tests E2E
8. ⏳ CI/CD Setup

