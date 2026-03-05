
-- Allow responsables to update members with no service (registered via public form)
DROP POLICY IF EXISTS "Berger updates any membre, responsables in their service" ON public.membres;

CREATE POLICY "Berger updates any membre, responsables in their service"
ON public.membres
FOR UPDATE
TO authenticated
USING (
  is_berger()
  OR is_responsable_of_service(service_id)
  OR (service_id IS NULL AND has_role(auth.uid(), 'responsable_service'))
);
