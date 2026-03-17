
-- Create zones table
CREATE TABLE public.bus_center_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bus_center_zones ENABLE ROW LEVEL SECURITY;

-- Everyone can read zones (needed for public form via edge function)
CREATE POLICY "Anyone can view zones" ON public.bus_center_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Berger can insert zones" ON public.bus_center_zones FOR INSERT TO authenticated WITH CHECK (is_berger());
CREATE POLICY "Berger can update zones" ON public.bus_center_zones FOR UPDATE TO authenticated USING (is_berger());
CREATE POLICY "Berger can delete zones" ON public.bus_center_zones FOR DELETE TO authenticated USING (is_berger());

-- Add zone_id to bus_center
ALTER TABLE public.bus_center ADD COLUMN zone_id uuid REFERENCES public.bus_center_zones(id) ON DELETE SET NULL;
