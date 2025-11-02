-- Create storage bucket for user documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_documents', 'user_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the bucket
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'user_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
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

-- Create policy for admins to view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'user_documents' AND
    EXISTS (
        SELECT 1 FROM auth.users
        JOIN public.profiles ON profiles.user_id = auth.users.id
        WHERE auth.users.id = auth.uid()
        AND profiles.role = 'admin'
    )
); 