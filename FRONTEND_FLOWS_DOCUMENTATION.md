# 🎯 Frontend Flows Documentation - RAKB

## Overview
This document describes the main user flows in the RAKB application, including component interactions, state management, and API calls.

---

## 🔐 Authentication & Registration Flows

### 1. User Registration Flow

**Route:** `/auth/register`

**Components:**
- `src/pages/auth/Register.tsx` - Main registration page
- `src/components/auth/RegisterForm.tsx` - Registration form component

**Flow Steps:**
1. User fills registration form (firstName, lastName, email, password, confirmPassword, role)
2. Form validation:
   - ✅ Email format validation
   - ✅ Password strength (min 6 characters)
   - ⚠️ **BUG**: Password mismatch check returns silently (line 27-28) - needs fix
3. Submit to `signUp()` in `AuthContext`
4. `signUp()` calls Supabase Auth:
   ```typescript
   supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         first_name,
         last_name,
         role  // 'renter' or 'owner'
       }
     }
   })
   ```
5. `handle_new_user` trigger creates profile in `profiles` table
6. Role mapping: Frontend `'renter'` → Database `'locataire'`, `'owner'` → `'proprietaire'`
7. Redirect to `/documents/verification` with role state

**State Management:**
- Form state in `RegisterForm` component
- Auth state in `AuthContext` (global)

**API Calls:**
- `supabase.auth.signUp()` - User creation
- Auto profile creation via trigger

---

### 2. User Login Flow

**Route:** `/auth/login`

**Components:**
- `src/pages/auth/Login.tsx`
- `src/components/auth/LoginForm.tsx`

**Flow Steps:**
1. User enters email and password
2. Form validation
3. Submit to `signIn()` in `AuthContext`
4. `signIn()` calls `supabase.auth.signInWithPassword()`
5. On success:
   - User session stored in `AuthContext`
   - Profile loaded from `profiles` table
   - Redirect based on role:
     - `renter` → `/dashboard/renter`
     - `owner` → `/dashboard/owner`
     - `admin` → `/admin`

**State Management:**
- Form state in component
- Auth state in `AuthContext`

---

### 3. Document Verification Flow

**Route:** `/documents/verification` or `/verify/tenant` or `/verify/host`

**Components:**
- `src/pages/documents/DocumentVerification.tsx`

**Flow Steps:**

#### For Tenants (`verified_tenant`):
1. User uploads required documents:
   - Identity card/passport (required)
   - Driver's license (required)
   - Proof of residence (required)
   - Selfie with ID (optional)
   - Credit card proof (optional)
2. Documents uploaded to `user_documents` bucket
3. Records created in `identity_documents` table with `verification_type = 'tenant'`
4. Admin reviews documents
5. On approval: `verified_tenant = true` in profile
6. Tenant can now book vehicles

#### For Hosts (`verified_host`):
1. Tenant clicks "Become a host" from homepage
2. User uploads required documents:
   - Identity card/passport (required)
   - Vehicle registration (required)
   - Insurance (required)
   - Technical inspection (required)
   - Bank proof (optional)
   - Car photos (optional)
3. Documents uploaded with `verification_type = 'host'`
4. Admin reviews documents
5. On approval: `verified_host = true` in profile
6. Host can now add vehicles and manage bookings

**API Calls:**
- `uploadDocument()` in `src/lib/backend/profiles.ts`
- `getDocuments()` to fetch user documents
- Admin approval updates `verified_tenant` or `verified_host` flags

**State Management:**
- Document upload state in component
- Verification status from profile

---

## 🚗 Vehicle Search & Discovery Flow

### 1. Search Flow

**Route:** `/search` or `/cars/search`

**Components:**
- `src/pages/cars/SearchResults.tsx` - Main search results page
- `src/components/SearchBar.tsx` - Search input component
- `src/components/cars/EnhancedSearchResultsGrid.tsx` - Results display
- `src/hooks/use-vehicle-search.ts` - Search hook

**Flow Steps:**
1. User enters search criteria:
   - Location (required)
   - Dates (startDate, endDate) - optional
   - Category, price range, transmission, fuel type, etc.
