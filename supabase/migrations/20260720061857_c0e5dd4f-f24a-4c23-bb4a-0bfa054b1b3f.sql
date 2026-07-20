DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or berger updates any"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_berger())
WITH CHECK (id = auth.uid() OR public.is_berger());