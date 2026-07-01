import { Link } from "@tanstack/react-router";
import { Bike, Mail, Phone } from "lucide-react";

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
              <li><Link to="/auth" className="hover:text-primary">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-secondary-foreground/60">Developed by</div>
            <ul className="mt-3 space-y-2 text-sm text-secondary-foreground/80">
              <li className="font-semibold text-secondary-foreground">DanjumaKE</li>
              <li className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> <a href="tel:+254115329454" className="hover:text-primary">+254 115 329 454</a></li>
              <li className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> <a href="mailto:jumadaniel627@gmail.com" className="hover:text-primary">jumadaniel627@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-secondary-foreground/10 pt-6 text-xs text-secondary-foreground/60 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} BodaLink. Built for the riders of Kenya.</span>
          <span>Developed by <span className="font-semibold text-secondary-foreground/80">DanjumaKE</span></span>
        </div>
      </div>
    </footer>
  );
}
