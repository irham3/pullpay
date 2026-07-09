import type { UiStatus } from "./status";

export type Mode = "Instant" | "Safeguarded";

// A pull request a contributor opened against the funded issue. The contributor
// establishes the issue↔PR relation (by referencing the issue in their PR);
// PullPay records every such PR so the maintainer can pick which one to pay.
export interface PullRequestRef {
  number: number;
  author: string | null; // GitHub login
  title: string;
  url: string;
  state: "open" | "closed" | "merged";
  createdAt?: number; // unix seconds
  updatedAt?: number; // unix seconds
  /** How the link was made: the contributor's PR referenced the issue, or the
   * maintainer/relayer attached it. */
  source: "webhook" | "contributor" | "manual";
}

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
  /** The PR chosen for payout (once one is merged/settled). */
  prNumber?: number;
  /** Every candidate PR linked to this reward's issue. */
  prs?: PullRequestRef[];
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