2. Search params stored in URL query string
3. `useVehicleSearch` hook:
   - Calls `vehiclesApi.searchVehicles()` in `src/lib/api.ts`
   - Which calls `getAvailableVehicles()` in `src/lib/backend/vehicles.ts`
4. Backend query:
   ```typescript
   supabase
     .from('cars')
     .select('*')
     .eq('is_available', true)
     .eq('is_approved', true)
     .ilike('location', `%${location}%`)
   ```
5. Date filtering (if dates provided):
   - Checks `vehicle_blocked_dates` table
   - Checks `bookings` table for conflicts
   - Filters out unavailable vehicles
6. Client-side filtering:
   - Transmission, fuel type, seats, premium status
7. Results displayed in grid
8. User clicks vehicle → Navigate to `/cars/:id`

**State Management:**
- Search params in URL (React Router)
- Filter state in `SearchResults` component
- Vehicle data from API

**API Calls:**
- `vehiclesApi.searchVehicles()` → `getAvailableVehicles()`

---

### 2. Vehicle Detail Flow

**Route:** `/cars/:id`

**Components:**
- `src/pages/cars/CarDetail.tsx`
- `src/components/cars/details/VehicleGallery.tsx`
- `src/components/cars/details/CustomerReviews.tsx`
- `src/components/cars/ReservationDialog.tsx`

**Flow Steps:**
1. Load vehicle data:
   - `vehiclesApi.getVehicle(id)` → `getVehicleById()` in backend
2. Display vehicle information:
   - Images (from `images` JSONB array)
   - Details (make, model, year, price, etc.)
   - Availability calendar
   - Reviews and ratings
3. User clicks "Réserver" button
4. Check authentication:
   - If not logged in → Redirect to `/auth/login`
   - If logged in but not verified tenant → Show verification banner
5. Open `ReservationDialog` component
6. User selects dates and options
7. Calculate pricing:
   - Base price = days × `price_per_day`
   - Insurance fee (if selected)
   - Service fee
   - Total = base + insurance + service
   - Deposit = 10% of total
8. Proceed to payment

**State Management:**
- Vehicle data from API
- Reservation state in dialog component

**API Calls:**
- `vehiclesApi.getVehicle(id)`
- `checkVehicleAvailability()` for date validation

---

## 💳 Booking & Payment Flow

### 1. Booking Creation Flow

**Route:** `/cars/:id/reserve` or via `ReservationDialog`

**Components:**
- `src/components/cars/ReservationDialog.tsx`
- `src/components/booking/PaymentSheet.tsx`
- `src/lib/payment/stripe.ts`

**Flow Steps:**
1. User fills booking form:
   - Dates (validated for availability)
   - Pickup location
   - Return location
   - Insurance option
   - Optional message to owner
2. Calculate total price
3. Create Stripe Payment Intent:
   ```typescript
   // Edge Function: capture-payment
   supabase.functions.invoke('capture-payment', {
     body: {
       amount: totalPrice,
       currency: 'mad',
       booking_data: { ... }
     }
   })
   ```
4. User enters payment details (Stripe Elements)
5. Confirm payment:
   ```typescript
   confirmPaymentWithMethodAndCreateBooking(
     paymentIntentId,
     paymentMethodId,
     bookingData
   )
   ```
6. Edge Function:
   - Confirms payment with Stripe
   - Creates booking in `bookings` table
   - Sets status to `'pending'` (awaiting owner approval)
   - Creates notification for owner
   - Sends email to owner
7. Redirect to `/bookings/:id/confirm`

**State Management:**
- Booking form state in dialog
- Payment state in `PaymentSheet`
- Booking data passed to Edge Function

**API Calls:**
- `supabase.functions.invoke('capture-payment')` - Payment processing
- `createBooking()` in `src/lib/backend/bookings.ts` - Booking creation

**Database Operations:**
- Insert into `bookings` table with:
  - `car_id` (mapped from `vehicle_id`)
  - `user_id` (renter)
  - `host_id` (owner, from vehicle)
  - `total_amount` (mapped from `total_price`)
  - `caution_amount` (deposit)

---

### 2. Booking Confirmation Flow (Owner)

**Route:** `/dashboard/owner/bookings`

**Components:**
- `src/pages/dashboard/OwnerBookingsDashboard.tsx`
- `src/components/dashboard/BookingRequestsManager.tsx`

