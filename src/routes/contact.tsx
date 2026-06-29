import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — BodaLink" },
      { name: "description", content: "Get in touch with the BodaLink team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-primary">Talk to us</div>
            <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">We'd love to hear from your group.</h1>
            <p className="mt-4 text-muted-foreground text-lg">Onboarding a boda boda group near you? Reach out — we'll help you migrate from notebooks in a single weekend.</p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /> hello@bodalink.co.ke</div>
              <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> +254 700 000 000</div>
              <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> Westlands, Nairobi</div>
            </div>
          </div>
          <form
            className="rounded-2xl border border-border bg-card p-7 space-y-4"
            onSubmit={(e) => { e.preventDefault(); toast.success("Message sent. Asante!"); (e.target as HTMLFormElement).reset(); }}
          >
            <div>
              <label className="text-sm font-medium">Your name</label>
              <Input required placeholder="Jane Wanjiku" className="mt-1.5" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone or email</label>
              <Input required placeholder="+254 7XX XXX XXX" className="mt-1.5" />
            </div>
            <div>
              <label className="text-sm font-medium">Group name</label>
              <Input placeholder="e.g. Tom Mboya Stage Riders" className="mt-1.5" />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea required rows={4} placeholder="Tell us about your group..." className="mt-1.5" />
            </div>
            <Button type="submit" size="lg" className="w-full shadow-[var(--shadow-glow)]">Send message</Button>
          </form>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
