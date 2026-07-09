"use client";

import * as React from "react";
import type { Mode } from "@/lib/types";
import type { UiStatus } from "@/lib/status";
import { BountyCard } from "./BountyCard";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { DEMO_MODE } from "@/lib/contracts/addresses";
import Link from "next/link";

type StatusFilter = "All" | "Open" | "Verifying" | "Paid" | "Disputed";
type ModeFilter = "All" | Mode;
type SortKey = "amount" | "recent" | "deadline";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Open", label: "Open" },
  { value: "Verifying", label: "Checking" },
  { value: "Paid", label: "Paid" },
  { value: "Disputed", label: "Disputed" },
];

export function BountyBoard() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("All");
  const [mode, setMode] = React.useState<ModeFilter>("All");
  const [lang, setLang] = React.useState<string>("All");
  const [sort, setSort] = React.useState<SortKey>("recent");

  const { rewards: allBounties, isLoading: onchainLoading } = useRewards();

  const languages = React.useMemo(
    () => ["All", ...Array.from(new Set(allBounties.map((b) => b.language)))],
    [allBounties]
  );

  const filtered = React.useMemo(() => {
    let list = allBounties.filter((b) => {
      if (
        q &&
        !`${b.repo} ${b.issueTitle} ${b.labels.join(" ")}`
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      if (status !== "All") {
        if (
          status === "Open" &&
          !["Open", "In Review", "Changes Requested", "Merged"].includes(
            b.status
          )
        )
          return false;
        if (status !== "Open" && b.status !== (status as UiStatus)) return false;
      }
      if (mode !== "All" && b.mode !== mode) return false;
      if (lang !== "All" && b.language !== lang) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount;
      if (sort === "deadline") return a.deadline - b.deadline;
      return b.createdAt - a.createdAt;
    });
    return list;
  }, [allBounties, q, status, mode, lang, sort]);

  const lockedAmount = allBounties
    .filter((b) =>
      ["Open", "In Review", "Changes Requested", "Merged", "Verifying"].includes(
        b.status
      )
    )
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              strokeWidth={1.5}
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search repo or issue"
              className="pl-9"
            />
          </div>
        </div>

        <FilterGroup label="Status">
          {STATUS_TABS.map((s) => (
            <FilterChip
              key={s.value}
              active={status === s.value}
              onClick={() => setStatus(s.value)}
            >
              {s.label}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Mode">
          {(["All", "Instant", "Safeguarded"] as ModeFilter[]).map((m) => (
            <FilterChip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </FilterChip>
          ))}
        </FilterGroup>

        <FilterGroup label="Language">
          {languages.map((l) => (
            <FilterChip key={l} active={lang === l} onClick={() => setLang(l)}>
              {l}
            </FilterChip>
          ))}
        </FilterGroup>
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">
            <span className="tnum text-text">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "reward" : "rewards"}
            <span className="mx-2 text-border">|</span>
            <span className="font-mono tnum text-text">
              ${lockedAmount.toLocaleString("en-US")}
            </span>{" "}
            locked
          </span>
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-[6px] border border-border bg-bg px-2 py-1 text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="recent">Newest</option>
              <option value="amount">Amount</option>
              <option value="deadline">Deadline</option>
            </select>
          </label>
        </div>

        {onchainLoading && allBounties.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center text-sm text-muted">
            Reading funded rewards...
          </div>
        ) : allBounties.length === 0 ? (
          <div className="rounded-[10px] border border-border bg-surface p-6">
            <p className="mb-5 text-center text-sm text-muted">
              {DEMO_MODE
                ? "No escrow is deployed on this network yet."
                : "No funded rewards on-chain yet."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Maintainer path */}
              <div className="flex flex-col gap-3 rounded-[8px] border border-[#8B5CF6]/20 bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] p-5">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#8B5CF6]/25 bg-bg text-accent">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M10.5 2.5a8 8 0 1 1 0 16 8 8 0 0 1 0-16z" strokeLinecap="round"/>
                      <path d="M10.5 6.5v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text">I&apos;m a Maintainer</div>
                    <div className="text-xs text-muted">I want to fund an issue</div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted">
                  Pick an open GitHub issue, lock USDC as a reward, and PullPay will
                  pay the contributor automatically when their PR is merged.
                </p>
                <Link
                  href="/create"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-[6px] bg-accent px-4 py-2 text-sm font-medium text-[#0B0B0C] transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  Create a reward →
                </Link>
              </div>

              {/* Contributor path */}
              <div className="flex flex-col gap-3 rounded-[8px] border border-border bg-bg p-5">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-muted">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M7 8l-4 4 4 4M13 8l4 4-4 4M11 4l-2 12" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text">I&apos;m a Contributor</div>
                    <div className="text-xs text-muted">I want to earn USDC</div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted">
                  Browse funded GitHub issues, open a PR, and receive USDC when it
                  gets merged. You pay zero gas to receive the payout.
                </p>
                <Link
                  href="/contributor"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-[6px] border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-2"
                >
                  Set up contributor profile →
                </Link>
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center text-sm text-muted">
            No rewards match these filters.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((b) => (
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
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-accent bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-text"
          : "border-border text-muted hover:text-text hover:bg-surface-2"
      )}
    >
      {children}
    </button>
  );
}
