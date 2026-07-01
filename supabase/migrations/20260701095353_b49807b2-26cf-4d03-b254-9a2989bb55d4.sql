
-- welfare_contributions
CREATE TABLE public.welfare_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welfare_event_id UUID NOT NULL REFERENCES public.welfare_events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  amount_kes INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'savings' CHECK (source IN ('savings','mpesa','card','bank','paypal','cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  notes TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.welfare_contributions (welfare_event_id);
CREATE INDEX ON public.welfare_contributions (group_id, status);
CREATE INDEX ON public.welfare_contributions (member_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.welfare_contributions TO authenticated;
GRANT ALL ON public.welfare_contributions TO service_role;
ALTER TABLE public.welfare_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wc read" ON public.welfare_contributions FOR SELECT TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.id = member_id AND gm.user_id = auth.uid())
);
CREATE POLICY "wc insert" ON public.welfare_contributions FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id)
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.id = member_id AND gm.user_id = auth.uid())
);
CREATE POLICY "wc update by official" ON public.welfare_contributions FOR UPDATE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);
CREATE POLICY "wc delete by official" ON public.welfare_contributions FOR DELETE TO authenticated USING (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);

-- savings_adjustments
CREATE TABLE public.savings_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  amount_kes INT NOT NULL,
  reason TEXT NOT NULL,
  welfare_contribution_id UUID REFERENCES public.welfare_contributions(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.savings_adjustments (member_id);
CREATE INDEX ON public.savings_adjustments (group_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_adjustments TO authenticated;
GRANT ALL ON public.savings_adjustments TO service_role;
ALTER TABLE public.savings_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa read" ON public.savings_adjustments FOR SELECT TO authenticated USING (
  public.is_group_official(auth.uid(), group_id)
  OR public.has_role(auth.uid(),'main')
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.id = member_id AND gm.user_id = auth.uid())
);
CREATE POLICY "sa write by official" ON public.savings_adjustments FOR INSERT TO authenticated WITH CHECK (
  public.is_group_official(auth.uid(), group_id) OR public.has_role(auth.uid(),'main')
);

-- welfare_events extension
ALTER TABLE public.welfare_events ADD COLUMN IF NOT EXISTS collected_kes INT NOT NULL DEFAULT 0;
