import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/ritual/AppShell";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/app") throw redirect({ to: "/app/sender" });
  },
  component: AppShell,
});