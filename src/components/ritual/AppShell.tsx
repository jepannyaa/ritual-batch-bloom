import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { Send, Clock, Code2 } from "lucide-react";

const NAV = [
  { to: "/app/sender", label: "One Click Send", icon: Send },
  { to: "/app/scheduler", label: "Scheduler", icon: Clock },
  { to: "/app/developer", label: "Developer", icon: Code2 },
] as const;

export function AppShell() {
  const loc = useLocation();
  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/40 glass-strong px-4 py-5 gap-1">
        <Link to="/" className="px-2 mb-6"><Logo /></Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${active ? "bg-gradient-primary text-primary-foreground glow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 rounded-lg glass text-xs text-muted-foreground">
          <div className="text-foreground font-semibold mb-1">Need testnet RITUAL?</div>
          Grab tokens from the{" "}
          <a href="https://faucet.ritualfoundation.org" target="_blank" className="text-gradient font-semibold">faucet ↗</a>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 lg:px-8 py-4 glass-strong border-b border-border/40">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Ritual Testnet · Chain 1979 · RPC online
          </div>
          <ConnectButton />
        </header>
        <div className="px-5 lg:px-8 py-6">
          <Outlet />
        </div>
        <nav className="lg:hidden fixed bottom-3 left-3 right-3 glass-strong rounded-2xl flex justify-around p-2 z-30">
          {NAV.map((n) => {
            const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}