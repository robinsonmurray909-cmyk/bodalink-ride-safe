import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, primaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const auth = useAuth();
  const navigate = useNavigate();
  const role = primaryRole(auth.roles);

  useEffect(() => {
    if (auth.loading || !role) return;
    navigate({
      to: role === "main" ? "/dashboard/main" : role === "official" ? "/dashboard/official" : "/dashboard/member",
      replace: true,
    });
  }, [auth.loading, role, navigate]);

  if (auth.loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!role) {
    return (
      <Card className="p-8 text-center max-w-xl mx-auto">
        <h2 className="font-display text-xl font-bold">Finish setting up your account</h2>
        <p className="mt-2 text-muted-foreground">Your account has no role assigned yet. Pick your role to activate your dashboard.</p>
        <Link to="/auth" className="inline-block mt-4"><Button>Complete setup</Button></Link>
      </Card>
    );
  }
  return null;
}

