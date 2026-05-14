import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Send, Clock, ShieldCheck, Sparkles, Zap, BarChart3, Wallet, Cpu, Layers, KeyRound, Plus, Code2 } from "lucide-react";
import { Logo } from "@/components/ritual/Logo";
import { ConnectButton } from "@/components/ritual/ConnectButton";
import { Button } from "@/components/ui/button";
import { RITUAL_CHAIN } from "@/lib/ritual/chain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ritual Multi Sender — One signature. Unlimited distribution." },
      { name: "description", content: "Send Ritual Testnet tokens to hundreds of wallets in one signature. Schedule once, add wallets anytime, execute everywhere — built for Ritual Testnet automation." },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Zap, title: "One Click Multi Send", desc: "1× sign, 1× tx hash, 1× confirmation. Hundreds of wallets paid atomically through RitualBatchSender." },
  { icon: KeyRound, title: "Single Signature Authorization", desc: "EIP-712 typed-data scoped to chain 1979 — invalid on any other chain. Authorize once, execute forever." },
  { icon: Plus, title: "Add wallets anytime", desc: "Dynamic recipient queue stays open after authorization. Append wallets right up until execution time." },
  { icon: Cpu, title: "AI execution timing", desc: "Congestion analysis, gas prediction, and randomized timing for noise-resistant scheduled drops." },
  { icon: ShieldCheck, title: "Safe by design", desc: "Nonce replay protection, queue checksum, max-recipient limiter, emergency pause, auto-stop on low balance." },
  { icon: Code2, title: "Developer mode", desc: "Raw calldata preview, queue JSON editor, RPC latency, network health monitor, simulation sandbox." },
];

const STEPS = [
  { n: "01", t: "Authorize once", d: "Sign one EIP-712 message bound to chain 1979. Defines recipient cap, total cap, and expiry." },
  { n: "02", t: "Build the queue", d: "Add wallets manually, by CSV, or programmatically. Keep adding even after authorization." },
  { n: "03", t: "Execute everywhere", d: "Single tx · single hash · single confirmation. Distributed instantly to every queued wallet." },
];

