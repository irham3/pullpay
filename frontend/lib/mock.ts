import type { Bounty, ContributorProfile } from "./types";

const now = Math.floor(Date.now() / 1000);
const day = 86400;

// Demo bounties covering every status/mode so the whole lifecycle is explorable
// before a deploy (DEMO_MODE in lib/contracts/addresses). Real, plausible OSS repos.
export const MOCK_BOUNTIES: Bounty[] = [
  {
    id: "0x7a1c9f3e2b4d6a8c0e1f5a7b9d3c2e4f6a8b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
    repo: "wevm/viem",
    issueNumber: 3421,
    issueTitle: "Add `simulateBlocks` action for multi-call previews",
    amount: 320,
    bond: 15,
    token: "USDC",
    maintainer: "0x9f2c8a1e4b7d3c6f0a2e5b8d1c4f7a9e3b6d0c2f",
    mode: "Safeguarded",
    status: "Open",
    deadline: now + 21 * day,
    createdAt: now - 2 * day,
    language: "TypeScript",
    labels: ["enhancement", "good first issue"],
    fundingTx:
      "0xa1b2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d6e7f8091a2b3c4d5e6f7081",
  },
  {
    id: "0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4",
    repo: "vercel/next.js",
    issueNumber: 68210,
    issueTitle: "Turbopack: incorrect source map offset for RSC boundaries",
    amount: 750,
    bond: 40,
    token: "USDC",
    maintainer: "0x3b6d0c2f9f2c8a1e4b7d3c6f0a2e5b8d1c4f7a9e",
    mode: "Safeguarded",
    status: "Verifying",
    deadline: now + 9 * day,
    createdAt: now - 6 * day,
    language: "Rust",
    labels: ["bug", "Turbopack"],
    fundingTx:
      "0xb2c3d4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f8092",
    livenessEndsAt: now + 2 * 3600,
    contributor: "0x5b8d1c4f7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a2e",
    contributorHandle: "octaviadev",
    prNumber: 68344,
  },
  {
    id: "0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5",
    repo: "prettier/prettier",
    issueNumber: 15980,
    issueTitle: "Preserve blank lines in `.graphql` block strings",
    amount: 120,
    bond: 0,
    token: "USDC",
    maintainer: "0x7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a2e5b8d1c4f",
    mode: "Instant",
    status: "In Review",
    deadline: now + 14 * day,
    createdAt: now - 3 * day,
    language: "JavaScript",
    labels: ["good first issue", "lang:graphql"],
    fundingTx:
      "0xc3d4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f809203",
    contributorHandle: "mira-k",
    prNumber: 16002,
  },
  {
    id: "0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6",
    repo: "honojs/hono",
    issueNumber: 3011,
    issueTitle: "Type-safe RPC client drops `Set-Cookie` on 204 responses",
    amount: 200,
    bond: 12,
    token: "USDC",
    maintainer: "0x0c2f9f2c8a1e4b7d3c6f0a2e5b8d1c4f7a9e3b6d",
    mode: "Safeguarded",
    status: "Paid",
    deadline: now - 1 * day,
    createdAt: now - 12 * day,
    language: "TypeScript",
    labels: ["bug"],
    fundingTx:
      "0xd4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f80920314",
    contributor: "0x2e5b8d1c4f7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a",
    contributorHandle: "octaviadev",
    prNumber: 3040,
  },
  {
    id: "0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7",
    repo: "withastro/astro",
    issueNumber: 11402,
    issueTitle: "Content collections: slow cold build with 10k+ MD entries",
    amount: 900,
    bond: 50,
    token: "USDC",
    maintainer: "0x4f7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a2e5b8d1c",
    mode: "Safeguarded",
    status: "Disputed",
    deadline: now + 4 * day,
    createdAt: now - 8 * day,
    language: "TypeScript",
    labels: ["performance", "needs triage"],
    fundingTx:
      "0xe5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f8092031425",
    contributor: "0x1e4b7d3c6f0a2e5b8d1c4f7a9e3b6d0c2f9f2c8a",
    contributorHandle: "kevin-oss",
    prNumber: 11455,
  },
  {
    id: "0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708",
    repo: "drizzle-team/drizzle-orm",
    issueNumber: 2890,
    issueTitle: "`generated always as` columns ignored on SQLite push",
    amount: 260,
    bond: 15,
    token: "USDC",
    maintainer: "0x6f0a2e5b8d1c4f7a9e3b6d0c2f9f2c8a1e4b7d3c",
    mode: "Instant",
    status: "Refunded",
    deadline: now - 3 * day,
    createdAt: now - 20 * day,
    language: "TypeScript",
    labels: ["bug", "sqlite"],
    fundingTx:
      "0xf6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f809203142536",
  },
  {
    id: "0x6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f70819",
    repo: "colinhacks/zod",
    issueNumber: 3599,
    issueTitle: "`z.coerce.date()` rejects valid ISO week dates",
    amount: 150,
    bond: 0,
    token: "USDC",
    maintainer: "0x8d1c4f7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a2e5b",
    mode: "Instant",
    status: "Open",
    deadline: now + 30 * day,
    createdAt: now - 1 * day,
    language: "TypeScript",
    labels: ["good first issue"],
    fundingTx:
      "0x071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f80920314253647",
  },
];

