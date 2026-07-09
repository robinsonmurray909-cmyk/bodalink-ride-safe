
-- 1. Tighten groups UPDATE: add WITH CHECK so official_id cannot be reassigned to another user
DROP POLICY IF EXISTS "groups update by official" ON public.groups;
CREATE POLICY "groups update by official" ON public.groups
FOR UPDATE TO authenticated
USING (
  (official_id IS NOT NULL AND official_id = auth.uid())
  OR public.has_role(auth.uid(), 'main')
)
WITH CHECK (
  (official_id IS NOT NULL AND official_id = auth.uid())
  OR public.has_role(auth.uid(), 'main')
);

-- 2. Explicit INSERT/DELETE policies on user_roles denying client-side writes.
--    Server functions using supabaseAdmin (service_role) bypass RLS and continue to work.
DROP POLICY IF EXISTS "user_roles no client insert" ON public.user_roles;
CREATE POLICY "user_roles no client insert" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "user_roles no client update" ON public.user_roles;
CREATE POLICY "user_roles no client update" ON public.user_roles
FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "user_roles no client delete" ON public.user_roles;
CREATE POLICY "user_roles no client delete" ON public.user_roles
FOR DELETE TO authenticated
USING (false);
