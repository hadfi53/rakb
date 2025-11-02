-- Script pour mettre à jour le rôle d'un utilisateur de 'owner' à 'renter'

-- IMPORTANT: Remplacez 'ID_UTILISATEUR_ICI' par l'ID de l'utilisateur que vous souhaitez modifier
-- Vous pouvez trouver l'ID de l'utilisateur dans la table des profils en recherchant son email ou son nom

-- Mettre à jour le rôle dans la table des profils
UPDATE profiles
SET role = 'renter'
WHERE id = 'ID_UTILISATEUR_ICI';

-- Vous pouvez également mettre à jour le rôle dans les métadonnées de l'utilisateur
-- Cette étape est facultative si vous utilisez principalement la table 'profiles' pour gérer les rôles
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "renter"}'::jsonb
WHERE id = 'ID_UTILISATEUR_ICI';

-- Pour vérifier que la mise à jour a bien été effectuée
SELECT p.id, p.email, p.role as profile_role, u.raw_user_meta_data->>'role' as metadata_role
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = 'ID_UTILISATEUR_ICI'; 