import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bike, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, primaryRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/" as const, label: "Home", exact: true },
  { to: "/features" as const, label: "Features" },
  { to: "/about" as const, label: "About" },
  { to: "/contact" as const, label: "Contact" },
];

export function AppHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const transparentRoute = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const auth = useAuth();
  const role = primaryRole(auth.roles);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = transparentRoute && !scrolled;
  const shellClass = transparent
    ? "border-transparent bg-transparent"
    : "border-brand-green/20 bg-[color:var(--brand-green)] text-brand-green-foreground shadow-md";
  const brandSub = transparent ? "text-white/70" : "text-brand-green-foreground/75";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const navBtn = (active: boolean) =>
    transparent
      ? `text-white hover:bg-white/10 ${active ? "bg-white/15" : ""}`
      : `text-brand-green-foreground hover:bg-white/15 ${active ? "bg-white/20" : ""}`;

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${shellClass}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-[var(--shadow-glow)] transition-transform group-hover:scale-110 ${transparent ? "bg-primary text-primary-foreground" : "bg-white text-brand-green"}`}>
            <Bike className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight text-white">BodaLink</div>
            <div className={`text-[10px] uppercase tracking-widest ${brandSub}`}>Riders United</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} activeOptions={n.exact ? { exact: true } : undefined}>
              {({ isActive }) => (
                <Button variant="ghost" size="sm" className={`rounded-full px-4 ${navBtn(isActive)}`}>{n.label}</Button>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {auth.user ? (
            <>
              <Link to="/dashboard">
                <Button size="sm" variant={transparent ? "secondary" : "default"} className={transparent ? "" : "bg-white text-brand-green hover:bg-white/90"}>{role ? `${role[0].toUpperCase()}${role.slice(1)} dashboard` : "Dashboard"}</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className={transparent ? "text-white hover:bg-white/10" : "text-white hover:bg-white/15"}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className={transparent ? "shadow-[var(--shadow-glow)]" : "bg-white text-brand-green hover:bg-white/90"}>Sign in</Button>
            </Link>
          )}
        </div>

        <button className={`md:hidden p-2 rounded-md ${transparent ? "text-white" : "text-brand-green-foreground"}`} onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/20 bg-[color:var(--brand-green)] text-brand-green-foreground">
          <div className="mx-auto max-w-7xl px-4 py-3 space-y-1.5">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} activeOptions={n.exact ? { exact: true } : undefined}>
                {({ isActive }) => (
                  <Button variant="ghost" className={`w-full justify-start rounded-md text-brand-green-foreground hover:bg-white/15 ${isActive ? "bg-white/20" : ""}`}>{n.label}</Button>
                )}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/20">
              {auth.user ? (
                <div className="flex flex-col gap-2">
                  <Link to="/dashboard" onClick={() => setOpen(false)}><Button className="w-full bg-white text-brand-green hover:bg-white/90">Open dashboard</Button></Link>
                  <Button variant="ghost" className="w-full justify-start text-brand-green-foreground hover:bg-white/15" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" /> Sign out</Button>
                </div>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)}><Button className="w-full bg-white text-brand-green hover:bg-white/90">Sign in</Button></Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
