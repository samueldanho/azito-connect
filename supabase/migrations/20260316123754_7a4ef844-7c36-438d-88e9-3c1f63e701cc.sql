CREATE TABLE public.bus_center (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  heure_depart time NOT NULL,
  nombre_anciens integer NOT NULL DEFAULT 0,
  nombre_nouveaux integer NOT NULL DEFAULT 0,
  date_dimanche date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bus_center ENABLE ROW LEVEL SECURITY;

-- Public insert via edge function (service role)
-- Authenticated users can view
CREATE POLICY "Authenticated users can view bus_center"
  ON public.bus_center FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Berger can delete bus_center"
  ON public.bus_center FOR DELETE TO authenticated
  USING (is_berger());