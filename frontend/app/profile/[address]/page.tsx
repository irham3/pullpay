import type { Metadata } from "next";
import { ProfileView } from "@/components/onchain/ProfileView";
import { truncateAddr } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `${truncateAddr(address)} — contributor reputation`,
    description: `On-chain contribution reputation built from EAS attestations for ${truncateAddr(address)}.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <ProfileView address={address} />;
}
