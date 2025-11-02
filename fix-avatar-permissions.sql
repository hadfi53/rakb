/*
  Script pour configurer les permissions du bucket 'avatars' dans Supabase
  
  Ce script doit être exécuté dans l'éditeur SQL de Supabase.
  Il configure les politiques d'accès pour le bucket 'avatars',
  permettant aux utilisateurs authentifiés de télécharger et gérer
  leurs propres avatars.
*/

-- Vérifier si le bucket avatars existe et le créer si nécessaire
DO $$
BEGIN
  -- Si les fonctions API REST pour storage ne sont pas disponibles, on utilise une approche indirecte
  -- pour vérifier l'existence du bucket et le créer
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'storage' 
    AND tablename = 'buckets'
  ) THEN
    -- Vérifier si le bucket avatars existe
    IF NOT EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE name = 'avatars'
    ) THEN
      -- Créer le bucket avatars
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('avatars', 'avatars', true);
      
      RAISE NOTICE 'Bucket avatars créé avec succès';
    ELSE
      RAISE NOTICE 'Le bucket avatars existe déjà';
    END IF;
    
    -- Rendre le bucket public (nécessaire pour que les avatars soient visibles)
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'avatars';
    
    RAISE NOTICE 'Le bucket avatars est maintenant public';
  ELSE
    RAISE EXCEPTION 'Tables storage.buckets non disponible. Utilisez l''interface Supabase pour créer le bucket.';
  END IF;
END $$;

-- Configurer les politiques d'accès pour le bucket avatars
DO $$
BEGIN
  -- Supprimer les politiques existantes pour éviter les conflits
  BEGIN
    DELETE FROM storage.policies 
    WHERE bucket_id = 'avatars';
    RAISE NOTICE 'Anciennes politiques supprimées';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Échec de la suppression des politiques existantes : %', SQLERRM;
  END;
  
  -- Créer les nouvelles politiques
  
  -- Politique pour insérer (upload)
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'Avatar Upload Policy',
      'avatars',
      'INSERT',
      '(auth.uid() = storage.foldername(name))'
    );
    RAISE NOTICE 'Politique d''insertion créée';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Échec de la création de la politique d''insertion : %', SQLERRM;
  END;
  
  -- Politique pour sélectionner (download)
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'Avatar Download Policy',
      'avatars',
      'SELECT',
      'true'  -- Tous peuvent télécharger les avatars
    );
    RAISE NOTICE 'Politique de téléchargement créée';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Échec de la création de la politique de téléchargement : %', SQLERRM;
  END;
  
  -- Politique pour mettre à jour
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'Avatar Update Policy',
      'avatars',
      'UPDATE',
      '(auth.uid() = storage.foldername(name))'
    );
    RAISE NOTICE 'Politique de mise à jour créée';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Échec de la création de la politique de mise à jour : %', SQLERRM;
  END;
  
  -- Politique pour supprimer
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'Avatar Delete Policy',
      'avatars',
      'DELETE',
      '(auth.uid() = storage.foldername(name))'
    );
    RAISE NOTICE 'Politique de suppression créée';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Échec de la création de la politique de suppression : %', SQLERRM;
  END;
  
END $$;

-- Vérifier les politiques créées
SELECT name, bucket_id, operation, definition
FROM storage.policies
WHERE bucket_id = 'avatars'
ORDER BY operation;

-- Instructions d'utilisation
/*
  Après avoir exécuté ce script, vous devriez voir les politiques
  créées pour le bucket 'avatars'. Elles sont configurées de manière
  à ce que chaque utilisateur puisse:
  
  1. Télécharger des avatars dans son propre dossier (nommé d'après son ID)
  2. Lire tous les avatars publics
  3. Mettre à jour ses propres avatars
  4. Supprimer ses propres avatars
  
  Si vous rencontrez des erreurs lors de l'exécution, vous devrez peut-être
  configurer manuellement le bucket via l'interface de Supabase:
  
  1. Allez dans Storage > Buckets
  2. Créez un bucket nommé 'avatars' s'il n'existe pas
  3. Cochez l'option "Public" pour le bucket
  4. Dans l'onglet "Policies", configurez les politiques comme décrit ci-dessus
*/ 