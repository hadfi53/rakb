# 📊 Supabase Schema Documentation - RAKB

## Overview
This document provides comprehensive documentation of the Supabase database schema, including tables, relationships, field mappings, and important notes for developers.

---

## 🔑 Critical Field Mappings

### ⚠️ IMPORTANT: Database vs Frontend Field Names

The database uses different field names than the frontend TypeScript interfaces. Always use these mappings:

| Database Field | Frontend Interface Field | Table | Notes |
|---------------|-------------------------|-------|-------|
| `host_id` | `owner_id` | `cars`, `bookings` | **CRITICAL**: Always map `host_id` → `owner_id` |
| `car_id` | `vehicle_id` | `bookings` | **CRITICAL**: Always map `car_id` → `vehicle_id` |
| `user_id` | `renter_id` | `bookings` | **CRITICAL**: Always map `user_id` → `renter_id` |
| `total_amount` | `total_price` | `bookings` | Always map `total_amount` → `total_price` |
| `caution_amount` | `depositAmount` | `bookings` | Always map `caution_amount` → `depositAmount` |
| `phone_number` | `phone` | `profiles` | Database uses `phone_number`, frontend uses `phone` |
| `review_count` | `reviews_count` | `cars` | Database uses `review_count`, frontend uses `reviews_count` |
| `is_available` | `status: 'available' \| 'unavailable'` | `cars` | Convert boolean to status enum |
| `is_approved` | `publication_status: 'active' \| 'pending_review'` | `cars` | Convert boolean to publication_status |

---

## 📋 Core Tables

### 1. `cars` Table

**Purpose:** Stores vehicle listings

**Key Fields:**
```sql
id UUID PRIMARY KEY
host_id UUID NOT NULL REFERENCES auth.users(id)  -- ⚠️ NOT owner_id!
brand TEXT NOT NULL
make TEXT NULLABLE  -- Alternative to brand
model TEXT NOT NULL
year INTEGER
images JSONB DEFAULT '[]'::jsonb  -- ⚠️ JSONB array, not TEXT[]
features JSONB DEFAULT '[]'::jsonb  -- ⚠️ JSONB array, not TEXT[]
price_per_day NUMERIC NOT NULL
location TEXT NULLABLE  -- ⚠️ TEXT, not GEOGRAPHY
latitude DOUBLE PRECISION NULLABLE
longitude DOUBLE PRECISION NULLABLE
is_available BOOLEAN DEFAULT true  -- ⚠️ NOT "available"
is_approved BOOLEAN DEFAULT true  -- For moderation
category TEXT NULLABLE
seats INTEGER NULLABLE
transmission TEXT NULLABLE  -- 'manual' | 'automatic'
fuel_type TEXT NULLABLE  -- 'gasoline' | 'diesel' | 'electric' | 'hybrid'
rating NUMERIC DEFAULT 0
review_count INTEGER DEFAULT 0  -- ⚠️ NOT reviews_count
color TEXT NULLABLE
mileage INTEGER NULLABLE
luggage INTEGER NULLABLE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Important Notes:**
- ✅ Use `host_id` (not `owner_id`) when querying
- ✅ `images` and `features` are JSONB arrays - parse accordingly
- ✅ `is_available` is boolean - convert to `status` enum in frontend
- ✅ `is_approved` controls publication - convert to `publication_status` enum
- ✅ `location` is plain TEXT, not GEOGRAPHY type
- ✅ No `status` field exists - derive from `is_available`

**RLS Policies:**
- Public read access for approved vehicles (`is_approved = true`)
- Owners can manage their own vehicles (`host_id = auth.uid()`)

---

### 2. `bookings` Table

**Purpose:** Stores rental bookings/reservations

**Key Fields:**
```sql
id UUID PRIMARY KEY
car_id UUID NOT NULL REFERENCES cars(id)  -- ⚠️ NOT vehicle_id!
user_id UUID NOT NULL REFERENCES auth.users(id)  -- Renter (⚠️ NOT renter_id!)
host_id UUID NOT NULL REFERENCES auth.users(id)  -- Owner (⚠️ NOT owner_id!)
start_date DATE NOT NULL
end_date DATE NOT NULL
start_time TIMESTAMPTZ NULLABLE
end_time TIMESTAMPTZ NULLABLE
status TEXT DEFAULT 'pending'  -- 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rejected'
total_amount NUMERIC NOT NULL  -- ⚠️ NOT total_price!
caution_amount NUMERIC DEFAULT 0  -- Deposit amount
payment_status TEXT DEFAULT 'pending'  -- 'pending' | 'paid' | 'refunded' | 'failed'
pickup_location TEXT NOT NULL
dropoff_location TEXT NULLABLE
return_location TEXT NULLABLE  -- Alternative to dropoff_location
reference_number TEXT UNIQUE  -- Format: RAKB-XXXX
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Important Notes:**
- ✅ Always use `car_id` (not `vehicle_id`) in queries
- ✅ Always use `user_id` for renter (not `renter_id`)
- ✅ Always use `host_id` for owner (not `owner_id`)
- ✅ Always use `total_amount` (not `total_price`)
- ✅ Map these fields when returning to frontend