export function getBounty(id: string): Bounty | undefined {
  return MOCK_BOUNTIES.find((b) => b.id.toLowerCase() === id.toLowerCase());
}

// Aggregate stats for the landing hero (CountUp) and board header.
export function boardStats() {
  const totalLocked = MOCK_BOUNTIES.filter((b) =>
    ["Open", "In Review", "Verifying", "Disputed"].includes(b.status)
  ).reduce((s, b) => s + b.amount, 0);
  const paidOut = MOCK_BOUNTIES.filter((b) => b.status === "Paid").reduce(
    (s, b) => s + b.amount,
    0
  );
  return {
    totalLocked,
    paidOut,
    openCount: MOCK_BOUNTIES.filter((b) => b.status === "Open").length,
    repos: new Set(MOCK_BOUNTIES.map((b) => b.repo.split("/")[0])).size,
  };
}

// Demo contributor profiles keyed by lowercase address (EAS attestations, §27.4/F10).
export const MOCK_PROFILES: Record<string, ContributorProfile> = {
  "0x2e5b8d1c4f7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a": {
    address: "0x2e5b8d1c4f7a9e3b6d0c2f9f2c8a1e4b7d3c6f0a",
    handle: "octaviadev",
    totalEarned: 1240,
    contributions: 5,
    reposCount: 4,
    attestations: [
      {
        uid: "0xa11ce0000000000000000000000000000000000000000000000000000000001",
        repo: "honojs/hono",
        issueNumber: 3011,
        amount: 200,
        contributionType: "bug",
        date: now - 2 * day,
        txHash:
          "0xd4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f80920314",
      },
      {
        uid: "0xa11ce0000000000000000000000000000000000000000000000000000000002",
        repo: "wevm/wagmi",
        issueNumber: 4120,
        amount: 300,
        contributionType: "enhancement",
        date: now - 26 * day,
        txHash:
          "0xb2c3d4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f8092",
      },
      {
        uid: "0xa11ce0000000000000000000000000000000000000000000000000000000003",
        repo: "shadcn-ui/ui",
        issueNumber: 5099,
        amount: 180,
        contributionType: "docs",
        date: now - 40 * day,
        txHash:
          "0xc3d4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f809203",
      },
      {
        uid: "0xa11ce0000000000000000000000000000000000000000000000000000000004",
        repo: "tanstack/query",
        issueNumber: 7788,
        amount: 360,
        contributionType: "bug",
        date: now - 55 * day,
        txHash:
          "0xe5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f8092031425",
      },
      {
        uid: "0xa11ce0000000000000000000000000000000000000000000000000000000005",
        repo: "prisma/prisma",
        issueNumber: 21033,
        amount: 200,
        contributionType: "enhancement",
        date: now - 70 * day,
        txHash:
          "0xf6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a3b4c5d6e7f809203142536",
      },
    ],
  },
};

export function getProfile(address: string): ContributorProfile {
  const key = address.toLowerCase();
  return (
    MOCK_PROFILES[key] ?? {
      address: address as `0x${string}`,
      handle: "",
      totalEarned: 0,
      contributions: 0,
      reposCount: 0,
      attestations: [],
    }
  );
}
