import { formatUnits } from "viem";

// 0x9f2c…a41b — short address for on-chain data (DESIGN.md §4.5).
export const truncateAddr = (a?: string) => {
  if (!a || a.length < 10) return a ?? "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

// 0x9f2c1a…a41b for tx hashes / rewardIds (a touch longer than an address).
export const truncateHash = (a?: string) => {
  if (!a || a.length < 14) return a ?? "";
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
};

// Whole-dollar display used in dense tables/eyebrows.
export const usd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// USDC has 6 decimals — format a bigint amount as a plain number string.
export const formatUsdc = (amount: bigint, decimals = 6) => {
  const n = Number(formatUnits(amount, decimals));
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Compact relative time, e.g. "3h ago", "in 5d".
export function timeFromNow(ts: number): string {
  const diff = ts * 1000 - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  let label: string;
  if (mins < 1) label = "just now";
  else if (mins < 60) label = `${mins}m`;
  else if (hrs < 24) label = `${hrs}h`;
  else label = `${days}d`;
  if (mins < 1) return label;
  return diff < 0 ? `${label} ago` : `in ${label}`;
}

// mm:ss / hh:mm:ss countdown from a number of seconds remaining.
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