**Relations:**
```sql
-- When selecting bookings, use:
SELECT 
  *,
  car:cars(*),  -- ⚠️ NOT vehicle:vehicles(*)
  renter:profiles!user_id(*),  -- ⚠️ NOT renter:profiles!renter_id(*)
  host:profiles!host_id(*)  -- ⚠️ NOT owner:profiles!owner_id(*)
FROM bookings
```

**RLS Policies:**
- Users can view bookings where they are renter (`user_id = auth.uid()`) or owner (`host_id = auth.uid()`)

---

### 3. `profiles` Table

**Purpose:** User profile information

**Key Fields:**
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT NOT NULL
first_name TEXT NULLABLE
last_name TEXT NULLABLE
phone_number TEXT NULLABLE  -- ⚠️ NOT phone!
role user_role DEFAULT 'locataire'  -- Enum: 'locataire' | 'proprietaire' | 'host' | 'renter' | 'admin'
verified_tenant BOOLEAN DEFAULT false
verified_host BOOLEAN DEFAULT false
is_host BOOLEAN DEFAULT false
avatar_url TEXT NULLABLE
birthdate DATE NULLABLE
phone_verified BOOLEAN DEFAULT false
email_verified BOOLEAN DEFAULT false
notification_preferences JSONB DEFAULT '{"email": true, "push": true}'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Important Notes:**
- ⚠️ **Role Enum Values:** Database uses `'locataire'`, `'proprietaire'`, `'host'`, `'renter'`, `'admin'`
- ⚠️ Frontend uses `'renter'` and `'owner'` - need mapping:
  - Frontend `'renter'` → Database `'locataire'`
  - Frontend `'owner'` → Database `'proprietaire'` or `'host'`
- ✅ Use `phone_number` (not `phone`) when querying
- ✅ `verified_tenant` and `verified_host` are separate flags
- ✅ Profile is auto-created by `handle_new_user` trigger on signup

**RLS Policies:**
- Users can view and update their own profile
- Public read access for basic profile info (name, avatar)

---

### 4. `identity_documents` Table

**Purpose:** Stores user verification documents

**Key Fields:**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES auth.users(id)
document_type TEXT NOT NULL  -- 'identity' | 'driver_license' | 'vehicle_registration' | 'insurance' | 'technical_inspection'
document_url TEXT NOT NULL  -- Signed URL or path
original_filename TEXT NULLABLE
file_size INTEGER NULLABLE
mime_type TEXT NULLABLE
verification_type TEXT NOT NULL CHECK (verification_type IN ('tenant', 'host'))
verification_status TEXT DEFAULT 'pending'  -- 'pending' | 'approved' | 'rejected'
rejection_reason TEXT NULLABLE
uploaded_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Important Notes:**
- ✅ Documents are stored in `user_documents` storage bucket (private)
- ✅ Use signed URLs for access (1 year validity)
- ✅ `verification_type` separates tenant vs host documents
- ✅ Same document type can exist for both tenant and host verification

**RLS Policies:**
- Users can view and upload their own documents
- Admins can view all documents for verification

---

### 5. `notifications` Table

**Purpose:** User notifications

