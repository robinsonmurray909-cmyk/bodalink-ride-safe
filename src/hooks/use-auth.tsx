import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/bodalink-types";

export interface AuthState {
  loading: boolean;
  user: User | null;
  session: Session | null;
  roles: Role[];
  fullName: string | null;
  groupId: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    session: null,
    roles: [],
    fullName: null,
    groupId: null,
  });

  useEffect(() => {
    let mounted = true;

    const hydrate = async (session: Session | null) => {
      if (!mounted) return;
      if (!session?.user) {
        setState({ loading: false, user: null, session: null, roles: [], fullName: null, groupId: null });
        return;
      }
      const [{ data: rolesData }, { data: profile }, { data: memberLink }, { data: officialGroup }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
        supabase.from("group_members").select("group_id").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("groups").select("id").eq("official_id", session.user.id).maybeSingle(),
      ]);
      if (!mounted) return;
      setState({
        loading: false,
        user: session.user,
        session,
        roles: ((rolesData ?? []) as { role: Role }[]).map(r => r.role),
        fullName: profile?.full_name ?? session.user.email ?? null,
        groupId: officialGroup?.id ?? memberLink?.group_id ?? null,
      });
    };

    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        hydrate(session);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}

export function primaryRole(roles: Role[]): Role | null {
  if (roles.includes("main")) return "main";
  if (roles.includes("official")) return "official";
  if (roles.includes("member")) return "member";
  return null;
}
