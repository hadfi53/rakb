-- Créer le bucket user_documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user_documents',
    'user_documents',
    false,
    5242880, -- 5MB
    '{image/jpeg,image/png,application/pdf}'
)
ON CONFLICT (id) DO UPDATE
SET 
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = '{image/jpeg,image/png,application/pdf}';

-- Créer la table user_documents si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    file_url text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS sur la table user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la table user_documents
CREATE POLICY "Users can view their own documents"
    ON public.user_documents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON public.user_documents
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON public.user_documents
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON public.user_documents
    FOR DELETE
    USING (auth.uid() = user_id);

-- Ajouter le trigger pour updated_at
CREATE TRIGGER handle_user_documents_updated_at
    BEFORE UPDATE ON public.user_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Créer les politiques de stockage
CREATE POLICY "Authenticated users can upload documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'user_documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'user_documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own documents"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'user_documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own documents"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'user_documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    ); 