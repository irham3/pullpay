import Link from "next/link";
import type { Bounty } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { ModeBadge } from "@/components/onchain/ModeBadge";
import { Badge } from "@/components/ui/Badge";
import { ProofPanel } from "@/components/onchain/ProofPanel";
import { Lifecycle } from "@/components/onchain/Lifecycle";
import { DisputePanel } from "@/components/onchain/DisputePanel";
import { RewardActions } from "@/components/onchain/RewardActions";
import { StatusControl } from "@/components/onchain/StatusControl";
import { YamlPanel } from "@/components/onchain/YamlPanel";
import { AddressChip } from "@/components/onchain/AddressChip";
import { STATUS_META } from "@/lib/status";
import { LANG_COLORS } from "@/lib/languages";
import { timeFromNow } from "@/lib/format";
import { ArrowLeft, ExternalLink, GitPullRequest } from "lucide-react";

export function RewardDetailView({
  bounty,
  assertionId,
}: {
  bounty: Bounty;
  assertionId?: `0x${string}`;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <Link
        href="/bounties"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Rewards
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill
              status={bounty.status}
              live={bounty.status === "Verifying" || bounty.status === "Disputed"}
            />
            <ModeBadge mode={bounty.mode} />
            <Badge dot={LANG_COLORS[bounty.language] ?? "var(--muted)"}>
              {bounty.language}
            </Badge>
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-text sm:text-2xl">
            {bounty.issueTitle}
          </h1>
          <a
            href={`https://github.com/${bounty.repo}/issues/${bounty.issueNumber}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-sm text-muted hover:text-text"
          >
            {bounty.repo} #{bounty.issueNumber}
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          </a>
        </div>
        <div className="text-right">
          <div className="font-mono tnum text-3xl text-text">
            {bounty.amount.toLocaleString("en-US")}
          </div>
          <div className="text-xs text-muted">{bounty.token} reward</div>
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-sm text-muted">
        {STATUS_META[bounty.status].description}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <ProofPanel bounty={bounty} />

          {bounty.prNumber && (
            <div className="rounded-[10px] border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text">
                <GitPullRequest className="h-4 w-4 text-accent" strokeWidth={1.5} />
                Linked pull request
              </div>
              <div className="flex items-center justify-between text-sm">
                <a
                  href={`https://github.com/${bounty.repo}/pull/${bounty.prNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-text hover:text-accent"
                >
                  {bounty.repo} #{bounty.prNumber}
                </a>
                {bounty.contributorHandle && (
                  <span className="text-muted">
                    by <span className="text-text">@{bounty.contributorHandle}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <DisputePanel bounty={bounty} />

          {["Open", "In Review", "Changes Requested", "Merged"].includes(
            bounty.status
          ) && <YamlPanel bounty={bounty} />}

          <div className="rounded-[10px] border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 text-sm font-medium text-text">
              Reward details
            </div>
            <dl className="divide-y divide-border text-sm">
              <MetaRow label="Mode">
                <ModeBadge mode={bounty.mode} />
              </MetaRow>
              {bounty.bond > 0 && (
                <MetaRow label="Bond">
                  <span className="font-mono tnum text-text">
                    {bounty.bond} {bounty.token}
                  </span>
                </MetaRow>
              )}
              <MetaRow label="Deadline">
                <span className="text-text">{timeFromNow(bounty.deadline)}</span>
              </MetaRow>
              <MetaRow label="Created">
                <span className="text-text">{timeFromNow(bounty.createdAt)}</span>
              </MetaRow>
              {bounty.contributor && (
                <MetaRow label="Contributor">
                  <AddressChip value={bounty.contributor} />
                </MetaRow>
              )}
              {bounty.labels.length > 0 && (
                <MetaRow label="Labels">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {bounty.labels.map((l) => (
                      <Badge key={l}>{l}</Badge>
                    ))}
                  </div>
                </MetaRow>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <Lifecycle status={bounty.status} />
          <div className="rounded-[10px] border border-border bg-surface p-5">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted">
              What you can do
            </div>
            <div className="space-y-4">
              <StatusControl bounty={bounty} />
              <RewardActions bounty={bounty} assertionId={assertionId} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
