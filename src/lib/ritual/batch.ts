import { Interface, parseEther, getAddress, type BrowserProvider } from "ethers";
import { RITUAL_CHAIN } from "./chain";

export const BATCH_SENDER_ABI = [
  "function batchSendNative(address[] recipients, uint256[] amounts, bytes32 batchId) payable",
];
export const batchSenderIface = new Interface(BATCH_SENDER_ABI);

/// Configurable contract address; falls back to a known stub for demo.
export const BATCH_SENDER_ADDRESS =
  (import.meta.env.VITE_RITUAL_BATCH_SENDER as string | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const AUTH_MANAGER_ADDRESS =
  (import.meta.env.VITE_RITUAL_AUTH_MANAGER as string | undefined) ??
  "0x0000000000000000000000000000000000000000";

export type BatchInput = { address: string; amount: string };

export function buildBatchPayload(rows: BatchInput[], batchId: string) {
  const recipients = rows.map((r) => getAddress(r.address));
  const amounts = rows.map((r) => parseEther(r.amount));
  const total = amounts.reduce((s, a) => s + a, 0n);
  const data = batchSenderIface.encodeFunctionData("batchSendNative", [
    recipients, amounts, batchId,
  ]);
  return { recipients, amounts, total, data };
}

export function makeBatchId() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return "0x" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/// EIP-712 typed data domain bound to chain 1979.
export function authDomain() {
  return {
    name: "RitualMultiSender",
    version: "1",
    chainId: RITUAL_CHAIN.id,
    verifyingContract: AUTH_MANAGER_ADDRESS,
  };
}

export const AUTH_TYPES = {
  Authorization: [
    { name: "owner", type: "address" },
    { name: "executor", type: "address" },
    { name: "maxRecipients", type: "uint256" },
    { name: "maxTotal", type: "uint256" },
    { name: "expiresAt", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export type AuthorizationPayload = {
  owner: string;
  executor: string;
  maxRecipients: number;
  maxTotal: string; // wei as string
  expiresAt: number;
  nonce: number;
};

export async function signAuthorization(provider: BrowserProvider, payload: AuthorizationPayload) {
  const signer = await provider.getSigner();
  const sig = await signer.signTypedData(authDomain(), AUTH_TYPES as any, payload);
  return sig;
}

export async function executeOneSignatureBatch(
  provider: BrowserProvider,
  rows: BatchInput[],
  opts?: { batchId?: string }
) {
  const signer = await provider.getSigner();
  const batchId = opts?.batchId ?? makeBatchId();

  // If contract not configured, fallback to multicall-via-EOA: send one tx per recipient.
  if (BATCH_SENDER_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      "BATCH_SENDER not configured. Set VITE_RITUAL_BATCH_SENDER to your deployed RitualBatchSender."
    );
  }
  const { total, data } = buildBatchPayload(rows, batchId);
  const tx = await signer.sendTransaction({
    to: BATCH_SENDER_ADDRESS,
    value: total,
    data,
  });
  return { tx, batchId, total };
}