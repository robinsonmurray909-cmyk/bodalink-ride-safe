import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { session } from "@/lib/bodalink-data";

export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      const u = session.get();
      navigate({ to: u?.role === "main" ? "/dashboard/main" : u?.role === "official" ? "/dashboard/official" : u?.role === "member" ? "/dashboard/member" : "/login" });
    }, [navigate]);
    return null;
  },
});
