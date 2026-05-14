import logoMark from "@/assets/logo-mark.jpeg";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-9 w-9 rounded-lg overflow-hidden glow-sm animate-pulse-glow ring-1 ring-border">
        <img src={logoMark} alt="Ritual" className="h-full w-full object-cover" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight">Ritual</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Multi Sender</div>
      </div>
    </div>
  );
}