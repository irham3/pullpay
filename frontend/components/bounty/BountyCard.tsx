import Link from "next/link";
import type { Bounty } from "@/lib/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { ModeBadge } from "@/components/onchain/ModeBadge";
import { Badge } from "@/components/ui/Badge";
import { timeFromNow } from "@/lib/format";
import { LANG_COLORS } from "@/lib/languages";

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const live = bounty.status === "Verifying" || bounty.status === "Disputed";
  return (
    <Link
      href={`/reward/${bounty.id}`}
      className="group block rounded-[10px] border border-border bg-surface p-4 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-sm text-text">
            <span className="truncate">{bounty.repo}</span>
            <span className="text-muted">#{bounty.issueNumber}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">
            {bounty.issueTitle}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono tnum text-lg text-text">
            {bounty.amount.toLocaleString("en-US")}
          </div>
          <div className="text-[11px] text-muted">{bounty.token}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={bounty.status} live={live} />
        <ModeBadge mode={bounty.mode} />
        <Badge dot={LANG_COLORS[bounty.language] ?? "var(--muted)"}>
          {bounty.language}
        </Badge>
        <span className="ml-auto text-[11px] text-muted">
          {bounty.status === "Open" || bounty.status === "In Review"
            ? `closes ${timeFromNow(bounty.deadline)}`
            : `created ${timeFromNow(bounty.createdAt)}`}
        </span>
      </div>
    </Link>
  );
}
