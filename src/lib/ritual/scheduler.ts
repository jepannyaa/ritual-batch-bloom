import { parseEther } from "ethers";

export type CampaignStatus =
  | "draft"        // recipients still being added
  | "authorized"   // user signed EIP-712, queue still mutable
  | "locked"       // queue snapshot taken, waiting for runAt
  | "executing"
  | "success"
  | "failed"
  | "paused"
  | "cancelled"
  | "stopped";     // emergency stop

export type CampaignRecipient = { address: string; amount: string };

export type Campaign = {
  id: string;
  name: string;
  recurrence: "once" | "daily" | "weekly" | "monthly";
  runAt: number;
  perWalletDefault: string;       // for newly added wallets if not specified
  recipients: CampaignRecipient[];
  maxRecipients: number;
  status: CampaignStatus;
  createdAt: number;
  authorizedAt?: number;
  authorization?: {
    signature: string;
    expiresAt: number;
    nonce: number;
    maxTotal: string; // wei
  };
  executedTx?: string;
  snapshotChecksum?: string;
};

const KEY = "ritual.campaigns.v2";

export function loadCampaigns(): Campaign[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function saveCampaigns(list: Campaign[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function totalWei(c: Campaign): bigint {
  let sum = 0n;
  for (const r of c.recipients) {
    try { sum += parseEther(r.amount); } catch {}
  }
  return sum;
}

/// Deterministic checksum (hex) of locked queue — used for queue integrity.
export async function queueChecksum(c: Campaign): Promise<string> {
  const data = c.recipients.map((r) => `${r.address.toLowerCase()}:${r.amount}`).join("|");
  const buf = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return "0x" + Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const newId = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;