import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BountyBoard } from "@/components/bounty/BountyBoard";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Browse funded GitHub issues and pick work to contribute to.",
};

export const revalidate = 60;

export default function BountiesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Funded rewards
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted">
            Find funded GitHub issues. Open a PR, get it merged, and receive
            USDC when the payout completes.
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
