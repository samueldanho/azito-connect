-- Make bucket private and add server-side restrictions
UPDATE storage.buckets 
SET public = false,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    file_size_limit = 5242880
WHERE id = 'membres-photos';

-- Drop public access policy
DROP POLICY IF EXISTS "Member photos are publicly accessible" ON storage.objects;

-- Add authenticated-only access policy for viewing
CREATE POLICY "Authenticated users can view member photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'membres-photos');
