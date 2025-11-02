-- Script pour lister tous les utilisateurs avec leurs rôles

-- Cette requête affiche tous les utilisateurs avec leurs rôles
-- à la fois dans la table profiles et dans les métadonnées auth.users
SELECT 
    p.id, 
    p.email, 
    p.first_name, 
    p.last_name, 
    p.role as profile_role, 
    u.raw_user_meta_data->>'role' as metadata_role,
    CASE 
        WHEN p.role != (u.raw_user_meta_data->>'role')::text 
        AND (u.raw_user_meta_data->>'role') IS NOT NULL
        THEN true
        ELSE false
    END as role_mismatch,
    u.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY u.created_at DESC;

-- Utilisateurs avec des rôles incohérents entre profils et métadonnées
SELECT 
    p.id, 
    p.email, 
    p.first_name, 
    p.last_name, 
    p.role as profile_role, 
    u.raw_user_meta_data->>'role' as metadata_role,
    u.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE 
    p.role != (u.raw_user_meta_data->>'role')::text 
    AND (u.raw_user_meta_data->>'role') IS NOT NULL
ORDER BY u.created_at DESC; 