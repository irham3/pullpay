import "server-only";
import { foundry, optimism, optimismSepolia } from "viem/chains";
import type { Chain } from "viem";

// Resolve the target chain + RPC for server-side (relayer) clients.
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155420);

const CHAINS: Record<number, Chain> = {
  31337: foundry,
  11155420: optimismSepolia,
  10: optimism,
};

const DEFAULT_RPC: Record<number, string> = {
  31337: "http://127.0.0.1:8545",
  11155420: "https://sepolia.optimism.io",
  10: "https://mainnet.optimism.io",
};

export const serverChain: Chain = CHAINS[CHAIN_ID] ?? optimismSepolia;

export const rpcUrl =
  process.env.RELAYER_RPC_URL ||
  process.env.OP_SEPOLIA_RPC_URL ||
  DEFAULT_RPC[CHAIN_ID] ||
  DEFAULT_RPC[11155420];
