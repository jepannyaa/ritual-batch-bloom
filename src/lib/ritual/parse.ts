import { isAddress, parseEther } from "ethers";

export type Recipient = {
  id: string;
  address: string;
  amount: string; // human readable
  valid: boolean;
  duplicate: boolean;
  error?: string;
};

let _id = 0;
const nid = () => `${Date.now()}-${_id++}`;

export function parseRecipients(text: string, equalAmount?: string): Recipient[] {
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: Recipient[] = [];

  for (const row of rows) {
    const parts = row.split(/[,\s;]+/).filter(Boolean);
    const address = (parts[0] ?? "").toLowerCase();
    const amount = (equalAmount && equalAmount.length > 0) ? equalAmount : (parts[1] ?? "0");

    let valid = true;
    let error: string | undefined;
    if (!isAddress(address)) {
      valid = false; error = "Invalid address";
    } else {
      try { parseEther(amount); } catch { valid = false; error = "Invalid amount"; }
    }
    const duplicate = seen.has(address);
    if (valid && !duplicate) seen.add(address);

    out.push({ id: nid(), address, amount, valid: valid && !duplicate, duplicate, error: duplicate ? "Duplicate" : error });
  }
  return out;
}

export function totalAmount(rows: Recipient[]) {
  let sum = 0n;
  for (const r of rows) {
    if (!r.valid) continue;
    try { sum += parseEther(r.amount); } catch {}
  }
  return sum;
}