
DROP POLICY IF EXISTS "Berger views all membres, responsables view their service" ON public.membres;

CREATE POLICY "Berger views all membres, responsables view their service"
ON public.membres
FOR SELECT
TO authenticated
USING (
  is_berger()
  OR is_responsable_of_service(service_id)
  OR (service_id IS NULL AND has_role(auth.uid(), 'responsable_service'))
);
