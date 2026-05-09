import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { RITUAL_CHAIN } from "./chain";
import { toast } from "sonner";

type Eth = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

declare global {
  interface Window { ethereum?: Eth }
}

type Ctx = {
  address: string | null;
  chainId: number | null;
  balance: string;
  isCorrectNetwork: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  provider: BrowserProvider | null;
};

const WalletCtx = createContext<Ctx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);

  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return new BrowserProvider(window.ethereum as any);
  }, [address, chainId]);

  const refreshBalance = useCallback(async () => {
    if (!provider || !address) return;
    try {
      const b = await provider.getBalance(address);
      setBalance(formatEther(b));
    } catch {}
  }, [provider, address]);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("No EVM wallet detected. Install MetaMask or any EVM wallet.");
      return;
    }
    try {
      setConnecting(true);
      const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const cid: string = await window.ethereum.request({ method: "eth_chainId" });
      setAddress(accounts[0] ?? null);
      setChainId(parseInt(cid, 16));
      toast.success("Wallet connected");
    } catch (e: any) {
      toast.error(e?.message ?? "Connection rejected");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance("0");
    toast("Wallet disconnected");
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: RITUAL_CHAIN.hexId }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: RITUAL_CHAIN.hexId,
            chainName: RITUAL_CHAIN.name,
            nativeCurrency: RITUAL_CHAIN.nativeCurrency,
            rpcUrls: [RITUAL_CHAIN.rpcUrl],
            blockExplorerUrls: [RITUAL_CHAIN.explorer],
          }],
        });
      } else {
        toast.error(err?.message ?? "Failed to switch network");
      }
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum?.on) return;
    const onAcc = (accs: string[]) => setAddress(accs[0] ?? null);
    const onChain = (cid: string) => setChainId(parseInt(cid, 16));
    window.ethereum.on("accountsChanged", onAcc);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAcc);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, []);

  useEffect(() => { void refreshBalance(); }, [refreshBalance]);

  const value: Ctx = {
    address, chainId, balance,
    isCorrectNetwork: chainId === RITUAL_CHAIN.id,
    connecting, connect, disconnect, switchNetwork, refreshBalance, provider,
  };

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}