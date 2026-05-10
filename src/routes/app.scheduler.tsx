import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatEther, isAddress, parseEther } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pause, Play, Trash2, AlertOctagon, Sparkles, Calendar, Zap, Lock, ShieldCheck, Activity, Loader2, KeyRound, Hash, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/lib/ritual/wallet";
import { type Campaign, type CampaignRecipient, loadCampaigns, saveCampaigns, totalWei, queueChecksum, newId } from "@/lib/ritual/scheduler";
import { signAuthorization, AUTH_MANAGER_ADDRESS } from "@/lib/ritual/batch";
import { explorerTx, shortAddr } from "@/lib/ritual/chain";

export const Route = createFileRoute("/app/scheduler")({
  head: () => ({ meta: [{ title: "Scheduler · Ritual" }] }),
  component: Scheduler,
});

function Scheduler() {
  const { address, isCorrectNetwork, provider } = useWallet();
  const [items, setItems] = useState<Campaign[]>([]);
  const [now, setNow] = useState(Date.now());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "Airdrop wave 01",
    perWalletDefault: "0.05",
    maxRecipients: 1000,
    date: "", time: "",
    recurrence: "once" as Campaign["recurrence"],
  });

  useEffect(() => { setItems(loadCampaigns()); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const active = items.find((i) => i.id === activeId) ?? null;

  const persist = (next: Campaign[]) => { setItems(next); saveCampaigns(next); };
  const update = (id: string, patch: Partial<Campaign>) => persist(items.map((c) => c.id === id ? { ...c, ...patch } : c));

  const create = () => {
    if (!draft.date || !draft.time) { toast.error("Pick date and time"); return; }
    const runAt = new Date(`${draft.date}T${draft.time}`).getTime();
    if (Number.isNaN(runAt) || runAt < Date.now()) { toast.error("Date must be in the future"); return; }
    const c: Campaign = {
      id: newId(), name: draft.name, recurrence: draft.recurrence, runAt,
      perWalletDefault: draft.perWalletDefault, recipients: [],
      maxRecipients: Number(draft.maxRecipients), status: "draft", createdAt: Date.now(),
    };
    persist([c, ...items]); setOpen(false); setActiveId(c.id);
    toast.success("Campaign created · queue is now open");
  };

  const stopAll = () => persist(items.map((c) => c.status === "executing" || c.status === "authorized" || c.status === "locked" ? { ...c, status: "paused" } : c));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Dynamic Scheduled Campaign System</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold">Schedule once. <span className="text-gradient">Distribute everywhere.</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">Timezone · {tz} · One signature authorizes the whole campaign.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)} className="holo-btn"><Plus className="size-4 mr-1" /> New campaign</Button>
          {items.length > 0 && <Button variant="outline" onClick={stopAll} className="glass"><AlertOctagon className="size-4 mr-1" /> Stop all</Button>}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Pill icon={KeyRound} label="Authorize once" desc="EIP-712 signature on chain 1979" />
        <Pill icon={Plus} label="Add wallets anytime" desc="Until queue is locked at runAt" />
        <Pill icon={Zap} label="One tx execution" desc="Single hash, single confirmation" />
      </div>

      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">AI scheduler timing</div>
          <p className="text-muted-foreground mt-1">Network is calmer between <span className="text-gradient font-semibold">02:00 – 04:00 UTC</span>. AI gas predictor recommends batch size <span className="text-gradient font-semibold">250</span> with randomized execution within ±90s for congestion avoidance.</p>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-strong rounded-2xl p-5 grid md:grid-cols-2 gap-4">
            <div><Label>Campaign name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Default amount per wallet</Label><Input value={draft.perWalletDefault} onChange={(e) => setDraft({ ...draft, perWalletDefault: e.target.value })} className="mt-1 font-mono" /></div>
            <div><Label>Max recipients (cap)</Label><Input type="number" value={draft.maxRecipients} onChange={(e) => setDraft({ ...draft, maxRecipients: Number(e.target.value) })} className="mt-1 font-mono" /></div>
            <div><Label>Recurrence</Label>
              <Select value={draft.recurrence} onValueChange={(v) => setDraft({ ...draft, recurrence: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="once">One-time</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="mt-1 font-mono" /></div>
            <div><Label>Time</Label><Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} className="mt-1 font-mono" /></div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} className="holo-btn">Create campaign</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Calendar className="size-10 mx-auto text-primary opacity-70" />
          <div className="mt-4 font-semibold">No campaigns yet</div>
          <p className="text-sm text-muted-foreground mt-1">Create one — you can keep adding wallets to its queue right up until execution.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((c) => (
            <CampaignCard
              key={c.id} c={c} now={now}
              onOpen={() => setActiveId(c.id)}
              onUpdate={(p) => update(c.id, p)}
              onDelete={() => persist(items.filter((x) => x.id !== c.id))}
            />
          ))}
        </div>
      )}

      {active && (
        <CampaignDetail
          c={active} now={now}
          onClose={() => setActiveId(null)}
          onUpdate={(p) => update(active.id, p)}
          onAuthorize={async () => {
            if (!provider || !address) { toast.error("Connect wallet"); return; }
            if (!isCorrectNetwork) { toast.error("Switch to Ritual Testnet (1979)"); return; }
            if (AUTH_MANAGER_ADDRESS === "0x0000000000000000000000000000000000000000") {
              toast.warning("Auth manager not configured · simulating signature for demo");
            }
            try {
              const wei = totalWei(active);
              const payload = {
                owner: address,
                executor: AUTH_MANAGER_ADDRESS,
                maxRecipients: active.maxRecipients,
                maxTotal: wei.toString(),
                expiresAt: Math.floor((active.runAt + 24 * 3600 * 1000) / 1000),
                nonce: 0,
              };
              const sig = await signAuthorization(provider, payload);
              update(active.id, {
                status: "authorized",
                authorizedAt: Date.now(),
                authorization: { signature: sig, expiresAt: payload.expiresAt, nonce: 0, maxTotal: payload.maxTotal },
              });
              toast.success("Campaign authorized · queue stays mutable until runAt");
            } catch (e: any) {
              toast.error(e?.shortMessage ?? e?.message ?? "Signature rejected");
            }
          }}
          onLock={async () => {
            const cs = await queueChecksum(active);
            update(active.id, { status: "locked", snapshotChecksum: cs });
            toast.success("Queue snapshot locked · " + shortAddr(cs, 6));
          }}
        />
      )}

      <LiveFeed items={items} />
    </div>
  );
}

