import { useWallet } from "@/lib/ritual/wallet";
import { Button } from "@/components/ui/button";
import { shortAddr, RITUAL_CHAIN } from "@/lib/ritual/chain";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Copy, ExternalLink, LogOut, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";

export function ConnectButton() {
  const { address, isCorrectNetwork, balance, connect, disconnect, switchNetwork, refreshBalance, connecting, chainId } = useWallet();

  if (!address) {
    return (
      <Button onClick={connect} disabled={connecting} className="holo-btn font-semibold">
        <Wallet className="size-4 mr-2" />
        {connecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Button variant="destructive" onClick={switchNetwork} className="font-semibold animate-pulse-glow">
        Switch to Ritual Testnet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="glass font-mono">
          <span className="size-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
          {Number(balance).toFixed(3)} RITUAL
          <span className="mx-2 opacity-40">·</span>
          {shortAddr(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 glass-strong">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">Chain {chainId} · Ritual Testnet</div>
        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(address); toast.success("Address copied"); }}>
          <Copy className="size-4 mr-2" /> Copy address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(`${RITUAL_CHAIN.explorer}/address/${address}`, "_blank")}>
          <ExternalLink className="size-4 mr-2" /> View on explorer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => refreshBalance()}>
          <RefreshCw className="size-4 mr-2" /> Refresh balance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          <LogOut className="size-4 mr-2" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}