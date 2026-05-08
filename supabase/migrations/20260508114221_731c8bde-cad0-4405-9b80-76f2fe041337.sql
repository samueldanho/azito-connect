
-- Trigger-only functions: no API caller ever needs to invoke these.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: required by authenticated callers (RLS evaluates as caller),
-- but anon never has table access, so revoke anon + PUBLIC.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_berger() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_responsable_of_service(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_service_id() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_berger() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_responsable_of_service(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_service_id() TO authenticated;
