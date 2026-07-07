import type { Metadata } from "next";
import { getBounty } from "@/lib/mock";
import { RewardDetailView } from "@/components/onchain/RewardDetailView";
import { RewardDetailClient } from "@/components/onchain/RewardDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const b = getBounty(id);
  if (!b) return { title: "Reward" };
  return {
    title: `${b.repo} #${b.issueNumber} — ${b.amount} USDC`,
    description: b.issueTitle,
  };
}

export default async function RewardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bounty = getBounty(id);

  // Demo bounties render on the server (SSR). Anything else is a real reward —
  // load it client-side from the local cache or on-chain.
  if (bounty) return <RewardDetailView bounty={bounty} />;
  return <RewardDetailClient id={id as `0x${string}`} />;
}
