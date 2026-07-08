import type { Metadata } from "next";
import { RewardDetailClient } from "@/components/onchain/RewardDetailClient";

export const metadata: Metadata = { title: "Reward" };

export default async function RewardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Always resolve from chain / local cache — no sample data.
  return <RewardDetailClient id={id as `0x${string}`} />;
}
