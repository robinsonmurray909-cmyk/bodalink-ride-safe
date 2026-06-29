import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { session, type User } from "@/lib/bodalink-data";
import { AppHeader } from "@/components/AppHeader";
import { Bike } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = session.get();
    if (!u) { navigate({ to: "/login" }); return; }
    setUser(u);
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Bike className="h-5 w-5 animate-pulse text-primary" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AppHeader user={user} />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 flex-1">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">
              {user.role === "main" ? "Regional Operations" : user.role === "official" ? "Group Management" : "My account"}
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight">Karibu, {user.name}</h1>
          </div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back to site</Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
