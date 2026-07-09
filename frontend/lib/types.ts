import type { UiStatus } from "./status";

export type Mode = "Instant" | "Safeguarded";

export interface Bounty {
  id: `0x${string}`;
  repo: string;
  issueNumber: number;
  issueTitle: string;
  amount: number; // USDC, human units
  bond: number; // USDC
  token: string; // symbol, e.g. "USDC"
  maintainer: `0x${string}`;
  contributor?: `0x${string}`;
  contributorHandle?: string;
  mode: Mode;
  status: UiStatus;
  deadline: number; // unix seconds
  createdAt: number; // unix seconds
  language: string;
  labels: string[];
  fundingTx: `0x${string}`;
  /** Present while Verifying: unix seconds the liveness window closes. */
  livenessEndsAt?: number;
  prNumber?: number;
}

/**
 * A reward as persisted in the shared server KV store. Same shape as {@link Bounty}
 * plus a write timestamp. This is the cross-user source of truth for metadata
 * (title/labels/language) and the "soft" off-chain status (In Review / Merged),
 * which on-chain state alone cannot express. On-chain terminal states still win
 * at render time — see the merge in the rewards hooks.
 */
export interface StoredReward extends Bounty {
  updatedAt?: number;
}

export interface Attestation {
  uid: `0x${string}`;
  repo: string;
  issueNumber: number;
  amount: number;
  contributionType: string;
  date: number; // unix seconds
  txHash: `0x${string}`;
}

export interface ContributorProfile {
  address: `0x${string}`;
  handle: string;
  totalEarned: number;
  contributions: number;
  reposCount: number;
  attestations: Attestation[];
}
