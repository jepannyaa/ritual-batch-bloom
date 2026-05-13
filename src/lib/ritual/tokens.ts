import { Contract, type BrowserProvider, type JsonRpcProvider } from "ethers";

export type TokenConfig = {
  symbol: string;
  name: string;
  address: string | null; // null = native RITUAL
  decimals: number;
  isNative: boolean;
  hasFaucet?: boolean;
};

export const RUSDC_ADDRESS = "0x76E78dB66adA9D58037A65D735e476D88CDDfE6d";
export const SIGGY_ADDRESS = "0x8c04B330DBFA60eD6502d7c2AE2a58Bd3fCb085b";

export const RUSDC_ABI = [
  "function faucet() external",
  "function faucetCooldownRemaining(address user) external view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export const TOKENS: Record<string, TokenConfig> = {
  RITUAL: {
    symbol: "RITUAL",
    name: "Ritual",
    address: null,
    decimals: 18,
    isNative: true,
  },
  rUSDC: {
    symbol: "rUSDC",
    name: "Ritual USDC",
    address: RUSDC_ADDRESS,
    decimals: 6,
    isNative: false,
    hasFaucet: true,
  },
  SIGGY: {
    symbol: "SIGGY",
    name: "SIGGY Inu",
    address: SIGGY_ADDRESS,
    decimals: 18,
    isNative: false,
    hasFaucet: false,
  },
};

export function erc20(address: string, runner: BrowserProvider | JsonRpcProvider | any) {
  return new Contract(address, RUSDC_ABI, runner);
}
