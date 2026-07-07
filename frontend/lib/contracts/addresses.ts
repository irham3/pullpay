import type { Address } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155420);

export const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS ||
  ZERO) as Address;

export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  ZERO) as Address;

// Oracle address — used only for the local/mock demo "resolve assertion" action
// (set to the MockOptimisticOracleV3 on anvil). Never call this against real UMA.
export const UMA_ADDRESS = (process.env.NEXT_PUBLIC_UMA_ADDRESS ||
  ZERO) as Address;

// True when the oracle is our controllable mock (anvil, or a testnet demo where
// we deployed MockOptimisticOracle and flagged it). Enables the resolve action.
export const MOCK_ORACLE =
  (CHAIN_ID === 31337 || process.env.NEXT_PUBLIC_MOCK_ORACLE === "true") &&
  UMA_ADDRESS !== ZERO;

// USDC uses 6 decimals across every network.
export const USDC_DECIMALS = 6;

// Block the escrow was deployed at — lower bound for the RewardCreated event
// scan that powers the board without a subgraph.
export const DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_DEPLOY_BLOCK || "0"
);

// True when no escrow is deployed yet — the app then runs on demo data so the
// full flow is explorable before a faucet/deploy (mirrors the reference app).
export const DEMO_MODE = ESCROW_ADDRESS === ZERO;
