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

// --- "Working on this" — an optional, off-chain, non-binding signal a
// contributor sets to reduce duplicate work. Never a gate to payment (the model
// stays permissionless: anyone can just open a PR). Kept per-browser for now;
// moves to the GitHub App in Phase 2.
const WORKING_KEY = "pullpay-working-on";

export function loadWorkingOn(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WORKING_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

export function isWorkingOn(id: string): boolean {
  return loadWorkingOn().some((x) => x.toLowerCase() === id.toLowerCase());
}

export function toggleWorkingOn(id: string): boolean {
  const all = loadWorkingOn();
  const exists = all.some((x) => x.toLowerCase() === id.toLowerCase());
  const next = exists
    ? all.filter((x) => x.toLowerCase() !== id.toLowerCase())
    : [id, ...all];
  localStorage.setItem(WORKING_KEY, JSON.stringify(next));
  return !exists;
}
