import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Pause, Play, Trash2, AlertOctagon, Sparkles, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/scheduler")({
  head: () => ({ meta: [{ title: "Scheduler · Ritual" }] }),
  component: Scheduler,
});

type Schedule = {
  id: string;
  name: string;
  recipients: number;
  amount: string;
  runAt: number; // ms
  recurrence: "once" | "daily" | "weekly" | "monthly";
  status: "queued" | "executing" | "paused" | "success" | "failed";
};

const KEY = "ritual.schedules";
const load = (): Schedule[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
const save = (s: Schedule[]) => localStorage.setItem(KEY, JSON.stringify(s));

function Scheduler() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "Airdrop wave", recipients: 100, amount: "0.05", date: "", time: "", recurrence: "once" as Schedule["recurrence"] });

  useEffect(() => { setItems(load()); }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const create = () => {
    if (!draft.date || !draft.time) { toast.error("Pick date and time"); return; }
    const runAt = new Date(`${draft.date}T${draft.time}`).getTime();
    if (Number.isNaN(runAt) || runAt < Date.now()) { toast.error("Date must be in the future"); return; }
    const s: Schedule = {
      id: `s_${Date.now()}`, name: draft.name, recipients: Number(draft.recipients),
      amount: draft.amount, runAt, recurrence: draft.recurrence, status: "queued",
    };
    const next = [s, ...items]; setItems(next); save(next); setOpen(false);
    toast.success("Scheduled");
  };

  const update = (id: string, patch: Partial<Schedule>) => {
    const next = items.map(s => s.id === id ? { ...s, ...patch } : s);
    setItems(next); save(next);
  };
  const remove = (id: string) => {
    const next = items.filter(s => s.id !== id); setItems(next); save(next);
    toast("Removed");
  };
  const stopAll = () => { const next = items.map(s => ({ ...s, status: "paused" as const })); setItems(next); save(next); toast.warning("All scheduled tasks paused"); };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Scheduler</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold">Auto-pilot your <span className="text-gradient">campaigns</span></h1>
          <p className="text-muted-foreground mt-1 text-sm font-mono">Timezone · {tz}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)} className="holo-btn"><Plus className="size-4 mr-1" /> New schedule</Button>
          {items.length > 0 && <Button variant="outline" onClick={stopAll} className="glass"><AlertOctagon className="size-4 mr-1" /> Stop all</Button>}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">AI recommendation</div>
          <p className="text-muted-foreground mt-1">Network is calmer between <span className="text-gradient font-semibold">02:00 – 04:00 UTC</span>. Schedule large airdrops here for ~17% lower gas.</p>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-strong rounded-2xl p-5 grid md:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Recipients</Label><Input type="number" value={draft.recipients} onChange={(e) => setDraft({ ...draft, recipients: Number(e.target.value) })} className="mt-1 font-mono" /></div>
            <div><Label>Amount per wallet (RITUAL)</Label><Input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} className="mt-1 font-mono" /></div>
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
              <Button onClick={create} className="holo-btn">Schedule</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Calendar className="size-10 mx-auto text-primary opacity-70" />
          <div className="mt-4 font-semibold">No schedules yet</div>
          <p className="text-sm text-muted-foreground mt-1">Create one to auto-execute batches at the perfect moment.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((s) => {
            const ms = s.runAt - now;
            const past = ms <= 0;
            const dd = Math.max(0, Math.floor(ms / 86400000));
            const hh = Math.max(0, Math.floor((ms / 3600000) % 24));
            const mm = Math.max(0, Math.floor((ms / 60000) % 60));
            const ss = Math.max(0, Math.floor((ms / 1000) % 60));
            return (
              <div key={s.id} className="glass rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-primary opacity-15 blur-2xl" />
                <div className="flex items-start justify-between relative">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{s.recurrence}</div>
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded-full ${
                    s.status === "queued" ? "bg-amber-400/20 text-amber-300"
                    : s.status === "paused" ? "bg-muted text-muted-foreground"
                    : s.status === "executing" ? "bg-primary/20 text-primary"
                    : s.status === "success" ? "bg-emerald-400/20 text-emerald-300"
                    : "bg-destructive/20 text-destructive"}`}>{s.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="glass rounded-lg p-2"><div className="text-muted-foreground text-[10px] uppercase">Recipients</div><div className="text-base">{s.recipients}</div></div>
                  <div className="glass rounded-lg p-2"><div className="text-muted-foreground text-[10px] uppercase">Per wallet</div><div className="text-base">{s.amount}</div></div>
                </div>
                <div className="glass rounded-lg p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{past ? "Run window passed" : "Executes in"}</div>
                  <div className="mt-1 text-2xl font-bold font-mono text-gradient">
                    {past ? "—" : `${dd}d ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono">{new Date(s.runAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  {s.status === "paused"
                    ? <Button size="sm" variant="outline" className="glass flex-1" onClick={() => update(s.id, { status: "queued" })}><Play className="size-3.5 mr-1" /> Resume</Button>
                    : <Button size="sm" variant="outline" className="glass flex-1" onClick={() => update(s.id, { status: "paused" })}><Pause className="size-3.5 mr-1" /> Pause</Button>}
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)} className="text-destructive"><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold flex items-center gap-2"><Zap className="size-4 text-primary" /> Live scheduler feed</h2>
        <div className="mt-3 space-y-1.5 text-xs font-mono text-muted-foreground">
          <div>· {new Date().toLocaleTimeString()} — heartbeat ok · queue {items.length}</div>
          <div>· network gas: <span className="text-emerald-400">low</span> · recommended batch size 250</div>
          <div>· next eligible window: 02:00 UTC</div>
        </div>
      </div>
    </div>
  );
}