export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-lg bg-gradient-primary glow-sm animate-pulse-glow" />
        <div className="absolute inset-[3px] rounded-md bg-background flex items-center justify-center">
          <span className="text-gradient text-sm font-bold">R</span>
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-tight">Ritual</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Multi Sender</div>
      </div>
    </div>
  );
}