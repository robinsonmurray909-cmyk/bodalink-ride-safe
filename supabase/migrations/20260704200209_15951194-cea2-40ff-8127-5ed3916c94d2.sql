
-- 1. Tighten group_members INSERT: only officials or main admins
DROP POLICY IF EXISTS "members insert by official" ON public.group_members;
CREATE POLICY "members insert by official" ON public.group_members FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
);

-- 2. Tighten group_members UPDATE: remove self-update branch (prevents status/PII self-modification)
DROP POLICY IF EXISTS "members update by official" ON public.group_members;
CREATE POLICY "members update by official" ON public.group_members FOR UPDATE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
) WITH CHECK (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
);

-- 3. Convert SECURITY DEFINER helpers to SECURITY INVOKER (still safe: they read only rows the invoker can already see under RLS — user_roles self-read, groups public-read, group_members self-read).
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_group_official(_user_id uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id AND official_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE user_id = _user_id AND group_id = _group_id)
$$;
