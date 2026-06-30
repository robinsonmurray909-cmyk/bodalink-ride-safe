import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Shield, Users, Bike } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.loading && !auth.user) navigate({ to: "/auth" });
  }, [auth.loading, auth.user, navigate]);

  if (auth.loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  const role = primaryRole(auth.roles);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <AppHeader />
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 py-3 flex-wrap">
          <div className="flex items-center gap-2">
            {role === "main" && <Shield className="h-4 w-4 text-brand-green" />}
            {role === "official" && <Users className="h-4 w-4 text-brand-green" />}
            {role === "member" && <Bike className="h-4 w-4 text-brand-green" />}
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{role ? `${role} dashboard` : "Account"}</div>
              <div className="font-display font-semibold">{auth.fullName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!role && <Link to="/auth"><Button variant="outline" size="sm">Finish setup</Button></Link>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-1" /> Sign out</Button>
          </div>
        </div>
      </div>
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
