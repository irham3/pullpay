import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { StoredReward } from "@/lib/types";
import type { UiStatus } from "@/lib/status";

// Unified key–value store: Upstash Redis when configured (works on Vercel
// serverless), else a local JSON file for dev. Same API either way.
// Accepts both the Vercel-injected names (KV_REST_API_*) and Upstash's own
// (UPSTASH_REDIS_REST_*), so the same code works locally and on Vercel.
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const useUpstash = Boolean(kvUrl) && Boolean(kvToken);
const redis = useUpstash ? new Redis({ url: kvUrl!, token: kvToken! }) : null;

const FILE = path.join(process.cwd(), ".pullpay-store.json");

async function fileRead(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}
async function fileWrite(data: Record<string, unknown>) {
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

async function kvGet<T>(key: string): Promise<T | null> {
  if (redis) return (await redis.get<T>(key)) ?? null;
  const data = await fileRead();
  return (data[key] as T) ?? null;
}
async function kvSet<T>(key: string, value: T): Promise<void> {
  if (redis) {
    await redis.set(key, value);
    return;
  }
  const data = await fileRead();
  data[key] = value;
  await fileWrite(data);
}
async function kvDel(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  const data = await fileRead();
  delete data[key];
  await fileWrite(data);
}

// ---- Domain helpers ----

// GitHub handle → payout wallet (PRD §30.5).
const mapKey = (handle: string) => `map:${handle.toLowerCase()}`;
export const setMapping = (handle: string, address: string) =>
  kvSet(mapKey(handle), address);
export const getMapping = (handle: string) =>
  kvGet<string>(mapKey(handle));

// Short-lived GitHub user sessions. The browser only receives an opaque,
// httpOnly session id; the OAuth token stays server-side for repo permission
// checks on write actions.
export interface GithubSession {
  login: string;
  accessToken: string;
  expiresAt: number;
}

const githubSessionKey = (id: string) => `gh-session:${id}`;
export const setGithubSession = (id: string, session: GithubSession) =>
  kvSet(githubSessionKey(id), session);
export const getGithubSession = (id: string) =>
  kvGet<GithubSession>(githubSessionKey(id));
export const deleteGithubSession = (id: string) =>
  kvDel(githubSessionKey(id));

// repo#issue → rewardId, so a merge webhook can find the reward (nonce unknown
// otherwise). Registered by the maintainer at create time.
const issueKey = (repo: string, issue: number) =>
  `issue:${repo.toLowerCase()}#${issue}`;
export const setRewardForIssue = (repo: string, issue: number, rewardId: string) =>
  kvSet(issueKey(repo, issue), rewardId);
export const getRewardForIssue = (repo: string, issue: number) =>
  kvGet<string>(issueKey(repo, issue));

// ---- Rewards (shared, cross-user) ----
// The board/detail pages used to read rewards from per-browser localStorage, so
// each user only ever saw rewards they created themselves. Rewards now live in
// the shared KV store so every visitor sees every funded reward, and the GitHub
// webhook can advance a reward's "soft" status (In Review / Merged) that on-chain
// enums cannot represent. On-chain remains the source of truth for money.
const rewardKey = (id: string) => `reward:${id.toLowerCase()}`;
const REWARDS_INDEX = "rewards:index";

async function addToIndex(id: string): Promise<void> {
  const ids = (await kvGet<string[]>(REWARDS_INDEX)) ?? [];
  const low = id.toLowerCase();
  if (!ids.some((x) => x.toLowerCase() === low)) {
    await kvSet(REWARDS_INDEX, [low, ...ids]);
  }
}

// Upsert that keeps whatever the existing record already knows (GitHub metadata,
// soft status) unless the caller explicitly provides a fresher value.
export async function saveReward(r: StoredReward): Promise<void> {
  const existing = await kvGet<StoredReward>(rewardKey(r.id));
  const record = {
    ...existing,
    ...r,
    updatedAt: Math.floor(Date.now() / 1000),
  };
  await kvSet(rewardKey(r.id), record);
  await addToIndex(r.id);
}

export const getStoredReward = (id: string) =>
  kvGet<StoredReward>(rewardKey(id));

// Merge a partial update into an existing stored reward. No-op if unknown, so a
// webhook for a reward created on a different environment won't resurrect a ghost.
export async function patchStoredReward(
  id: string,
  patch: Partial<StoredReward>
): Promise<StoredReward | null> {
  const existing = await getStoredReward(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updatedAt: Math.floor(Date.now() / 1000) };
  await kvSet(rewardKey(id), next);
  return next;
}

export const setRewardStatus = (id: string, status: UiStatus) =>
  patchStoredReward(id, { status });

export async function listStoredRewards(): Promise<StoredReward[]> {
  const ids = (await kvGet<string[]>(REWARDS_INDEX)) ?? [];
  const records = await Promise.all(ids.map((id) => getStoredReward(id)));
  return records.filter((r): r is StoredReward => Boolean(r));
}

// ---- Indexer bookkeeping ----
// The server-side chain indexer scans RewardCreated/RewardSettled incrementally;
// these keys remember how far it got and when it last ran, so the browser never
// has to issue eth_getLogs itself (public RPCs reject wide ranges).
const SCAN_BLOCK_KEY = "rewards:lastScannedBlock";
const SCAN_TS_KEY = "rewards:lastSyncTs";

export async function getLastScannedBlock(): Promise<bigint | null> {
  const v = await kvGet<string>(SCAN_BLOCK_KEY);
  return v ? BigInt(v) : null;
}
export const setLastScannedBlock = (block: bigint) =>
  kvSet(SCAN_BLOCK_KEY, block.toString());

export const getLastSyncTs = () => kvGet<number>(SCAN_TS_KEY);
export const setLastSyncTs = (ts: number) => kvSet(SCAN_TS_KEY, ts);

// ---- Contributor payouts (from RewardSettled events) ----
// Populated by the indexer so contributor profiles come from the shared store
// instead of a per-browser log scan.
export interface SettledPayout {
  rewardId: `0x${string}`;
  repo: string;
  issueNumber: number;
  amount: number; // human USDC units
  attestationUID: `0x${string}`;
  txHash: `0x${string}`;
  date: number; // unix seconds (block timestamp)
}

const settledKey = (addr: string) => `settled:${addr.toLowerCase()}`;

export async function addSettledPayout(
  contributor: string,
  payout: SettledPayout
): Promise<void> {
  const all = (await kvGet<SettledPayout[]>(settledKey(contributor))) ?? [];
  if (all.some((p) => p.txHash === payout.txHash && p.rewardId === payout.rewardId))
    return;
  await kvSet(settledKey(contributor), [payout, ...all]);
}

export const getSettledPayouts = (contributor: string) =>
  kvGet<SettledPayout[]>(settledKey(contributor)).then((v) => v ?? []);

// GitHub App installation id per account owner (to post comments/checks).
const installKey = (owner: string) => `install:${owner.toLowerCase()}`;
export const setInstallation = (owner: string, installationId: number) =>
  kvSet(installKey(owner), installationId);
export const getInstallation = (owner: string) =>
  kvGet<number>(installKey(owner));

export const storeBackend = useUpstash ? "upstash" : "file";
