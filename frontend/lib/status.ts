// Unified reward/PR status model (PRD §25). One UI status composed from the
// off-chain PR signal and the on-chain contract Status enum.

export type UiStatus =
  | "Open"
  | "In Review"
  | "Changes Requested"
  | "Merged"
  | "Verifying"
  | "Disputed"
  | "Paid"
  | "Rejected"
  | "Refunded";

export type Signal = "muted" | "ok" | "warn" | "bad" | "accent";

export interface StatusMeta {
  /** CSS var backing the status dot / accent. */
  dot: Signal;
  /** One-line human meaning shown in tooltips and detail headers. */
  description: string;
}

export const STATUS_META: Record<UiStatus, StatusMeta> = {
  Open: { dot: "ok", description: "Bounty funded and awaiting work." },
  "In Review": {
    dot: "accent",
    description: "A linked PR is open and under maintainer review.",
  },
  "Changes Requested": {
    dot: "warn",
    description: "The maintainer requested changes on the PR.",
  },
  Merged: {
    dot: "accent",
    description: "PR merged — settlement is starting.",
  },
  Verifying: {
    dot: "warn",
    description: "UMA liveness window is running before payout.",
  },
  Disputed: {
    dot: "bad",
    description: "Challenged — resolving via UMA commit–reveal voting.",
  },
  Paid: {
    dot: "ok",
    description: "Contributor paid and reputation attestation minted.",
  },
  Rejected: {
    dot: "bad",
    description: "A dispute proved the claim false; funds returned.",
  },
  Refunded: {
    dot: "muted",
    description: "Deadline passed with no eligible work; funds returned.",
  },
};

export const signalVar: Record<Signal, string> = {
  muted: "var(--muted)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
  accent: "var(--accent)",
};

// On-chain contract Status enum → default UI status (before PR enrichment).
export const CONTRACT_STATUS = [
  "None",
  "Funded",
  "Asserted",
  "Settled",
  "Refunded",
  "Rejected",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUS)[number];

export function contractStatusToUi(s: ContractStatus): UiStatus {
  switch (s) {
    case "Funded":
      return "Open";
    case "Asserted":
      return "Verifying";
    case "Settled":
      return "Paid";
    case "Rejected":
      return "Rejected";
    case "Refunded":
      return "Refunded";
    default:
      return "Open";
  }
}

// Ordered lifecycle phases for the reward-detail stepper.
export const LIFECYCLE: UiStatus[] = [
  "Open",
  "In Review",
  "Merged",
  "Verifying",
  "Paid",
];