**Flow Steps:**
1. Owner views booking requests
2. Load bookings:
   ```typescript
   getOwnerBookings(ownerId)
   // Queries: bookings WHERE host_id = ownerId
   ```
3. Display pending bookings
4. Owner actions:
   - **Approve:** 
     - Update booking status to `'confirmed'`
     - Send email to renter
     - Create notification
   - **Reject:**
     - Update booking status to `'rejected'`
     - Refund payment (if paid)
     - Send email to renter
5. On approval, booking becomes active on start date

**API Calls:**
- `getOwnerBookings()` - Fetch owner's bookings
- `acceptBookingRequest()` - Approve booking
- `rejectBookingRequest()` - Reject booking

---

### 3. Booking Management Flow (Renter)

**Route:** `/dashboard/renter/bookings`

**Components:**
- `src/pages/dashboard/RenterBookingsDashboard.tsx`

**Flow Steps:**
1. Renter views their bookings
2. Load bookings:
   ```typescript
   getRenterBookings(renterId)
   // Queries: bookings WHERE user_id = renterId
   ```
3. Display bookings with status:
   - `pending` - Awaiting owner approval
   - `confirmed` - Approved, upcoming
   - `active` - Currently in progress
   - `completed` - Finished
   - `cancelled` - Cancelled
4. Renter actions:
   - View booking details
   - Cancel booking (if allowed)
   - View invoice/receipt
   - Submit review (after completion)

**API Calls:**
- `getRenterBookings()` - Fetch renter's bookings
- `cancelBooking()` - Cancel booking
- `getBookingById()` - Get booking details

---

## 🚙 Vehicle Management Flow (Owner)

### 1. Add Vehicle Flow

**Route:** `/cars/add`

**Components:**
- `src/pages/cars/AddCar.tsx`
- `src/pages/cars/components/VehicleBasicInfo.tsx`
- `src/pages/cars/components/VehicleDetails.tsx`
- `src/pages/cars/components/ImageUpload.tsx`

**Flow Steps:**
1. Check verification:
   - Must have `verified_host = true`
   - Show verification banner if not verified
2. Multi-step form (7 steps):
   - Step 1: Basic info (brand, model, year)
   - Step 2: Required documents (identity, registration, insurance, inspection)
   - Step 3: Photos (multiple images)
   - Step 4: Pricing (price per day)
   - Step 5: Location & availability
   - Step 6: Policies & conditions
   - Step 7: Preview
3. Document upload:
   - Upload to `user_documents` bucket
   - Create records in `identity_documents` table
4. Image upload:
   - Upload to `vehicles` bucket
   - Store paths in `images` JSONB array
5. Submit vehicle:
   ```typescript
   createVehicle(ownerId, vehicleData)
   // Inserts into cars table with:
   // - host_id = ownerId
   // - is_approved = false (pending review)
   // - is_available = true
   ```
6. Admin reviews and approves
7. Vehicle appears in search results

**State Management:**
- Form state in `AddCar` component
- Step navigation state
- Upload progress state

**API Calls:**
- `uploadDocument()` - Document upload
- `createVehicle()` - Vehicle creation
- Image upload to Supabase Storage

---

### 2. Edit Vehicle Flow

**Route:** `/cars/:id/edit`

**Components:**
- `src/pages/cars/EditCar.tsx`

**Flow Steps:**
1. Load existing vehicle data
2. Pre-fill form with vehicle data
3. User edits fields
4. Update vehicle:
   ```typescript
   updateVehicle(vehicleId, ownerId, updates)
   // Updates cars table
   ```
5. If `publication_status` changed:
   - `'active'` → `is_approved = true`
   - `'pending_review'` → `is_approved = false`

**API Calls:**
- `getVehicleById()` - Load vehicle
- `updateVehicle()` - Update vehicle

---

### 3. Vehicle Availability Management

**Route:** `/cars/:id/availability`

**Components:**
- `src/pages/cars/VehicleAvailability.tsx`

**Flow Steps:**
1. Load vehicle's blocked dates and bookings
2. Display calendar with:
   - Available dates (green)
   - Blocked dates (red)
   - Booked dates (blue)
   - Maintenance dates (orange)
