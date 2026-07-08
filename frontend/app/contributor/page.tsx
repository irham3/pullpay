"use client";

import * as React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { loadLocalRewards, loadWorkingOn } from "@/lib/localStore";
import { useOnchainRewards } from "@/hooks/useOnchainRewards";
import { useContributorProfile } from "@/hooks/useContributorProfile";
import { DEMO_MODE } from "@/lib/contracts/addresses";
import { usd, timeFromNow } from "@/lib/format";
import { explorerTx } from "@/lib/explorer";
import type { Bounty } from "@/lib/types";
import { BountyCard } from "@/components/bounty/BountyCard";
import { StatCard } from "@/components/onchain/StatCard";
import { LinkGithubCard } from "@/components/onchain/LinkGithubCard";
import { ConnectButton } from "@/components/layout/ConnectButton";
import { RoleTabs } from "@/components/layout/RoleTabs";
import { Award, ExternalLink } from "lucide-react";

export default function ContributorPage() {
  const { address, isConnected } = useAccount();
  const { data: onchain = [] } = useOnchainRewards();
  const { data: profile } = useContributorProfile(address ?? "");

  const [workingIds, setWorkingIds] = React.useState<string[]>([]);
  const [local, setLocal] = React.useState<Bounty[]>([]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load local flags on mount
    setWorkingIds(loadWorkingOn());
    setLocal(loadLocalRewards());
  }, []);

  const pool = React.useMemo(() => {
    const seen = new Set<string>();
    return [...onchain, ...local].filter((b) => {
      const k = b.id.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [onchain, local]);

  const working = pool.filter((b) =>
    workingIds.some((x) => x.toLowerCase() === b.id.toLowerCase())
  );
  const attestations = profile?.attestations ?? [];

  if (!isConnected) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Contributor
        </h1>
        <p className="max-w-sm text-sm text-muted">
          Connect your wallet to link your GitHub, track work, and see your
          earnings & reputation.
        </p>
        <ConnectButton />
        <Link
          href="/bounties"
          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
        >
          or browse open bounties
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <RoleTabs />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Your contributions
          </h1>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Earned">{usd(profile?.totalEarned ?? 0)}</StatCard>
            <StatCard label="Paid contributions">
              {profile?.contributions ?? 0}
            </StatCard>
            <StatCard label="Repositories">{profile?.reposCount ?? 0}</StatCard>
          </div>

          {/* Working on (local, non-binding signal) */}
          <div className="mt-8">
            <h2 className="text-sm font-medium text-text">Working on</h2>
            <p className="mt-1 text-xs text-muted">
              Bounties you flagged. Just a signal to avoid duplicate work — you
              still get paid by opening a PR, no permission needed.
            </p>
            {working.length === 0 ? (
              <div className="mt-3 rounded-[10px] border border-dashed border-border p-8 text-center text-sm text-muted">
                Nothing yet.{" "}
                <Link href="/bounties" className="text-text hover:underline">
                  Find a bounty
                </Link>{" "}
                and mark it.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {working.map((b) => (
                  <BountyCard key={b.id} bounty={b} />
                ))}
              </div>
            )}
          </div>

          {/* Reputation */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <h2 className="text-sm font-medium text-text">
                Reputation (EAS)
              </h2>
            </div>
            {attestations.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-sm text-muted">
                {DEMO_MODE
                  ? "No escrow deployed."
                  : "No paid contributions yet — they appear here once a reward settles."}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[10px] border border-border bg-surface">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {attestations.map((a) => (
                      <tr key={a.txHash + a.issueNumber}>
                        <td className="px-4 py-3 font-mono text-text">
                          {a.repo}{" "}
                          <span className="text-muted">#{a.issueNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tnum text-text">
                          {usd(a.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted">
                          {a.date ? timeFromNow(a.date) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={explorerTx(a.txHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-muted hover:text-text"
                          >
                            tx
                            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <LinkGithubCard />
          <div className="rounded-[10px] border border-border bg-surface p-5 text-sm">
            <div className="font-medium text-text">Get paid</div>
            <ol className="mt-2 space-y-1.5 text-muted">
              <li>1. Link your GitHub above.</li>
              <li>2. Open a PR that resolves the issue.</li>
              <li>3. On merge, USDC lands in your wallet — no gas.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
