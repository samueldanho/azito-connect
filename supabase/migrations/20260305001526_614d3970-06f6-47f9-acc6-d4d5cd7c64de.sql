
-- Fix overly permissive INSERT policy - notifications are inserted via edge functions with service role key
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
-- No INSERT policy needed for authenticated users - edge functions use service role which bypasses RLS
