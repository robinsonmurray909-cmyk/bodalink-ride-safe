import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (auth.loading) return;
    const r = primaryRole(auth.roles);
    navigate({
      to: r === "main" ? "/dashboard/main"
        : r === "official" ? "/dashboard/official"
        : r === "member" ? "/dashboard/member"
        : "/auth",
      replace: true,
    });
  }, [auth, navigate]);
  return null;
}
