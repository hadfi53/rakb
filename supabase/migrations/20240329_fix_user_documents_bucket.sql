-- Supprimer le bucket s'il existe déjà
DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;

-- Créer le bucket user_documents s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_documents', 'user_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs authentifiés de téléverser leurs documents
CREATE POLICY "Allow authenticated users to upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs authentifiés de voir leurs documents
CREATE POLICY "Allow authenticated users to view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs authentifiés de mettre à jour leurs documents
CREATE POLICY "Allow authenticated users to update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs authentifiés de supprimer leurs documents
CREATE POLICY "Allow authenticated users to delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
); 