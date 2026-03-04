
-- Allow authenticated users to upload story media (path starts with 'stories/')
CREATE POLICY "Users can upload story media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = 'stories'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to view story media
CREATE POLICY "Users can view story media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = 'stories'
);

-- Allow users to delete their own story media
CREATE POLICY "Users can delete own story media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[1] = 'stories'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
