-- Script pour corriger le rôle de l'utilisateur hhadfi53@gmail.com

-- 1. Mettre à jour le rôle dans la table profiles
UPDATE profiles
SET 
  role = 'renter',
  updated_at = NOW()
WHERE email = 'hhadfi53@gmail.com';

-- 2. Mettre à jour le rôle dans les métadonnées de l'utilisateur
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "renter"}'::jsonb
WHERE email = 'hhadfi53@gmail.com';

-- 3. Vérifier que la mise à jour a bien été effectuée
SELECT 
  p.id,
  p.email,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as metadata_role,
  p.updated_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'hhadfi53@gmail.com'; 