-- Script pour retrouver un utilisateur par son email

-- IMPORTANT: Remplacez 'EMAIL_UTILISATEUR_ICI' par l'email de l'utilisateur que vous recherchez

-- Rechercher l'utilisateur dans la table des profils et auth.users
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
WHERE p.email = 'EMAIL_UTILISATEUR_ICI';

-- Si vous ne vous souvenez pas de l'email exact, vous pouvez utiliser ILIKE pour une recherche partielle
-- Décommentez la requête ci-dessous et remplacez 'PARTIE_EMAIL' par une partie de l'email

/*
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
WHERE p.email ILIKE '%PARTIE_EMAIL%'
ORDER BY u.created_at DESC;
*/ 