**Key Fields:**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES auth.users(id)
type TEXT NOT NULL  -- 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'message' | 'system'
title TEXT NOT NULL
message TEXT NOT NULL  -- Main message field
body TEXT NULLABLE  -- Deprecated, use message instead
is_read BOOLEAN DEFAULT false
read_at TIMESTAMPTZ NULLABLE
related_id UUID NULLABLE  -- Related booking, message, etc.
car_id UUID NULLABLE  -- Related vehicle
data JSONB NULLABLE  -- Additional data
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Important Notes:**
- ✅ Use `message` field (not `body`)
- ✅ `related_id` links to bookings, messages, etc.
- ✅ Notifications are created by triggers and Edge Functions

---

### 6. `favorites` Table

**Purpose:** User favorite vehicles

**Key Fields:**
```sql
user_id UUID NOT NULL REFERENCES auth.users(id)
car_id UUID NOT NULL REFERENCES cars(id)  -- ⚠️ NOT vehicle_id!
created_at TIMESTAMPTZ
PRIMARY KEY (user_id, car_id)  -- ⚠️ Composite primary key, no id field!
```

**Important Notes:**
- ⚠️ **No `id` field** - composite primary key
- ✅ Use `car_id` (not `vehicle_id`)
- ✅ Use composite key for upsert operations

---

### 7. `vehicle_blocked_dates` Table

**Purpose:** Dates when vehicles are unavailable (maintenance, manual blocks)

**Key Fields:**
```sql
id UUID PRIMARY KEY
vehicle_id UUID NOT NULL REFERENCES cars(id)  -- ⚠️ Uses vehicle_id in table name but car_id in reference!
blocked_date DATE NOT NULL  -- YYYY-MM-DD format
reason TEXT DEFAULT 'manual'  -- 'maintenance' | 'manual' | 'other'
note TEXT NULLABLE
created_by UUID REFERENCES auth.users(id)
created_at TIMESTAMPTZ
UNIQUE(vehicle_id, blocked_date)  -- Prevent duplicate blocks
```

**Important Notes:**
- ⚠️ Table name uses `vehicle_id` but references `cars(id)` - confusing naming
- ✅ Use DATE format (not TIMESTAMPTZ) for `blocked_date`
- ✅ Check both blocked dates AND bookings for availability

---

## 🔄 Relationships

### User → Profile
- One-to-one: `profiles.id` = `auth.users.id`
- Auto-created by trigger on signup

### User → Vehicles
- One-to-many: `cars.host_id` = `auth.users.id`
- User can own multiple vehicles

### User → Bookings (as Renter)
- One-to-many: `bookings.user_id` = `auth.users.id`

### User → Bookings (as Owner)
- One-to-many: `bookings.host_id` = `auth.users.id`

### Vehicle → Bookings
- One-to-many: `bookings.car_id` = `cars.id`

### User → Documents
- One-to-many: `identity_documents.user_id` = `auth.users.id`

### User → Favorites
- Many-to-many: `favorites` table with composite key

---

## 📝 Enums and Types

### `user_role` Enum
```sql
'locataire'    -- Default for new users
'proprietaire' -- Owner role
'host'         -- Alternative owner role
'renter'       -- Alternative tenant role
'admin'        -- Admin role
```

### `booking_status` (Text, not enum)
```sql
'pending'      -- Awaiting owner approval
'confirmed'    -- Owner approved
'active'       -- Currently in progress
'completed'    -- Rental finished
'cancelled'    -- Cancelled by user or owner
'rejected'    -- Owner rejected
```

### `payment_status` (Text, not enum)
```sql
'pending'      -- Payment not yet processed
'paid'         -- Payment successful
'refunded'    -- Payment refunded
'failed'       -- Payment failed
```

### `verification_status` (Text, not enum)
```sql
'pending'      -- Awaiting review
'approved'     -- Document approved
'rejected'     -- Document rejected
```

---

## 🔐 Row Level Security (RLS)

### General RLS Status
- Most tables have RLS enabled
- Some tables have RLS disabled for specific operations (check migrations)

### Common RLS Patterns

**Public Read (Approved Items Only):**
```sql
CREATE POLICY "Public can view approved items"
ON public.cars FOR SELECT
TO public
USING (is_approved = true AND is_available = true);
```

