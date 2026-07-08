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
  dot: Signal;
  description: string;
}

export const STATUS_META: Record<UiStatus, StatusMeta> = {
  Open: { dot: "ok", description: "Reward is funded. Work can start." },
  "In Review": {
    dot: "accent",
    description: "A pull request is open and being reviewed.",
  },
  "Changes Requested": {
    dot: "warn",
    description: "The PR needs changes before merge.",
  },
  Merged: {
    dot: "accent",
    description: "The PR was merged. Payout is starting.",
  },
  Verifying: {
    dot: "warn",
    description: "PullPay is waiting for the UMA check to finish.",
  },
  Disputed: {
    dot: "bad",
    description: "The payout was challenged and is being resolved by UMA.",
  },
  Paid: {
    dot: "ok",
    description: "Contributor was paid. Reputation was recorded.",
  },
  Rejected: {
    dot: "bad",
    description: "The payout request failed. Funds returned to the funder.",
  },
  Refunded: {
    dot: "muted",
    description: "Deadline passed. Funds returned to the maintainer.",
  },
};

export const signalVar: Record<Signal, string> = {
  muted: "var(--muted)",
  ok: "var(--ok)",
  warn: "var(--warn)",
  bad: "var(--bad)",
  accent: "var(--accent)",
};

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

export const LIFECYCLE: UiStatus[] = [
  "Open",
  "In Review",
  "Merged",
  "Verifying",
  "Paid",
];
