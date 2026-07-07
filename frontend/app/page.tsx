import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="flex-1 dot-grid flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-text">
          Trust-minimized open source rewards.
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto">
          Merge the PR, get paid in USDC. Verified without an intermediary, settled without gas, recorded as on-chain reputation.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/create">Create Reward</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/bounties">Explore Bounties</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
