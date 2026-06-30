
-- Role enum
CREATE TYPE public.app_role AS ENUM ('main', 'official', 'member');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  stage TEXT NOT NULL,
  official_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.groups TO anon, authenticated;
GRANT INSERT, UPDATE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT NOT NULL,
  plate TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','removed')),
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  target_savings INT NOT NULL DEFAULT 52000,
  target_contributions INT NOT NULL DEFAULT 26000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.group_members (group_id);
CREATE INDEX ON public.group_members (user_id);
GRANT SELECT, INSERT, UPDATE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Weekly records
CREATE TABLE public.weekly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  attendance TEXT NOT NULL CHECK (attendance IN ('present','apology','absent')),
  savings_kes INT NOT NULL DEFAULT 0,
  contribution_kes INT NOT NULL DEFAULT 0,
  development_kes INT NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, week_start)
);
CREATE INDEX ON public.weekly_records (group_id, week_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_records TO authenticated;
GRANT ALL ON public.weekly_records TO service_role;
ALTER TABLE public.weekly_records ENABLE ROW LEVEL SECURITY;

-- Welfare events
CREATE TABLE public.welfare_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  beneficiary_member_id UUID REFERENCES public.group_members(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('death','accident','illness','other')),
  title TEXT NOT NULL,
  details TEXT,
  amount_kes INT NOT NULL DEFAULT 0,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.welfare_events (group_id, event_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.welfare_events TO authenticated;
GRANT ALL ON public.welfare_events TO service_role;
ALTER TABLE public.welfare_events ENABLE ROW LEVEL SECURITY;

-- Development logs
CREATE TABLE public.development_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount_kes INT NOT NULL DEFAULT 0,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.development_logs (group_id, log_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.development_logs TO authenticated;
GRANT ALL ON public.development_logs TO service_role;
ALTER TABLE public.development_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is user in group (as a member's user_id)
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE user_id = _user_id AND group_id = _group_id)
$$;

CREATE OR REPLACE FUNCTION public.is_group_official(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id AND official_id = _user_id)
$$;

-- RLS policies

-- profiles: self read/write; main can read all
CREATE POLICY "self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'main'));
CREATE POLICY "self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles: self read; main read all
CREATE POLICY "self roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'main'));

-- groups: read all; officials can update their own group; authenticated can insert (sign-up creates group for official)
CREATE POLICY "groups read all" ON public.groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "groups insert auth" ON public.groups FOR INSERT TO authenticated WITH CHECK (official_id = auth.uid() OR public.has_role(auth.uid(),'main'));
CREATE POLICY "groups update by official" ON public.groups FOR UPDATE TO authenticated USING (official_id = auth.uid() OR public.has_role(auth.uid(),'main'));

-- group_members: visible to self, group official, main
CREATE POLICY "members read" ON public.group_members FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "members insert by official" ON public.group_members FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id)
  OR user_id = auth.uid()  -- a member self-registering joins their group
  OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "members update by official" ON public.group_members FOR UPDATE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
  OR (user_id = auth.uid())
);

-- weekly_records: visible to self member, official, main; writable by official only
CREATE POLICY "records read" ON public.weekly_records FOR SELECT TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.id = member_id AND gm.user_id = auth.uid())
);
CREATE POLICY "records write by official" ON public.weekly_records FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "records update by official" ON public.weekly_records FOR UPDATE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "records delete by official" ON public.weekly_records FOR DELETE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);

-- welfare_events: visible to group members + official + main; writable by official
CREATE POLICY "welfare read" ON public.welfare_events FOR SELECT TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.is_group_member(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "welfare write" ON public.welfare_events FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "welfare update" ON public.welfare_events FOR UPDATE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "welfare delete" ON public.welfare_events FOR DELETE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);

-- development_logs: same as welfare
CREATE POLICY "dev read" ON public.development_logs FOR SELECT TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.is_group_member(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "dev write" ON public.development_logs FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "dev update" ON public.development_logs FOR UPDATE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "dev delete" ON public.development_logs FOR DELETE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);

-- Auto-profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, region)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'region'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed a few demo groups so sign-up has options
INSERT INTO public.groups (name, region, stage) VALUES
  ('Tom Mboya Stage Riders', 'Nairobi CBD', 'Tom Mboya St'),
  ('Kondele Boda Sacco', 'Kisumu', 'Kondele Roundabout'),
  ('Likoni Ferry Riders', 'Mombasa', 'Likoni Stage'),
  ('Nakuru CBD Welfare', 'Nakuru', 'Kenyatta Avenue')
ON CONFLICT (name) DO NOTHING;
