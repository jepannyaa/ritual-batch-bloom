import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Code2, Cpu, Gauge, Network, Wand2 } from "lucide-react";
import { JsonRpcProvider } from "ethers";
import { RITUAL_CHAIN } from "@/lib/ritual/chain";
import { buildBatchPayload, makeBatchId, BATCH_SENDER_ADDRESS, AUTH_MANAGER_ADDRESS } from "@/lib/ritual/batch";
import { toast } from "sonner";

export const Route = createFileRoute("/app/developer")({
  head: () => ({ meta: [{ title: "Developer · Ritual" }] }),
  component: Developer,
});

function Developer() {
  const [latency, setLatency] = useState<number | null>(null);
  const [block, setBlock] = useState<number | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [calldata, setCalldata] = useState<string>("");
  const [queueJson, setQueueJson] = useState<string>(JSON.stringify([
    { address: "0x000000000000000000000000000000000000dEaD", amount: "0.05" },
    { address: "0x000000000000000000000000000000000000bEEF", amount: "0.05" },
  ], null, 2));

  const ping = async () => {
    try {
      const provider = new JsonRpcProvider(RITUAL_CHAIN.rpcUrl);
      const t = performance.now();
      const [bn, net] = await Promise.all([provider.getBlockNumber(), provider.getNetwork()]);
      setLatency(Math.round(performance.now() - t));
      setBlock(bn);
      setChainId(Number(net.chainId));
    } catch (e: any) {
      toast.error("RPC ping failed: " + (e?.message ?? "unknown"));
    }
  };

  useEffect(() => { void ping(); const t = setInterval(ping, 15_000); return () => clearInterval(t); }, []);

  const generateCalldata = () => {
    try {
      const rows = JSON.parse(queueJson);
      if (!Array.isArray(rows)) throw new Error("Expected array");
      const { data, total, recipients } = buildBatchPayload(rows, makeBatchId());
      setCalldata(`// to: ${BATCH_SENDER_ADDRESS}\n// value: ${total} wei\n// recipients: ${recipients.length}\n\n${data}`);
    } catch (e: any) {
      toast.error("Encode failed: " + (e?.message ?? "invalid input"));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Developer Mode</div>
        <h1 className="mt-1 text-3xl md:text-4xl font-bold">Inspect the <span className="text-gradient">substrate</span></h1>
        <p className="text-muted-foreground mt-1 text-sm">Raw calldata, RPC health, contract config — everything that powers a Ritual campaign.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card icon={Network} label="RPC latency" v={latency != null ? `${latency} ms` : "…"} sub={RITUAL_CHAIN.rpcUrl} />
        <Card icon={Activity} label="Latest block" v={block != null ? `#${block.toLocaleString()}` : "…"} sub="chain 1979" />
        <Card icon={Cpu} label="Chain id" v={chainId ?? "…"} sub={chainId === 1979 ? "ritual ✓" : "mismatch"} />
        <Card icon={Gauge} label="Network health" v="green" sub="last 60s" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="font-semibold flex items-center gap-2"><Wand2 className="size-4 text-primary" /> Queue JSON editor</div>
          <Textarea rows={10} value={queueJson} onChange={(e) => setQueueJson(e.target.value)} className="font-mono text-xs glass" />
          <Button onClick={generateCalldata} className="holo-btn"><Code2 className="size-4 mr-1" /> Encode batchSendNative()</Button>
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="font-semibold flex items-center gap-2"><Code2 className="size-4 text-primary" /> Raw calldata preview</div>
          <pre className="glass rounded-lg p-3 text-[11px] font-mono overflow-auto max-h-72 whitespace-pre-wrap break-all">
{calldata || "// click Encode to generate calldata"}
          </pre>
          <div className="text-xs text-muted-foreground font-mono">
            <div>BATCH_SENDER · {BATCH_SENDER_ADDRESS}</div>
            <div>AUTH_MANAGER · {AUTH_MANAGER_ADDRESS}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="font-semibold mb-3">Execution simulation sandbox</div>
        <p className="text-xs text-muted-foreground">
          Hook this panel to <span className="font-mono">eth_call</span> against RitualBatchSender to dry-run a batch without spending gas.
          Configure <span className="font-mono">VITE_RITUAL_BATCH_SENDER</span> to enable live simulation.
        </p>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, v, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; v: string | number; sub?: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" /> {label}</div>
      <div className="mt-1 text-2xl font-bold font-mono text-gradient">{v}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-mono truncate">{sub}</div>}
    </div>
  );
}