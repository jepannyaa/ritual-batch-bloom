import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatEther, parseEther } from "ethers";
import { Upload, FileText, Trash2, Wand2, Send, AlertTriangle, Eye, ExternalLink, CheckCircle2, XCircle, Loader2, Copy, Shuffle, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { useWallet } from "@/lib/ritual/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { parseRecipients, totalAmount, type Recipient } from "@/lib/ritual/parse";
import { explorerTx, RITUAL_CHAIN, shortAddr } from "@/lib/ritual/chain";
import { executeOneSignatureBatch, BATCH_SENDER_ADDRESS, buildBatchPayload, makeBatchId } from "@/lib/ritual/batch";
import { toast } from "sonner";

export const Route = createFileRoute("/app/sender")({
  head: () => ({ meta: [{ title: "Multi Sender · Ritual" }] }),
  component: Sender,
});

type ExecRow = { address: string; amount: string; status: "pending" | "sending" | "success" | "failed"; hash?: string; error?: string };

function Sender() {
  const { address, isCorrectNetwork, balance, provider, connect, switchNetwork, refreshBalance } = useWallet();
  const [raw, setRaw] = useState("");
  const [equal, setEqual] = useState(false);
  const [equalAmount, setEqualAmount] = useState("0.01");
  const [delayMs, setDelayMs] = useState(800);
  const [randomize, setRandomize] = useState(true);
  const [batchSize, setBatchSize] = useState(50);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exec, setExec] = useState<ExecRow[] | null>(null);
  const [running, setRunning] = useState(false);
  const [oneSig, setOneSig] = useState(true);
  const [oneSigTx, setOneSigTx] = useState<{ hash: string; count: number; total: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const recipients = useMemo<Recipient[]>(() => parseRecipients(raw, equal ? equalAmount : undefined), [raw, equal, equalAmount]);
  const valid = recipients.filter((r) => r.valid);
  const invalid = recipients.filter((r) => !r.valid);
  const total = useMemo(() => totalAmount(recipients), [recipients]);
  const totalStr = formatEther(total);
  const balanceN = Number(balance);
  const totalN = Number(totalStr);
  const insufficient = totalN > balanceN;
  const estGas = (valid.length * 0.000021).toFixed(6);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRaw((prev) => (prev ? prev + "\n" : "") + text.trim());
    toast.success(`Imported ${file.name}`);
  };

  const removeInvalid = () => {
    const cleaned = recipients.filter((r) => r.valid).map((r) => `${r.address},${r.amount}`).join("\n");
    setRaw(cleaned);
    toast.success(`Removed ${invalid.length} invalid rows`);
  };

  const removeRow = (id: string) => {
    const kept = recipients.filter((r) => r.id !== id).map((r) => `${r.address},${r.amount}`).join("\n");
    setRaw(kept);
  };

  const sample = () => {
    const lines: string[] = [];
    for (let i = 0; i < 5; i++) {
      const hex = Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      lines.push(`0x${hex},${(0.01 + Math.random() * 0.05).toFixed(4)}`);
    }
    setRaw((prev) => (prev ? prev + "\n" : "") + lines.join("\n"));
  };

  const startExecution = async () => {
    if (!provider || !address) { toast.error("Connect your wallet first"); return; }
    if (!isCorrectNetwork) { toast.error("Switch to Ritual Testnet"); return; }
    if (valid.length === 0) { toast.error("No valid recipients"); return; }
    setPreviewOpen(false);
    setOneSigTx(null);

    if (oneSig) {
      // ----- One Signature mode: single tx via batch contract -----
      if (BATCH_SENDER_ADDRESS === "0x0000000000000000000000000000000000000000") {
        toast.error("Batch contract belum terkonfigurasi. Set VITE_RITUAL_BATCH_SENDER, atau matikan One Signature mode.");
        return;
      }
      setRunning(true);
      try {
        const rows = valid.map((r) => ({ address: r.address, amount: r.amount }));
        const { tx, batchId, total } = await executeOneSignatureBatch(provider, rows);
        setOneSigTx({ hash: tx.hash, count: rows.length, total: formatEther(total) });
        toast.success("Single signature submitted · awaiting confirmation");
        const receipt = await tx.wait();
        if (receipt?.status === 1) {
          toast.success(`Distributed to ${rows.length} wallets in 1 tx`);
          // persist as one-shot history entry
          try {
            const log = JSON.parse(localStorage.getItem("ritual.history") ?? "[]");
            log.unshift({ ts: Date.now(), total: rows.length, ok: rows.length, fail: 0, mode: "one-signature", hash: tx.hash, batchId });
            localStorage.setItem("ritual.history", JSON.stringify(log.slice(0, 50)));
          } catch {}
        } else {
          toast.error("Batch tx reverted");
        }
      } catch (e: any) {
        toast.error(e?.shortMessage ?? e?.message ?? "Failed to submit batch");
      } finally {
        void refreshBalance();
        setRunning(false);
      }
      return;
    }

    // ----- Sequential fallback (legacy) -----
    setRunning(true);
    const rows: ExecRow[] = valid.map((r) => ({ address: r.address, amount: r.amount, status: "pending" }));
    setExec(rows);
    const signer = await provider.getSigner();

    for (let i = 0; i < rows.length; i++) {
      rows[i].status = "sending";
      setExec([...rows]);
      try {
        const tx = await signer.sendTransaction({ to: rows[i].address, value: parseEther(rows[i].amount) });
        rows[i].hash = tx.hash;
        await tx.wait();
        rows[i].status = "success";
      } catch (e: any) {
        rows[i].status = "failed";
        rows[i].error = e?.shortMessage ?? e?.message ?? "Failed";
      }
      setExec([...rows]);
      const wait = randomize ? delayMs + Math.random() * delayMs * 0.6 : delayMs;
      if (i < rows.length - 1) await new Promise((r) => setTimeout(r, wait));
    }

    const ok = rows.filter((r) => r.status === "success").length;
    const fail = rows.filter((r) => r.status === "failed").length;
    if (fail === 0) toast.success(`Batch complete · ${ok} sent`);
    else toast.warning(`Batch finished with ${fail} failed`);
    void refreshBalance();
    setRunning(false);

    // persist history
    try {
      const log = JSON.parse(localStorage.getItem("ritual.history") ?? "[]");
      log.unshift({ ts: Date.now(), total: rows.length, ok, fail, rows });
      localStorage.setItem("ritual.history", JSON.stringify(log.slice(0, 50)));
    } catch {}
  };

  const exportResults = () => {
    if (!exec) return;
    const csv = ["address,amount,status,hash,error", ...exec.map(r => `${r.address},${r.amount},${r.status},${r.hash ?? ""},${r.error ?? ""}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ritual-batch-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const retryFailed = async () => {
    if (!provider || !exec) return;
    const failed = exec.filter(r => r.status === "failed");
    if (failed.length === 0) return;
    setRunning(true);
    const signer = await provider.getSigner();
    for (const row of failed) {
      row.status = "sending"; setExec([...exec]);
      try {
        const tx = await signer.sendTransaction({ to: row.address, value: parseEther(row.amount) });
        row.hash = tx.hash; await tx.wait(); row.status = "success"; row.error = undefined;
      } catch (e: any) { row.status = "failed"; row.error = e?.shortMessage ?? "Failed"; }
      setExec([...exec]);
    }
    setRunning(false);
    toast.success("Retry complete");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">One Signature Smart Distribution</div>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold">Send to hundreds of wallets <span className="text-gradient">instantly</span></h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">One signature. One tx hash. One confirmation. Gas-optimized batch loop on Ritual Testnet.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <div className="glass rounded-lg px-3 py-1.5 font-mono text-xs">
            balance · <span className="text-gradient">{Number(balance).toFixed(4)} RITUAL</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Pill icon={Zap} label="One Click Multi Send" />
        <Pill icon={ShieldCheck} label="Single Signature Batch Execution" />
        <Pill icon={Sparkles} label="Gas Optimized Distribution" />
      </div>

      {!address && (
        <div className="glass-strong rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm"><AlertTriangle className="size-4 text-amber-400" /> Connect your wallet to send.</div>
          <Button onClick={connect} className="holo-btn">Connect</Button>
        </div>
      )}
      {address && !isCorrectNetwork && (
        <div className="glass-strong rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm"><AlertTriangle className="size-4 text-amber-400" /> You're on the wrong network.</div>
          <Button onClick={switchNetwork} variant="destructive">Switch to Ritual</Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass rounded-2xl p-5 space-y-4">
          <Tabs defaultValue="paste">
            <TabsList className="glass">
              <TabsTrigger value="paste"><FileText className="size-3.5 mr-1.5" />Paste</TabsTrigger>
              <TabsTrigger value="upload"><Upload className="size-3.5 mr-1.5" />Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="mt-4 space-y-2">
              <Label className="text-xs text-muted-foreground">Paste address,amount per line — or just addresses if using equal split.</Label>
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={10}
                spellCheck={false}
                placeholder={"0xabc…123, 0.05\n0xdef…456, 0.10\n0x789…abc"}
                className="font-mono text-xs glass border-border"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="glass" onClick={sample}><Shuffle className="size-3.5 mr-1" />Add demo rows</Button>
                <Button variant="ghost" size="sm" onClick={() => setRaw("")}>Clear</Button>
              </div>
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <div className="glass rounded-xl border-2 border-dashed border-border/40 p-10 text-center">
                <Upload className="size-8 mx-auto text-primary" />
                <div className="mt-3 font-medium">Upload CSV or TXT</div>
                <div className="text-xs text-muted-foreground mt-1">Format: <code className="font-mono">address,amount</code> per line</div>
                <input ref={fileRef} type="file" accept=".csv,.txt" hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Button onClick={() => fileRef.current?.click()} className="mt-4 holo-btn">Choose file</Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2"><Wand2 className="size-4 text-primary" />Equal distribution</Label>
                <Switch checked={equal} onCheckedChange={setEqual} />
              </div>
              <Input value={equalAmount} disabled={!equal} onChange={(e) => setEqualAmount(e.target.value)} placeholder="0.01" className="mt-3 font-mono" />
              <div className="text-[10px] text-muted-foreground mt-1">RITUAL per recipient</div>
            </div>
            <div className="glass rounded-xl p-4">
              <Label className="text-sm">Anti-spam delay</Label>
              <Input type="number" value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} className="mt-3 font-mono" />
              <div className="text-[10px] text-muted-foreground mt-1">ms between txs</div>
              <div className="flex items-center justify-between mt-3">
                <Label className="text-xs text-muted-foreground">Randomize timing</Label>
                <Switch checked={randomize} onCheckedChange={setRandomize} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-5 space-y-4 sticky top-24 self-start">
          <h2 className="font-semibold flex items-center gap-2"><Eye className="size-4 text-primary" /> Batch summary</h2>
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> One Signature mode</div>
              <div className="text-[10px] text-muted-foreground">Single tx via RitualBatchSender</div>
            </div>
            <Switch checked={oneSig} onCheckedChange={setOneSig} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat l="Recipients" v={String(valid.length)} sub={invalid.length ? `${invalid.length} invalid` : "all valid"} />
            <Stat l="Total" v={Number(totalStr).toFixed(4)} sub="RITUAL" />
            <Stat l="Est. gas" v={oneSig ? (Number(estGas) * 0.35).toFixed(6) : estGas} sub={oneSig ? "RITUAL · ~65% saved" : "RITUAL"} />
            <Stat l="After send" v={(balanceN - totalN - Number(estGas)).toFixed(4)} sub="balance" warning={insufficient} />
          </div>
          {insufficient && (
            <div className="glass rounded-lg p-3 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" /> Not enough RITUAL to cover this batch. Top up via the <a href={RITUAL_CHAIN.faucet} target="_blank" className="underline">faucet</a>.
            </div>
          )}
          <Button
            disabled={!address || !isCorrectNetwork || valid.length === 0 || insufficient || running}
            onClick={() => setPreviewOpen(true)}
            className="w-full holo-btn font-semibold"
          >
            {running ? <><Loader2 className="size-4 animate-spin mr-2" />Sending…</> : <><Send className="size-4 mr-2" />Preview & send</>}
          </Button>
          {invalid.length > 0 && (
            <Button onClick={removeInvalid} variant="outline" size="sm" className="w-full glass">
              <Trash2 className="size-3.5 mr-1.5" /> Remove {invalid.length} invalid
            </Button>
          )}
        </div>
      </div>

      {oneSigTx && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 glow">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-sm"><Zap className="size-5 text-primary-foreground" /></div>
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">One Signature batch</div>
                <div className="font-semibold">{oneSigTx.count} wallets · {Number(oneSigTx.total).toFixed(4)} RITUAL · 1 tx hash</div>
              </div>
            </div>
            <a href={explorerTx(oneSigTx.hash)} target="_blank" className="text-primary text-sm flex items-center gap-1 hover:underline font-mono">
              {shortAddr(oneSigTx.hash, 8)} <ExternalLink className="size-3.5" />
            </a>
          </div>
        </motion.div>
      )}

      {recipients.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recipients · {recipients.length}</h2>
            <div className="text-xs font-mono text-muted-foreground">{valid.length} valid · {invalid.length} invalid</div>
          </div>
          <div className="overflow-auto max-h-[420px] rounded-lg border border-border/40">
            <table className="w-full text-xs font-mono">
              <thead className="bg-white/5 sticky top-0">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Address</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, i) => (
                  <tr key={r.id} className="border-t border-border/30 hover:bg-white/5">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">{shortAddr(r.address, 6)}</td>
                    <td className="px-3 py-2 text-right">{r.amount}</td>
                    <td className="px-3 py-2">
                      {r.valid ? <span className="text-emerald-400">valid</span> : <span className="text-destructive">{r.error}</span>}
                    </td>
                    <td className="px-3 py-2"><button onClick={() => removeRow(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Execution feed */}
      <AnimatePresence>
        {exec && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold flex items-center gap-2">
                {running ? <Loader2 className="size-4 animate-spin text-primary" /> : <CheckCircle2 className="size-4 text-emerald-400" />}
                Execution timeline
              </h2>
              <div className="flex gap-2">
                {exec.some(r => r.status === "failed") && !running && (
                  <Button size="sm" variant="outline" onClick={retryFailed} className="glass">Retry failed</Button>
                )}
                <Button size="sm" variant="outline" onClick={exportResults} className="glass">Export CSV</Button>
              </div>
            </div>
            <div className="max-h-80 overflow-auto rounded-lg space-y-1">
              {exec.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono glass rounded-md px-3 py-2">
                  <div className="flex items-center gap-3">
                    <StatusDot s={r.status} />
                    <span>{shortAddr(r.address, 6)}</span>
                    <span className="text-muted-foreground">{r.amount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.error && <span className="text-destructive truncate max-w-[180px]">{r.error}</span>}
                    {r.hash && (
                      <>
                        <button onClick={() => { navigator.clipboard.writeText(r.hash!); toast.success("Hash copied"); }} className="text-muted-foreground hover:text-foreground"><Copy className="size-3" /></button>
                        <a href={explorerTx(r.hash)} target="_blank" className="text-primary hover:underline flex items-center gap-1">tx <ExternalLink className="size-3" /></a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader><DialogTitle>{oneSig ? "Confirm One Signature distribution" : "Confirm batch send"}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Stat l="Recipients" v={String(valid.length)} />
              <Stat l="Total" v={`${Number(totalStr).toFixed(4)} RITUAL`} />
              <Stat l="Mode" v={oneSig ? "1 sig · 1 tx" : `${valid.length} sigs`} />
              <Stat l="Delay" v={oneSig ? "—" : `${delayMs}ms${randomize ? " ± rnd" : ""}`} />
            </div>
            <p className="text-xs text-muted-foreground">
              {oneSig
                ? `One wallet confirmation. Funds and calldata are submitted in a single tx hash via RitualBatchSender; all ${valid.length} recipients are paid atomically.`
                : `Each recipient receives a separate tx — you'll approve ${valid.length} times. Use One Signature mode for instant distribution.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={startExecution} className="holo-btn"><Send className="size-4 mr-2" />Execute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm">
      <Icon className="size-4 text-primary shrink-0" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function Stat({ l, v, sub, warning }: { l: string; v: string; sub?: string; warning?: boolean }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
      <div className={`mt-1 text-lg font-bold font-mono ${warning ? "text-destructive" : "text-gradient"}`}>{v}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-mono">{sub}</div>}
    </div>
  );
}

function StatusDot({ s }: { s: ExecRow["status"] }) {
  if (s === "pending") return <span className="size-2 rounded-full bg-muted-foreground/50" />;
  if (s === "sending") return <Loader2 className="size-3 animate-spin text-primary" />;
  if (s === "success") return <CheckCircle2 className="size-3 text-emerald-400" />;
  return <XCircle className="size-3 text-destructive" />;
}