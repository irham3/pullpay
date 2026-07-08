import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

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

// ---- Domain helpers ----

// GitHub handle → payout wallet (PRD §30.5).
const mapKey = (handle: string) => `map:${handle.toLowerCase()}`;
export const setMapping = (handle: string, address: string) =>
  kvSet(mapKey(handle), address);
export const getMapping = (handle: string) =>
  kvGet<string>(mapKey(handle));

// repo#issue → rewardId, so a merge webhook can find the reward (nonce unknown
// otherwise). Registered by the maintainer at create time.
const issueKey = (repo: string, issue: number) =>
  `issue:${repo.toLowerCase()}#${issue}`;
export const setRewardForIssue = (repo: string, issue: number, rewardId: string) =>
  kvSet(issueKey(repo, issue), rewardId);
export const getRewardForIssue = (repo: string, issue: number) =>
  kvGet<string>(issueKey(repo, issue));

// GitHub App installation id per account owner (to post comments/checks).
const installKey = (owner: string) => `install:${owner.toLowerCase()}`;
export const setInstallation = (owner: string, installationId: number) =>
  kvSet(installKey(owner), installationId);
export const getInstallation = (owner: string) =>
  kvGet<number>(installKey(owner));

export const storeBackend = useUpstash ? "upstash" : "file";
