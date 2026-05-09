export const RITUAL_CHAIN = {
  id: 1979,
  hexId: "0x" + (1979).toString(16),
  name: "Ritual Testnet",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrl: "https://rpc.ritualfoundation.org/",
  explorer: "https://explorer.ritualfoundation.org",
  faucet: "https://faucet.ritualfoundation.org",
};

export function explorerTx(hash: string) {
  return `${RITUAL_CHAIN.explorer}/tx/${hash}`;
}
export function explorerAddr(addr: string) {
  return `${RITUAL_CHAIN.explorer}/address/${addr}`;
}

export function shortAddr(a: string, n = 4) {
  if (!a) return "";
  return a.length > 2 * n + 4 ? `${a.slice(0, n + 2)}…${a.slice(-n)}` : a;
}