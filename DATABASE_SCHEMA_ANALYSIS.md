# Analyse de la Base de Données Supabase - RAKB

## Date: 2025-01-29

### Table Principale: `cars`

**Champs Importants:**
- `id` (uuid) - Identifiant unique
- `host_id` (uuid) - **ATTENTION**: C'est `host_id`, pas `owner_id`!
- `brand` (text) - Marque du véhicule
- `model` (text) - Modèle
- `make` (text, nullable) - Alternative à `brand`
- `year` (integer, nullable)
- `images` (jsonb, default: `'[]'::jsonb`) - **ATTENTION**: C'est un JSONB, pas un TEXT[]
- `features` (jsonb, default: `'[]'::jsonb`) - **ATTENTION**: C'est un JSONB, pas un TEXT[]
- `price_per_day` (numeric)
- `location` (text, nullable) - **ATTENTION**: C'est un TEXT simple, pas GEOGRAPHY!
- `latitude` (double precision, nullable)
- `longitude` (double precision, nullable)
- `is_available` (boolean, nullable, default: true) - **ATTENTION**: C'est `is_available`, pas `available`!
- `is_approved` (boolean, default: true) - Pour la modération
- `status` - **N'EXISTE PAS** dans cette table
- `category` (text, nullable)
- `seats` (integer, nullable)
- `transmission` (text, nullable)
- `fuel_type` (text, nullable)
- `rating` (numeric, nullable, default: 0)
- `review_count` (integer, nullable, default: 0) - **ATTENTION**: C'est `review_count`, pas `reviews_count`!
- `cleaning_fee` (numeric, nullable)
- `cancellation_policy` (text, nullable)
- `promo_code` (text, nullable)
- `insurance_enabled` (boolean, nullable, default: true)
- `selected_insurance` (text, nullable)
- `is_verified` (boolean, nullable, default: false)
- `license_plate` (text, nullable)
- `color` (text, nullable)
- `custom_pricing` (jsonb, nullable)
- `pricing_config_id` (uuid, nullable)
- `extras` (text, nullable) - JSON array as text
- `pickup_locations` (text, nullable) - JSON array as text
- `return_locations` (text, default: `'[]'::text`)
- `daily_rate` (numeric, nullable)
- `favorites_count` (integer, nullable, default: 0)

### Table `profiles`

**Champs Importants:**
- `id` (uuid) - Référence auth.users.id
- `role` (user_role enum) - Valeurs: `'admin'`, `'host'`, `'renter'`, `'locataire'`, `'proprietaire'`
  - **ATTENTION**: Valeurs réelles: `'locataire'`, `'proprietaire'`, `'host'`, `'renter'`, `'admin'`
  - Par défaut: `'locataire'`
- `verified_tenant` (boolean, default: false)
- `verified_host` (boolean, default: false)
- `is_host` (boolean, default: false)
- `first_name`, `last_name`, `phone_number`, `avatar_url`, etc.

### Table `bookings`

**Champs Importants:**
- `id` (uuid)
- `user_id` (uuid) - Le locataire
- `host_id` (uuid) - Le propriétaire
- `car_id` (uuid) - **ATTENTION**: C'est `car_id`, pas `vehicle_id`!
- `start_date`, `end_date` (date)
- `start_time`, `end_time` (timestamptz, nullable)
- `status` (text, default: `'pending'`)
- `total_amount` (numeric)
- `payment_status` (text, default: `'pending'`)
- `pickup_location` (text)
- `dropoff_location` (text, nullable)
- `reference_number` (text, unique) - Format: RAKB-XXXX

### Table `favorites`

**Structure:**
- `user_id` (uuid) - Primary key part 1
- `car_id` (uuid) - Primary key part 2
- `created_at` (timestamptz)

**ATTENTION**: La clé primaire est composite (`user_id`, `car_id`), pas un `id` unique!

### Table `notifications`

**Champs:**
- `id` (uuid)
- `user_id` (uuid)
- `title` (text)
- `message` (text, nullable) - Colonne principale (remplace `body`)
- `body` (text, nullable) - Deprecated mais toujours présent
- `is_read` (boolean, default: false)
- `read_at` (timestamptz, nullable)
- `type` (varchar, default: `'system'`)
- `data` (jsonb, nullable)
- `car_id` (uuid, nullable)

### Corrections Nécessaires dans le Code

1. **Backend Vehicles (`src/lib/backend/vehicles.ts`)**:
   - ❌ Utiliser `owner_id` → ✅ Utiliser `host_id`
   - ❌ Utiliser `available` → ✅ Utiliser `is_available`
   - ❌ Utiliser `status` pour filtrer → ✅ Utiliser `is_available = true`
   - ❌ Traiter `images` comme TEXT[] → ✅ Traiter comme JSONB
   - ❌ Traiter `features` comme TEXT[] → ✅ Traiter comme JSONB
   - ❌ Utiliser `reviews_count` → ✅ Utiliser `review_count`

2. **Backend Favorites (`src/lib/backend/favorites.ts`)**:
   - ❌ Utiliser `vehicle_id` → ✅ Utiliser `car_id`
   - ❌ Utiliser `vehicles(*)` dans select → ✅ Utiliser `cars(*)`

3. **Backend Bookings (`src/lib/backend/bookings.ts`)**:
   - ❌ Utiliser `vehicle_id` → ✅ Utiliser `car_id`
   - ✅ Utiliser `host_id` (déjà correct)

4. **Backend Auth (`src/lib/backend/auth.ts`)**:
   - ⚠️ Vérifier les valeurs d'enum `role`: `'locataire'`, `'proprietaire'`, `'host'`, `'renter'`, `'admin'`
   - Le code actuel utilise `'owner'` et `'renter'` qui ne correspondent pas exactement

