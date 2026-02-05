-- Add unique constraint for upsert on presences table
ALTER TABLE public.presences 
ADD CONSTRAINT presences_membre_date_type_unique 
UNIQUE (membre_id, date_presence, type_activite);