function Pill({ icon: Icon, label, desc }: { icon: React.ComponentType<{ className?: string }>; label: string; desc: string }) {
  return (
    <div className="glass rounded-xl p-4 flex items-start gap-3">
      <div className="size-9 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0"><Icon className="size-4 text-primary-foreground" /></div>
      <div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: Campaign["status"] }) {
  const map: Record<Campaign["status"], string> = {
    draft: "bg-muted text-muted-foreground",
    authorized: "bg-primary/20 text-primary",
    locked: "bg-amber-400/20 text-amber-300",
    executing: "bg-accent/30 text-accent-foreground animate-pulse",
    success: "bg-emerald-400/20 text-emerald-300",
    failed: "bg-destructive/20 text-destructive",
    paused: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
    stopped: "bg-destructive/20 text-destructive",
  };
  return <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full ${map[s]}`}>{s}</span>;
}

function CampaignCard({ c, now, onOpen, onUpdate, onDelete }: {
  c: Campaign; now: number;
  onOpen: () => void;
  onUpdate: (p: Partial<Campaign>) => void;
  onDelete: () => void;
}) {
  const ms = c.runAt - now;
  const past = ms <= 0;
  const dd = Math.max(0, Math.floor(ms / 86400000));
  const hh = Math.max(0, Math.floor((ms / 3600000) % 24));
  const mm = Math.max(0, Math.floor((ms / 60000) % 60));
  const ss = Math.max(0, Math.floor((ms / 1000) % 60));
  const total = formatEther(totalWei(c));
  const isAuthorized = c.status === "authorized" || c.status === "locked";

  return (
    <div className="glass rounded-2xl p-5 space-y-3 relative overflow-hidden cursor-pointer hover:glow-sm transition-all" onClick={onOpen}>
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-primary opacity-15 blur-2xl" />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{c.recurrence}</div>
          <h3 className="font-semibold text-lg">{c.name}</h3>
        </div>
        <StatusBadge s={c.status} />
      </div>
      {isAuthorized && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary">
          <ShieldCheck className="size-3" /> Authorized For Auto Execution
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="glass rounded-lg p-2"><div className="text-muted-foreground text-[10px] uppercase">Recipients</div><div className="text-base">{c.recipients.length}/{c.maxRecipients}</div></div>
        <div className="glass rounded-lg p-2"><div className="text-muted-foreground text-[10px] uppercase">Total</div><div className="text-base">{Number(total).toFixed(3)}</div></div>
        <div className="glass rounded-lg p-2"><div className="text-muted-foreground text-[10px] uppercase">Per wallet</div><div className="text-base">{c.perWalletDefault}</div></div>
      </div>
      <div className="glass rounded-lg p-3 text-center">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{past ? "Run window passed" : "Executes in"}</div>
        <div className="mt-1 text-2xl font-bold font-mono text-gradient">
          {past ? "—" : `${dd}d ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1 font-mono">{new Date(c.runAt).toLocaleString()}</div>
      </div>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {c.status === "paused"
          ? <Button size="sm" variant="outline" className="glass flex-1" onClick={() => onUpdate({ status: "authorized" })}><Play className="size-3.5 mr-1" /> Resume</Button>
          : c.status !== "success" && c.status !== "cancelled" && c.status !== "stopped"
            ? <Button size="sm" variant="outline" className="glass flex-1" onClick={() => onUpdate({ status: "paused" })}><Pause className="size-3.5 mr-1" /> Pause</Button>
            : null}
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive"><Trash2 className="size-3.5" /></Button>
      </div>
    </div>
  );
}

