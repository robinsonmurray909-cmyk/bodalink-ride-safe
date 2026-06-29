import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bike, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { session, type User } from "@/lib/bodalink-data";
import { Button } from "@/components/ui/button";

export function AppHeader({ user }: { user?: User | null }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const transparentRoute = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    session.clear();
    navigate({ to: "/" });
  };

  const transparent = transparentRoute && !scrolled;
  const shellClass = transparent
    ? "border-transparent bg-transparent"
    : "border-border bg-background/85 backdrop-blur-md shadow-sm";
  const linkColor = transparent ? "text-white/90" : "text-foreground/80";
  const brandColor = transparent ? "text-white" : "text-foreground";
  const subColor = transparent ? "text-white/70" : "text-muted-foreground";

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${shellClass}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-transform group-hover:scale-110">
            <Bike className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className={`font-display text-lg font-bold tracking-tight ${brandColor}`}>BodaLink</div>
            <div className={`text-[10px] uppercase tracking-widest ${subColor}`}>Riders United</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={`text-sm font-medium ${linkColor} hover:text-primary transition-colors`} activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>Home</Link>
          <Link to="/about" className={`text-sm font-medium ${linkColor} hover:text-primary transition-colors`} activeProps={{ className: "text-primary" }}>About</Link>
          <Link to="/features" className={`text-sm font-medium ${linkColor} hover:text-primary transition-colors`} activeProps={{ className: "text-primary" }}>Features</Link>
          <Link to="/contact" className={`text-sm font-medium ${linkColor} hover:text-primary transition-colors`} activeProps={{ className: "text-primary" }}>Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to={user.role === "main" ? "/dashboard/main" : user.role === "official" ? "/dashboard/official" : "/dashboard/member"}>
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className={scrolled ? "" : "text-white hover:text-white hover:bg-white/10"}>
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
