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
import { Award, ExternalLink } from "lucide-react";

export default function ContributorPage() {
  const { address, isConnected } = useAccount();
  const { data: onchain = [] } = useOnchainRewards();
  const { data: profile } = useContributorProfile(address ?? "");

  const [workingIds, setWorkingIds] = React.useState<string[]>([]);
  const [local, setLocal] = React.useState<Bounty[]>([]);
  const [githubLinked, setGithubLinked] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load local flags on mount
    setWorkingIds(loadWorkingOn());
    setLocal(loadLocalRewards());
  }, []);

  React.useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)pullpay_gh=([^;]+)/);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read cookie on mount
    setGithubLinked(Boolean(m));
  }, []);

  const pool = React.useMemo(() => {
    const seen = new Set<string>();
    return [...onchain, ...local].filter((b) => {
      const key = b.id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
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
          Connect your wallet, link GitHub, and track payouts from merged PRs.
        </p>
        <ConnectButton />
        <Link
          href="/bounties"
          className="text-sm text-muted underline-offset-4 hover:text-text hover:underline"
        >
          Browse funded issues
        </Link>
      </main>
    );
  }

  // Cek apakah user masih baru (belum ada aktivitas apapun)
  const isNewUser = working.length === 0 && attestations.length === 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Contributor dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Link GitHub, work on funded issues, and receive USDC after merge.
          </p>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Earned">{usd(profile?.totalEarned ?? 0)}</StatCard>
            <StatCard label="Paid work">{profile?.contributions ?? 0}</StatCard>
            <StatCard label="Repos">{profile?.reposCount ?? 0}</StatCard>
          </div>

          {/* Onboarding checklist — hanya tampil saat user baru */}
          {isNewUser && (
            <div className="mt-8 overflow-hidden rounded-[10px] border border-border bg-surface">
              <div className="border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted">
                Get started — 4 steps to your first payout
              </div>
              <ol className="divide-y divide-border">
                <ChecklistItem
                  n={1}
                  done
                  label="Connect wallet"
                  detail="Your wallet is connected and ready to receive USDC."
                />
                <ChecklistItem
                  n={2}
                  done={githubLinked}
                  label="Link GitHub to this wallet"
                  detail={
                    githubLinked
                      ? "GitHub linked — payouts will go to this wallet."
                      : "PullPay uses this to send USDC to the right wallet after your PR is merged."
                  }
                  urgent={!githubLinked}
                  action={
                    !githubLinked
                      ? { href: "/api/github/login", label: "Link GitHub" }
                      : undefined
                  }
                />
                <ChecklistItem
                  n={3}
                  done={false}
                  label="Browse funded issues"
                  detail="Pick an open issue with a USDC reward attached and start working."
                  action={{ href: "/bounties", label: "Browse rewards", internal: true }}
                />
                <ChecklistItem
                  n={4}
                  done={false}
                  label="Open a PR and get it merged"
                  detail="After merge, PullPay verifies it and sends USDC directly to your wallet. You pay zero gas."
                />
              </ol>
            </div>
          )}

          {/* Marked work — tampil saat ada aktivitas */}
          {!isNewUser && (
            <div className="mt-8">
              <h2 className="text-sm font-medium text-text">Marked work</h2>
              <p className="mt-1 text-xs text-muted">
                Issues you marked for yourself. Payment still requires a merged PR
                and a completed payout.
              </p>
              {working.length === 0 ? (
                <div className="mt-3 rounded-[10px] border border-dashed border-border p-8 text-center text-sm text-muted">
                  Nothing yet.{" "}
                  <Link href="/bounties" className="text-text hover:underline">
                    Find a funded issue
                  </Link>
                  .
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {working.map((b) => (
                    <BountyCard
                      key={b.id}
                      repoName={b.repo}
                      issueTitle={b.issueTitle}
                      bountyAmount={b.amount}
                      walletAddress={b.contributor ?? b.maintainer}
                      issueNumber={b.issueNumber}
                      labels={[b.language, ...b.labels]}
                      mode={b.mode}
                      status={b.status}
                      href={`/reward/${b.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paid work */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" strokeWidth={1.5} />
              <h2 className="text-sm font-medium text-text">Paid work</h2>
            </div>
            {attestations.length === 0 ? (
              !isNewUser && (
                <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-sm text-muted">
                  {DEMO_MODE
                    ? "No escrow deployed."
                    : "No paid work yet. It appears here after payout completes."}
                </div>
              )
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
                          {a.date ? timeFromNow(a.date) : "-"}
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
            <div className="font-medium text-text">How to get paid</div>
            <ol className="mt-2 space-y-1.5 text-muted">
              <li>1. Link GitHub to this wallet.</li>
              <li>2. Open a PR for a funded issue.</li>
              <li>3. After merge, receive USDC. You pay no gas.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}

// Sub-komponen: satu langkah onboarding di checklist
function ChecklistItem({
  n,
  done,
  label,
  detail,
  urgent,
  action,
}: {
  n: number;
  done: boolean;
  label: string;
  detail: string;
  urgent?: boolean;
  action?: { href: string; label: string; internal?: boolean };
}) {
  return (
    <li
      className={`flex gap-4 px-5 py-4 transition-colors ${
        urgent ? "bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]" : ""
      }`}
    >
      {/* Badge nomor / centang */}
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
          done
            ? "border-ok text-ok"
            : urgent
              ? "border-accent text-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
              : "border-border text-muted"
        }`}
      >
        {done ? (
          <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          n
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm font-medium ${
              done ? "text-muted line-through decoration-muted/50" : "text-text"
            }`}
          >
            {label}
          </span>
          {urgent && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
              required
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-5 text-muted">{detail}</p>
        {action && !done && (
          <div className="mt-2">
            {action.internal ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                {action.label} →
              </Link>
            ) : (
              <a
                href={action.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                {action.label} →
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