3. Owner selects dates to block
4. Block dates:
   ```typescript
   blockDates(vehicleId, dates, reason, note)
   // Inserts into vehicle_blocked_dates table
   ```
5. Unblock dates:
   ```typescript
   unblockDates(vehicleId, dateIds)
   // Deletes from vehicle_blocked_dates table
   ```

**API Calls:**
- `getBlockedDates()` - Get blocked dates
- `getOwnerBookings()` - Get bookings for vehicle
- `blockDates()` - Block dates
- `unblockDates()` - Unblock dates

---

## 💬 Messaging Flow

**Route:** `/messages` or `/messages/:threadId`

**Components:**
- `src/pages/messaging/MessagesList.tsx`
- `src/pages/messaging/MessageThread.tsx`

**Flow Steps:**
1. User views message threads
2. Load threads:
   ```typescript
   getThreads(userId)
   // Queries: message_threads WHERE tenant_id = userId OR host_id = userId
   ```
3. Threads are auto-created when booking is created
4. User opens thread
5. Load messages:
   ```typescript
   getMessages(threadId)
   // Queries: messages WHERE thread_id = threadId
   ```
6. Send message:
   ```typescript
   sendMessage(threadId, senderId, recipientId, content)
   // Inserts into messages table
   // Creates notification for recipient
   ```
7. Real-time updates via Supabase subscriptions

**State Management:**
- Threads list state
- Messages state in thread
- Real-time subscription state

**API Calls:**
- `getThreads()` - Get user's threads
- `getMessages()` - Get thread messages
- `sendMessage()` - Send message
- Supabase real-time subscription for new messages

---

## 🔔 Notifications Flow

**Route:** `/notifications`

**Components:**
- `src/pages/notifications/Notifications.tsx`
- `src/hooks/use-notification-badge.ts` - Badge count hook

**Flow Steps:**
1. Load notifications:
   ```typescript
   getNotifications(userId)
   // Queries: notifications WHERE user_id = userId
   ```
2. Display notifications grouped by type
3. Mark as read:
   ```typescript
   markAsRead(notificationId)
   // Updates: notifications SET is_read = true WHERE id = notificationId
   ```
4. Real-time updates via Supabase subscription
5. Badge count updates automatically

**State Management:**
- Notifications list state
- Unread count state
- Real-time subscription state

**API Calls:**
- `getNotifications()` - Get user notifications
- `markAsRead()` - Mark notification as read
- Supabase real-time subscription

---

## 📊 Data Flow Patterns

### Field Mapping Pattern

Always map database fields to frontend interfaces:

```typescript
// Database → Frontend mapping
const formattedBooking: Booking = {
  id: data.id,
  vehicle_id: data.car_id,        // Map car_id → vehicle_id
  renter_id: data.user_id,         // Map user_id → renter_id
  owner_id: data.host_id,          // Map host_id → owner_id
  total_price: data.total_amount,  // Map total_amount → total_price
  // ...
};
```

### Image Parsing Pattern

Always handle JSONB images correctly:

```typescript
let images: string[] = [];
if (car.images) {
  if (Array.isArray(car.images)) {
    images = car.images;  // JSONB array
  } else if (typeof car.images === 'string') {
    try {
      images = JSON.parse(car.images);  // String JSON
    } catch {
      images = [car.images];  // Single string
    }
  }
}
```

### Role Mapping Pattern

Always map frontend roles to database roles:

```typescript
const dbRole = 
  role === 'owner' ? 'proprietaire' : 
  role === 'renter' ? 'locataire' : 
  role;
```

---

## 🚨 Common Flow Issues

1. **Password Validation:** RegisterForm doesn't show error on mismatch
2. **Field Mapping:** Inconsistent use of `car_id` vs `vehicle_id`
3. **Type Safety:** Using `any` types instead of proper interfaces
4. **Error Handling:** Missing error handling in async operations
5. **Loading States:** Some operations don't show loading indicators

---

## 📚 Related Documentation

- `SUPABASE_SCHEMA_DOCUMENTATION.md` - Database schema details
- `ISSUES_TO_FIX.md` - Known issues and fixes
- Component documentation in `src/components/`
- Hook documentation in `src/hooks/`