**User Own Data:**
```sql
CREATE POLICY "Users can manage own data"
ON public.cars FOR ALL
TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());
```

**Related Data Access:**
```sql
CREATE POLICY "Users can view related bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR  -- As renter
  host_id = auth.uid()     -- As owner
);
```

---

## 🗄️ Storage Buckets

### `vehicles` (or `car-images`)
- **Purpose:** Vehicle images
- **Access:** Public read, authenticated write
- **Path Structure:** `{vehicle_id}/{image_name}`

### `avatars`
- **Purpose:** User profile pictures
- **Access:** Public read, authenticated write (own avatar only)
- **Path Structure:** `{user_id}/avatar.{ext}`

### `user_documents`
- **Purpose:** Identity verification documents
- **Access:** Private (signed URLs only)
- **Path Structure:** `{user_id}/{document_type}/{timestamp}_{filename}`

---

## ⚡ Important Functions and Triggers

### `handle_new_user()`
- **Trigger:** Fires on `auth.users` insert
- **Purpose:** Auto-creates profile with default values
- **Sets:** `role = 'locataire'`, `verified_tenant = false`, `verified_host = false`

### `notify_owner_on_booking()`
- **Trigger:** Fires on `bookings` insert
- **Purpose:** Creates notification for vehicle owner
- **Creates:** Notification record in `notifications` table

### `get_user_emails()`
- **RPC Function:** Returns emails for user IDs
- **Purpose:** Used by email system to get user emails
- **Usage:** `SELECT * FROM get_user_emails(ARRAY['user_id_1', 'user_id_2'])`

---

## 🚨 Common Pitfalls

1. **Field Name Confusion:**
   - ❌ Using `owner_id` in queries → ✅ Use `host_id`
   - ❌ Using `vehicle_id` in queries → ✅ Use `car_id`
   - ❌ Using `renter_id` in queries → ✅ Use `user_id`

2. **Type Confusion:**
   - ❌ Treating `images` as TEXT[] → ✅ It's JSONB array
   - ❌ Using `status` field on cars → ✅ Use `is_available` boolean
   - ❌ Using `available` field → ✅ Use `is_available`

3. **Role Mapping:**
   - ❌ Using `'owner'` in database → ✅ Use `'proprietaire'` or `'host'`
   - ❌ Using `'renter'` in database → ✅ Use `'locataire'`

4. **Date Handling:**
   - ⚠️ `start_date` and `end_date` in bookings are DATE type (not TIMESTAMPTZ)
   - ⚠️ Use DATE format (YYYY-MM-DD) for blocked dates

5. **Composite Keys:**
   - ⚠️ `favorites` table has no `id` field - use composite key

---

## 📚 Migration History

Key migrations to be aware of:
- `20240330000000_create_cars_table.sql` - Initial cars table
- `20240528_update_bookings_table.sql` - Bookings structure
- `20240329_create_user_documents.sql` - Document storage
- `20250131_create_verification_requests.sql` - Verification system
- `20250202_fix_cars_rls_public_access.sql` - RLS fixes

---

## 🔍 Query Examples

### Get Available Vehicles
```sql
SELECT * FROM cars
WHERE is_available = true
  AND is_approved = true
  AND location ILIKE '%Rabat%';
```

### Get User Bookings (as Renter)
```sql
SELECT 
  b.*,
  car:cars(*),
  host:profiles!host_id(*)
FROM bookings b
WHERE b.user_id = $1  -- Renter ID
ORDER BY b.created_at DESC;
```

### Get User Bookings (as Owner)
```sql
SELECT 
  b.*,
  car:cars(*),
  renter:profiles!user_id(*)
FROM bookings b
WHERE b.host_id = $1  -- Owner ID
ORDER BY b.created_at DESC;
```

### Check Vehicle Availability
```sql
-- Check for conflicting bookings
SELECT COUNT(*) FROM bookings
WHERE car_id = $1
  AND status IN ('pending', 'confirmed', 'active')
  AND start_date <= $3  -- end_date
  AND end_date >= $2;   -- start_date

-- Check for blocked dates
SELECT COUNT(*) FROM vehicle_blocked_dates
WHERE vehicle_id = $1
  AND blocked_date >= $2  -- start_date
  AND blocked_date <= $3; -- end_date
```

---



