-- =====================================================
-- MON ÉGLISE CONNECT - Database Schema
-- =====================================================

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('berger', 'responsable_service');

-- 2. Create enum for member status
CREATE TYPE public.statut_bapteme AS ENUM ('baptise', 'non_baptise');

-- 3. Create enum for activity types
CREATE TYPE public.type_activite AS ENUM ('culte', 'reunion', 'activite_speciale');

-- 4. Create enum for action types (for logs)
CREATE TYPE public.action_type AS ENUM ('connexion', 'ajout_membre', 'modification_membre', 'suppression_membre', 'marquage_presence', 'creation_service', 'modification_service');

-- =====================================================
-- TABLES
-- =====================================================

-- 5. Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  couleur TEXT DEFAULT '#D97706',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_complet TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  avatar_url TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  code_acces TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. User roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- 8. Membres table (church members - not users)
CREATE TABLE public.membres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_complet TEXT NOT NULL,
  telephone TEXT,
  lieu_habitation TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  statut_bapteme statut_bapteme DEFAULT 'non_baptise' NOT NULL,
  photo_url TEXT,
  date_inscription DATE DEFAULT CURRENT_DATE NOT NULL,
  est_actif BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Presences table
CREATE TABLE public.presences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membre_id UUID REFERENCES public.membres(id) ON DELETE CASCADE NOT NULL,
  date_presence DATE NOT NULL,
  type_activite type_activite NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  est_present BOOLEAN DEFAULT true NOT NULL,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (membre_id, date_presence, type_activite)
);

-- 10. Activity logs table (CRM)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action action_type NOT NULL,
  description TEXT NOT NULL,
  entite_type TEXT,
  entite_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_membres_service ON public.membres(service_id);
CREATE INDEX idx_membres_created_by ON public.membres(created_by);
CREATE INDEX idx_presences_membre ON public.presences(membre_id);
CREATE INDEX idx_presences_date ON public.presences(date_presence);
CREATE INDEX idx_presences_service ON public.presences(service_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_profiles_service ON public.profiles(service_id);

-- =====================================================
-- SECURITY DEFINER FUNCTION (prevents RLS recursion)
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is berger
CREATE OR REPLACE FUNCTION public.is_berger()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'berger')
$$;

-- Function to check if user is responsable of a specific service
CREATE OR REPLACE FUNCTION public.is_responsable_of_service(_service_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND ur.role = 'responsable_service'
      AND p.service_id = _service_id
  )
$$;

-- Function to get user's service_id
CREATE OR REPLACE FUNCTION public.get_user_service_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT service_id FROM public.profiles WHERE id = auth.uid()
$$;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - SERVICES
-- =====================================================
-- Everyone authenticated can view services
CREATE POLICY "Services are viewable by authenticated users"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

-- Only berger can manage services
CREATE POLICY "Berger can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_berger());

CREATE POLICY "Berger can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_berger());

CREATE POLICY "Berger can delete services"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.is_berger());

-- =====================================================
-- RLS POLICIES - PROFILES
-- =====================================================
-- Users can view their own profile, berger can view all
CREATE POLICY "Users can view own profile, berger can view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_berger());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Allow insert during signup
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- RLS POLICIES - USER_ROLES
-- =====================================================
-- Only berger can view all roles, users can view their own
CREATE POLICY "Users can view own roles, berger can view all"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_berger());

-- Only berger can manage roles
CREATE POLICY "Berger can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_berger());

CREATE POLICY "Berger can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_berger());

-- =====================================================
-- RLS POLICIES - MEMBRES
-- =====================================================
-- Berger can view all membres, responsables only their service
CREATE POLICY "Berger views all membres, responsables view their service"
  ON public.membres FOR SELECT
  TO authenticated
  USING (
    public.is_berger() 
    OR public.is_responsable_of_service(service_id)
  );

-- Berger can insert any membre, responsables only in their service
CREATE POLICY "Berger inserts any membre, responsables in their service"
  ON public.membres FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_berger() 
    OR (public.has_role(auth.uid(), 'responsable_service') AND service_id = public.get_user_service_id())
  );

-- Same for update
CREATE POLICY "Berger updates any membre, responsables in their service"
  ON public.membres FOR UPDATE
  TO authenticated
  USING (
    public.is_berger() 
    OR public.is_responsable_of_service(service_id)
  );

-- Same for delete
CREATE POLICY "Berger deletes any membre, responsables in their service"
  ON public.membres FOR DELETE
  TO authenticated
  USING (
    public.is_berger() 
    OR public.is_responsable_of_service(service_id)
  );

-- =====================================================
-- RLS POLICIES - PRESENCES
-- =====================================================
-- Berger can view all presences, responsables only their service
CREATE POLICY "Berger views all presences, responsables view their service"
  ON public.presences FOR SELECT
  TO authenticated
  USING (
    public.is_berger() 
    OR public.is_responsable_of_service(service_id)
  );

-- Insert presences
CREATE POLICY "Berger inserts any presence, responsables in their service"
  ON public.presences FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_berger() 
    OR (public.has_role(auth.uid(), 'responsable_service') AND service_id = public.get_user_service_id())
  );

-- Update presences
CREATE POLICY "Berger updates any presence, responsables in their service"
  ON public.presences FOR UPDATE
  TO authenticated
  USING (
    public.is_berger() 
    OR public.is_responsable_of_service(service_id)
  );

-- Delete presences
CREATE POLICY "Berger deletes any presence, responsables in their service"
  ON public.presences FOR DELETE
  TO authenticated
  USING (
    public.is_berger() 
    OR public.is_responsable_of_service(service_id)
  );

-- =====================================================
-- RLS POLICIES - ACTIVITY_LOGS
-- =====================================================
-- Only berger can view all logs
CREATE POLICY "Berger can view all activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_berger());

-- All authenticated users can insert logs (for their own actions)
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TIMESTAMP UPDATE TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membres_updated_at
  BEFORE UPDATE ON public.membres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET FOR MEMBER PHOTOS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('membres-photos', 'membres-photos', true);

-- Storage policies for member photos
CREATE POLICY "Member photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'membres-photos');

CREATE POLICY "Authenticated users can upload member photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'membres-photos');

CREATE POLICY "Authenticated users can update member photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'membres-photos');

CREATE POLICY "Authenticated users can delete member photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'membres-photos');