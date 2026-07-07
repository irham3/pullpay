"use client";

import type { Bounty } from "./types";

// Without a subgraph, we remember rewards created in this browser so the board,
// dashboard, and detail pages can show them (enriched with GitHub metadata
// captured at create time). Purely a convenience cache over on-chain truth.
const KEY = "pullpay-rewards";

export function saveLocalReward(b: Bounty) {
  if (typeof window === "undefined") return;
  const all = loadLocalRewards();
  const next = [b, ...all.filter((x) => x.id.toLowerCase() !== b.id.toLowerCase())];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function loadLocalRewards(): Bounty[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Bounty[];
  } catch {
    return [];
  }
}

export function getLocalReward(id: string): Bounty | undefined {
  return loadLocalRewards().find((b) => b.id.toLowerCase() === id.toLowerCase());
}

// Patch stored fields (e.g. status, contributor) after a settle/refund.
export function patchLocalReward(id: string, patch: Partial<Bounty>) {
  const all = loadLocalRewards();
  const idx = all.findIndex((b) => b.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch };
  localStorage.setItem(KEY, JSON.stringify(all));
}
