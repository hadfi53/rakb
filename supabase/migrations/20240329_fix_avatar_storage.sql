-- Vérifier et configurer le bucket avatars
DO $$
BEGIN
    -- Créer le bucket s'il n'existe pas
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO UPDATE
    SET public = true;

    -- Supprimer les anciennes politiques pour éviter les conflits
    DELETE FROM storage.policies WHERE bucket_id = 'avatars';

    -- Politique pour permettre la lecture publique des avatars
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
        'Avatar Public Access',
        'avatars',
        'SELECT',
        'true'  -- Tout le monde peut lire les avatars
    );

    -- Politique pour permettre l'upload par les utilisateurs authentifiés
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
        'Avatar Upload Access',
        'avatars',
        'INSERT',
        '(auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
    );

    -- Politique pour permettre la mise à jour par les propriétaires
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
        'Avatar Update Access',
        'avatars',
        'UPDATE',
        '(auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
    );

    -- Politique pour permettre la suppression par les propriétaires
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
        'Avatar Delete Access',
        'avatars',
        'DELETE',
        '(auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)'
    );

    -- Mettre à jour les configurations CORS pour permettre l'accès depuis le frontend
    UPDATE storage.buckets
    SET cors_rules = '[{"allowed_origins": ["*"], "allowed_methods": ["GET", "PUT", "POST", "DELETE"], "allowed_headers": ["*"], "expose_headers": ["Content-Range", "Range"], "max_age_seconds": 3600}]'::jsonb
    WHERE id = 'avatars';

END $$; 