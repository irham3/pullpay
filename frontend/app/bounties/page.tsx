import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BountyBoard } from "@/components/bounty/BountyBoard";

export const metadata: Metadata = {
  title: "Bounty board",
  description:
    "Browse on-chain-funded open source bounties. Every listing is a real, verifiable escrow on Optimism.",
};

// ISR: the board is a discovery surface (PRD §27) — SSR/ISR for indexability.
export const revalidate = 60;

export default function BountiesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Bounty board
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted">
            On-chain-funded open source work. Every bounty here is provably
            backed — verify the escrow before you start.
          </p>
        </div>
        <Button asChild>
          <Link href="/create">Create reward</Link>
        </Button>
      </div>

      <BountyBoard />
    </main>
  );
}
