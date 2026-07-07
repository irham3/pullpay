"use client";

import * as React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { MOCK_BOUNTIES } from "@/lib/mock";
import { loadLocalRewards } from "@/lib/localStore";
import { useOnchainRewards } from "@/hooks/useOnchainRewards";
import type { Bounty } from "@/lib/types";
import { BountyCard } from "@/components/bounty/BountyCard";
import { StatCard } from "@/components/onchain/StatCard";
import { LinkGithubCard } from "@/components/onchain/LinkGithubCard";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ConnectButton } from "@/components/layout/ConnectButton";
import { useUsdcBalance } from "@/hooks/usePullPay";
import { DEMO_MODE, USDC_DECIMALS } from "@/lib/contracts/addresses";
import { formatUnits } from "viem";

type Tab = "funded" | "toyou" | "all";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useUsdcBalance();
  const [tab, setTab] = React.useState<Tab>(DEMO_MODE ? "all" : "funded");

  const [local, setLocal] = React.useState<Bounty[]>([]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load local cache on mount
    setLocal(loadLocalRewards());
  }, []);

  const { data: onchain = [] } = useOnchainRewards();

  const all = React.useMemo(() => {
    const base = DEMO_MODE ? MOCK_BOUNTIES : [];
    const merged = [...onchain, ...local, ...base];
    const seen = new Set<string>();
    return merged.filter((b) => {
      const key = b.id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [onchain, local]);

  const lower = address?.toLowerCase();
  const funded = all.filter((b) => b.maintainer.toLowerCase() === lower);
  const toYou = all.filter((b) => b.contributor?.toLowerCase() === lower);

  const list = tab === "funded" ? funded : tab === "toyou" ? toYou : all;

  const totalFunded = funded.reduce((s, b) => s + b.amount, 0);
  const totalEarned = toYou
    .filter((b) => b.status === "Paid")
    .reduce((s, b) => s + b.amount, 0);

  if (!isConnected) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Your dashboard
        </h1>
        <p className="max-w-sm text-sm text-muted">
          Connect a wallet to see the rewards you&apos;ve funded and the payouts
          headed your way.
        </p>
        <ConnectButton />
        <Link
          href="/bounties"
          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
        >
          or browse the bounty board
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Dashboard
        </h1>
        <Button asChild>
          <Link href="/create">Create reward</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="USDC balance">
          {balance !== undefined
            ? Number(formatUnits(balance, USDC_DECIMALS)).toLocaleString("en-US")
            : DEMO_MODE
              ? "—"
              : "0"}
        </StatCard>
        <StatCard label="You funded">
          ${totalFunded.toLocaleString("en-US")}
        </StatCard>
        <StatCard label="You earned">
          ${totalEarned.toLocaleString("en-US")}
        </StatCard>
        <StatCard label="Active rewards">
          {funded.filter((b) =>
            ["Open", "In Review", "Verifying"].includes(b.status)
          ).length}
        </StatCard>
      </div>

      {/* Contributor identity */}
      <div className="mt-6 max-w-xl">
        <LinkGithubCard />
      </div>

      {/* Tabs */}
      <div className="mt-8 max-w-md">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          segments={[
            { value: "funded", label: "Funded by you" },
            { value: "toyou", label: "Rewards to you" },
            { value: "all", label: "All activity" },
          ]}
        />
      </div>

      {DEMO_MODE && tab !== "all" && (
        <p className="mt-4 text-xs text-muted">
          Demo mode — this filters sample data by your connected address, so
          these tabs are empty until a real escrow is deployed. Try “All
          activity”.
        </p>
      )}

      <div className="mt-5">
        {list.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center text-sm text-muted">
            {tab === "funded"
              ? "You haven’t funded any rewards yet."
              : "No rewards are headed your way yet."}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <BountyCard key={b.id} bounty={b} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
