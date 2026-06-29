import { Link, useNavigate } from "@tanstack/react-router";
import { Bike, LogOut } from "lucide-react";
import { session, type User } from "@/lib/bodalink-data";
import { Button } from "@/components/ui/button";

export function AppHeader({ user }: { user?: User | null }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    session.clear();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-transform group-hover:scale-110">
            <Bike className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">BodaLink</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Riders United</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>Home</Link>
          <Link to="/about" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>About</Link>
          <Link to="/features" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>Features</Link>
          <Link to="/contact" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors" activeProps={{ className: "text-primary" }}>Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to={user.role === "main" ? "/dashboard/main" : user.role === "official" ? "/dashboard/official" : "/dashboard/member"}>
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" className="shadow-[var(--shadow-glow)]">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
