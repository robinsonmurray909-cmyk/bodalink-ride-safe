import { Link } from "@tanstack/react-router";
import { Bike } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bike className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold">BodaLink</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-secondary-foreground/70">
              Digitising boda boda self-help groups across Kenya. Safer riders, stronger communities, transparent savings.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/60">Platform</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/features" className="hover:text-primary">Features</Link></li>
              <li><Link to="/about" className="hover:text-primary">About</Link></li>
              <li><Link to="/login" className="hover:text-primary">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/60">Contact</div>
            <ul className="mt-3 space-y-2 text-sm text-secondary-foreground/80">
              <li>Nairobi, Kenya</li>
              <li>+254 700 000 000</li>
              <li>hello@bodalink.co.ke</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-secondary-foreground/10 pt-6 text-xs text-secondary-foreground/60">
          © {new Date().getFullYear()} BodaLink. Built for the riders of Kenya.
        </div>
      </div>
    </footer>
  );
}
