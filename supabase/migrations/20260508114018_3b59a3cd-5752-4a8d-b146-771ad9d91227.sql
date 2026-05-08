
-- 1. Drop unused code_acces column from profiles (no app references)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS code_acces;

-- 2. Tighten storage policies for membres-photos: only berger or file owner
DROP POLICY IF EXISTS "Authenticated users can delete member photos" ON storage.objects;
CREATE POLICY "Berger or owner can delete member photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'membres-photos' AND (public.is_berger() OR owner = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update member photos" ON storage.objects;
CREATE POLICY "Berger or owner can update member photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'membres-photos' AND (public.is_berger() OR owner = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can upload member photos" ON storage.objects;
CREATE POLICY "Authenticated staff can upload member photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'membres-photos'
    AND (public.is_berger() OR public.has_role(auth.uid(), 'responsable_service'))
    AND owner = auth.uid()
  );

-- 3. Restrict NULL-service membre updates to bergers only
DROP POLICY IF EXISTS "Berger updates any membre, responsables in their service" ON public.membres;
CREATE POLICY "Berger updates any membre, responsables in their service"
  ON public.membres FOR UPDATE TO authenticated
  USING (public.is_berger() OR public.is_responsable_of_service(service_id));

-- 4. Realtime channel authorization: only authenticated users, scoped policies
-- Allow authenticated users to read realtime.messages on permitted topics only
DROP POLICY IF EXISTS "Authenticated can read bus_center realtime" ON realtime.messages;
CREATE POLICY "Authenticated can read bus_center realtime"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    (realtime.topic() LIKE 'bus_center%' OR realtime.topic() LIKE 'bus-center%')
  );
