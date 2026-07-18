DROP POLICY IF EXISTS "Authenticated users can view member photos" ON storage.objects;

CREATE POLICY "Scoped access to member photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'membres-photos'
    AND (
      public.is_berger()
      OR owner = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.membres m
        WHERE m.photo_url = storage.objects.name
          AND m.service_id IS NOT NULL
          AND public.is_responsable_of_service(m.service_id)
      )
    )
  );