function CampaignDetail({ c, now, onClose, onUpdate, onAuthorize, onLock }: {
  c: Campaign; now: number;
  onClose: () => void;
  onUpdate: (p: Partial<Campaign>) => void;
  onAuthorize: () => void;
  onLock: () => void;
}) {
  const [bulk, setBulk] = useState("");
  const queueLocked = c.status === "locked" || c.status === "executing" || c.status === "success";
  const total = formatEther(totalWei(c));

  const addBulk = () => {
    if (queueLocked) { toast.error("Queue is locked"); return; }
    const lines = bulk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const seen = new Set(c.recipients.map((r) => r.address.toLowerCase()));
    const next: CampaignRecipient[] = [...c.recipients];
    let added = 0, dup = 0, bad = 0;
    for (const line of lines) {
      const [addr, amt] = line.split(/[,\s;]+/);
      if (!isAddress(addr)) { bad++; continue; }
      if (seen.has(addr.toLowerCase())) { dup++; continue; }
      const amount = amt ?? c.perWalletDefault;
      try { parseEther(amount); } catch { bad++; continue; }
      if (next.length >= c.maxRecipients) break;
      next.push({ address: addr, amount });
      seen.add(addr.toLowerCase());
      added++;
    }
    onUpdate({ recipients: next });
    setBulk("");
    toast.success(`+${added} added · ${dup} duplicates · ${bad} invalid`);
  };

  const removeOne = (addr: string) => {
    if (queueLocked) return;
    onUpdate({ recipients: c.recipients.filter((r) => r.address !== addr) });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold">{c.name}</h2>
            <StatusBadge s={c.status} />
          </div>
          <div className="text-xs font-mono text-muted-foreground">id {c.id} · runs {new Date(c.runAt).toLocaleString()}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Stat l="Queued wallets" v={`${c.recipients.length}`} sub={`max ${c.maxRecipients}`} />
        <Stat l="Token requirement" v={Number(total).toFixed(4)} sub="RITUAL" />
        <Stat l="Authorization" v={c.authorization ? "active" : "none"} sub={c.authorization ? `nonce ${c.authorization.nonce}` : "EIP-712"} />
        <Stat l="Snapshot" v={c.snapshotChecksum ? shortAddr(c.snapshotChecksum, 6) : "—"} sub="sha-256" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold flex items-center gap-2"><Plus className="size-4 text-primary" /> Add to queue</div>
            {queueLocked && <span className="text-[10px] font-mono uppercase text-amber-300 flex items-center gap-1"><Lock className="size-3" /> locked</span>}
          </div>
          <Textarea
            value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} disabled={queueLocked}
            placeholder={"0xabc…,0.05\n0xdef…\n0x789…,0.1"} className="font-mono text-xs glass"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="font-mono">amount optional · default {c.perWalletDefault}</span>
            <Button size="sm" disabled={queueLocked} onClick={addBulk} className="holo-btn">Append to queue</Button>
          </div>
        </div>

        <div className="glass rounded-xl p-4 space-y-3">
          <div className="font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Authorization</div>
          {c.authorization ? (
            <div className="text-xs space-y-1.5 font-mono">
              <div>signature · <span className="text-gradient">{shortAddr(c.authorization.signature, 8)}</span></div>
              <div>expires · {new Date(c.authorization.expiresAt * 1000).toLocaleString()}</div>
              <div>cap · {formatEther(BigInt(c.authorization.maxTotal))} RITUAL</div>
              <div>chainId · 1979 (replay-safe)</div>
              <Button size="sm" variant="outline" className="glass mt-2" onClick={() => onUpdate({ authorization: undefined, status: "draft" })}>
                Revoke authorization
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Sign once with EIP-712 typed-data bound to chain 1979. The scheduler will execute the queue at <span className="font-mono">{new Date(c.runAt).toLocaleTimeString()}</span> without asking again.</p>
              <Button size="sm" onClick={onAuthorize} className="holo-btn">Authorize once</Button>
            </>
          )}

          <div className="border-t border-border/40 pt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="glass" disabled={!c.authorization || queueLocked} onClick={onLock}>
              <Lock className="size-3.5 mr-1" /> Lock queue snapshot
            </Button>
            <Button size="sm" variant="outline" className="glass" onClick={() => onUpdate({ status: c.status === "paused" ? "authorized" : "paused" })}>
              {c.status === "paused" ? <><Play className="size-3.5 mr-1" />Resume</> : <><Pause className="size-3.5 mr-1" />Pause</>}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onUpdate({ status: "stopped" })}>
              <AlertOctagon className="size-3.5 mr-1" /> Emergency stop
            </Button>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold flex items-center gap-2"><Hash className="size-4 text-primary" /> Recipient queue</div>
          <div className="text-xs font-mono text-muted-foreground">{c.recipients.length} wallets</div>
        </div>
        {c.recipients.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">Queue is empty — add wallets above. You can keep adding until lock.</div>
        ) : (
          <div className="overflow-auto max-h-72 rounded-lg border border-border/40">
            <table className="w-full text-xs font-mono">
              <thead className="bg-white/5 sticky top-0"><tr className="text-left text-muted-foreground">
                <th className="px-3 py-2">#</th><th className="px-3 py-2">Address</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 w-8"></th>
              </tr></thead>
              <tbody>
                {c.recipients.map((r, i) => (
                  <motion.tr layout key={r.address}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="border-t border-border/30 hover:bg-white/5">
                    <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5">{shortAddr(r.address, 6)}</td>
                    <td className="px-3 py-1.5 text-right">{r.amount}</td>
                    <td className="px-3 py-1.5">
                      <button disabled={queueLocked} onClick={() => removeOne(r.address)} className="text-muted-foreground hover:text-destructive disabled:opacity-30">
                        <Trash2 className="size-3" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {c.executedTx && (
        <a href={explorerTx(c.executedTx)} target="_blank" className="glass rounded-xl p-3 flex items-center justify-between text-sm hover:glow-sm transition">
          <span className="font-mono">Execution tx · {shortAddr(c.executedTx, 8)}</span>
          <span className="text-primary">view ↗</span>
        </a>
      )}
    </motion.div>
  );
}

function LiveFeed({ items }: { items: Campaign[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="font-semibold flex items-center gap-2"><Activity className="size-4 text-primary" /> Live scheduler activity</h2>
      <div className="mt-3 space-y-1.5 text-xs font-mono text-muted-foreground">
        <div>· {new Date().toLocaleTimeString()} — heartbeat ok · queue {items.length}</div>
        <div>· chain 1979 · gas <span className="text-emerald-400">low</span> · suggested batch 250</div>
        <div>· authorized campaigns: {items.filter((c) => c.authorization).length}</div>
        <div>· locked snapshots: {items.filter((c) => c.snapshotChecksum).length}</div>
        <div>· next eligible window: 02:00 UTC</div>
      </div>
    </div>
  );
}

function Stat({ l, v, sub }: { l: string; v: string; sub?: string }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
      <div className="mt-1 text-lg font-bold font-mono text-gradient">{v}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}