function Index() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-primary/30 blur-[140px] pointer-events-none" />
      <div className="absolute top-40 -right-40 size-[500px] rounded-full bg-accent/30 blur-[140px] pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between px-5 lg:px-10 py-5">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#learn" className="hover:text-foreground transition">Learn</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-5 lg:px-10 pt-10 lg:pt-20 pb-20 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-mono"
        >
          <Sparkles className="size-3 text-primary" />
          <span className="text-muted-foreground">Built for</span>
          <span className="text-gradient font-semibold">Ritual Testnet · Chain 1979</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-8 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]"
        >
          One signature.<br />
          <span className="text-gradient">Unlimited distribution.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Built for autonomous onchain campaigns on Ritual Testnet.
          Schedule once, add wallets anytime, execute once — distribute everywhere.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="holo-btn font-semibold">
            <Link to="/app/sender">Launch app <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="glass">
            <a href={RITUAL_CHAIN.faucet} target="_blank">Get testnet tokens</a>
          </Button>
        </motion.div>

        {/* HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-16 glass-strong rounded-3xl p-1 max-w-4xl mx-auto glow"
        >
          <div className="rounded-[22px] bg-background/40 p-6 md:p-8 text-left">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground">batch_send.ritual</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">block #1,289,455</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { l: "Recipients", v: "1,248", s: "queued" },
                { l: "Total amount", v: "62,400", s: "RITUAL" },
                { l: "Est. gas", v: "0.012", s: "RITUAL" },
              ].map((s) => (
                <div key={s.l} className="glass rounded-xl p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                  <div className="mt-1 text-3xl font-bold font-mono text-gradient">{s.v}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{s.s}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1.6, delay: 0.8 }}
                className="h-full bg-gradient-primary glow-sm"
              />
            </div>
            <div className="mt-2 text-[11px] font-mono text-muted-foreground flex justify-between">
              <span>executing batch 7 of 9</span><span>78%</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 px-5 lg:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-primary">Features</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">Everything you need to airdrop.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:glow-sm hover:-translate-y-1 transition-all"
            >
              <div className="size-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-sm">
                <f.icon className="size-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 px-5 lg:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-accent">Workflow</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">Schedule once. Execute once.<br /><span className="text-gradient">Distribute everywhere.</span></h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="text-7xl font-bold text-gradient opacity-30 absolute -top-4 -right-2">{s.n}</div>
              <div className="relative">
                <div className="text-xs font-mono text-muted-foreground">step {s.n}</div>
                <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="relative z-10 px-5 lg:px-10 py-20 max-w-5xl mx-auto">
        <div className="glass-strong rounded-3xl p-10 md:p-14 text-center glow relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
          <div className="relative">
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-primary">Philosophy</div>
            <p className="mt-6 text-2xl md:text-4xl font-bold leading-[1.2] max-w-3xl mx-auto">
              "Tell your agent to read{" "}
              <a href="https://skills.ritualfoundation.org" target="_blank" className="text-gradient hover:underline">skills.ritualfoundation.org</a>
              {" "}and go build something that <span className="text-gradient">outlasts you</span>."
            </p>
            <div className="mt-6 text-sm text-muted-foreground font-mono">— ritual foundation</div>
          </div>
        </div>
      </section>

      {/* LEARN */}
      <section id="learn" className="relative z-10 px-5 lg:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-primary">Education</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">Learn the craft of batch onchain.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { i: Zap, t: "What is a batch transaction?", d: "Bundle many transfers into one tx — pay one base fee, ship to thousands at once." },
            { i: Clock, t: "Why schedule transactions?", d: "Time campaigns to optimal network windows, automate recurring rewards, and avoid manual mistakes." },
            { i: Wallet, t: "Tips to reduce gas fees", d: "Right-size batches, send during off-peak windows, and let the AI gas advisor pick a window for you." },
            { i: ShieldCheck, t: "Stay safe & avoid scams", d: "Always verify addresses, never share keys, and double-check totals on the preview screen." },
          ].map((c) => (
            <div key={c.t} className="glass rounded-2xl p-6 flex gap-4">
              <div className="size-10 shrink-0 rounded-xl bg-gradient-primary flex items-center justify-center">
                <c.i className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 px-5 lg:px-10 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-accent">Plans</div>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">Start free. Scale unlimited.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "Free", p: "0", b: ["50 wallets / batch", "Up to 5 schedules", "Address book", "Community support"], cta: "Start free" },
            { n: "Premium", p: "9", featured: true, b: ["Unlimited batch size", "Recurring schedules", "AI gas advisor", "Priority retries", "Templates & campaigns"], cta: "Go premium" },
            { n: "API / White-label", p: "Custom", b: ["REST + webhook API", "White-label UI", "SLA & dedicated relay", "Bot automation"], cta: "Contact us" },
          ].map((p) => (
            <div key={p.n} className={`glass rounded-2xl p-6 ${p.featured ? "glow border-primary/40" : ""}`}>
              {p.featured && <div className="text-[10px] uppercase tracking-widest text-gradient font-bold mb-2">Most popular</div>}
              <div className="text-lg font-semibold">{p.n}</div>
              <div className="mt-3 text-4xl font-bold font-mono">
                {p.p === "Custom" ? p.p : <>${p.p}<span className="text-sm text-muted-foreground font-normal">/mo</span></>}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {p.b.map((x) => <li key={x} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />{x}</li>)}
              </ul>
              <Button asChild className={`mt-6 w-full ${p.featured ? "holo-btn" : ""}`} variant={p.featured ? "default" : "outline"}>
                <Link to="/app/sender">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-5 lg:px-10 py-20 max-w-4xl mx-auto text-center">
        <div className="glass-strong rounded-3xl p-10 glow">
          <h2 className="text-3xl md:text-5xl font-bold">Build something that outlasts you.</h2>
          <p className="mt-4 text-muted-foreground">Connect your wallet and ship your first batch in under 60 seconds.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="holo-btn"><Link to="/app/sender">Open dashboard</Link></Button>
            <Button asChild size="lg" variant="outline" className="glass"><a href={RITUAL_CHAIN.explorer} target="_blank">Explorer</a></Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/40 mt-10">
        <div className="px-5 lg:px-10 py-8 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Logo />
          <div className="font-mono">RPC {RITUAL_CHAIN.rpcUrl} · Chain 1979</div>
          <div className="flex gap-5">
            <a href="https://docs.ritualfoundation.org" target="_blank" className="hover:text-foreground">Docs</a>
            <a href={RITUAL_CHAIN.faucet} target="_blank" className="hover:text-foreground">Faucet</a>
            <a href={RITUAL_CHAIN.explorer} target="_blank" className="hover:text-foreground">Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
