import Link from "next/link";
import {
  CheckCircle2,
  CircleDot,
  GitPullRequest,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BountyCardProps = {
  repoName: string;
  issueTitle: string;
  bountyAmount: number | string;
  walletAddress: string;
  href?: string;
  issueNumber?: number;
  labels?: string[];
  mode?: string;
  status?: string;
  className?: string;
};

export function BountyCard({
  repoName,
  issueTitle,
  bountyAmount,
  walletAddress,
  href,
  issueNumber,
  labels = [],
  mode,
  status = "Open",
  className,
}: BountyCardProps) {
  const rewardAmount = formatRewardAmount(bountyAmount);
  const shownLabels = [...new Set([mode, ...labels].filter(Boolean))].slice(0, 4);
  const cardClassName = cn(
    "group relative block h-full overflow-hidden rounded-lg border border-white/10 bg-[#1E2329]/82 p-5 text-left text-[#F4F7FB] backdrop-blur-md transition-all duration-200",
    "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#8B5CF6]/70 before:to-transparent before:opacity-0 before:transition-opacity",
    "after:absolute after:inset-y-0 after:left-0 after:w-1 after:bg-gradient-to-b after:from-[#8B5CF6] after:via-[#A78BFA] after:to-transparent after:opacity-60",
    "hover:-translate-y-1 hover:border-[#8B5CF6]/55 hover:shadow-[0_0_32px_rgba(139,92,246,0.22)] hover:before:opacity-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]",
    className
  );

  const content = (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(139,92,246,0.12),transparent_34%,rgba(139,92,246,0.06))] opacity-70" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-sm text-[#AAB4C0]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-[#0B0F14] text-[11px] text-[#8B5CF6]">
                {repoInitial(repoName)}
              </span>
              <span className="truncate">{repoName}</span>
              {issueNumber && (
                <span className="shrink-0 text-[#6F7885]">#{issueNumber}</span>
              )}
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        <h3 className="mt-4 line-clamp-3 text-base font-semibold leading-6 text-[#F4F7FB]">
          {issueTitle}
        </h3>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {shownLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-[#0B0F14]/55 px-2 py-1 font-mono text-[11px] text-[#AAB4C0]"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-4">
          <div className="flex items-start gap-2 text-xs text-[#AAB4C0]">
            <Wallet
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8B5CF6]"
              strokeWidth={1.75}
            />
            <span className="break-all font-mono">{walletAddress}</span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#AAB4C0]">
                reward locked
              </div>
              <div className="mt-1 font-mono text-3xl font-semibold tracking-normal text-[#F4F7FB] drop-shadow-[0_0_18px_rgba(139,92,246,0.45)]">
                {rewardAmount}
              </div>
            </div>

            <div className="hidden rounded-md border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-2.5 py-2 sm:block">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#C4B5FD]">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
                proof after pay
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[11px] text-[#AAB4C0]">
          <span className="flex items-center gap-1.5">
            <GitPullRequest className="h-3.5 w-3.5 text-[#8B5CF6]" />
            merged PR pays
          </span>
          <span className="flex items-center gap-1.5 text-[#8B5CF6]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            contributor gasless
          </span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}

function StatusBadge({ status }: { status: string }) {
  const verified = status === "Paid" || status === "Verifying";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]",
        verified
          ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#C4B5FD]"
          : "border-[#8B5CF6]/35 bg-[#8B5CF6]/10 text-[#C4B5FD]"
      )}
    >
      <CircleDot
        className={cn(
          "h-3 w-3",
          "text-[#8B5CF6]"
        )}
        strokeWidth={2.25}
      />
      {status}
    </span>
  );
}

function repoInitial(repoName: string) {
  const repo = repoName.split("/").pop() ?? repoName;
  return repo.slice(0, 2).toUpperCase();
}

function formatRewardAmount(value: number | string) {
  if (typeof value === "number") {
    return `${formatCurrency(value)} USDC`;
  }

  const trimmed = value.trim();
  if (/usdc/i.test(trimmed)) return trimmed;

  const numeric = Number(trimmed.replace(/[$,]/g, ""));
  if (!Number.isNaN(numeric) && trimmed.length > 0) {
    return `${formatCurrency(numeric)} USDC`;
  }

  return trimmed.startsWith("$") ? `${trimmed} USDC` : `$${trimmed} USDC`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
