import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/ritual/AppShell";

export const Route = createFileRoute("/app")({
  component: AppShell,
});