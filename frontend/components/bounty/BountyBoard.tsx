"use client";

import * as React from "react";
import type { Bounty, Mode } from "@/lib/types";
import type { UiStatus } from "@/lib/status";
import { BountyCard } from "./BountyCard";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { loadLocalRewards } from "@/lib/localStore";
import { useOnchainRewards } from "@/hooks/useOnchainRewards";
import { DEMO_MODE } from "@/lib/contracts/addresses";
import Link from "next/link";

type StatusFilter = "All" | "Open" | "Verifying" | "Paid" | "Disputed";
type ModeFilter = "All" | Mode;
type SortKey = "amount" | "recent" | "deadline";

const STATUS_TABS: StatusFilter[] = [
  "All",
  "Open",
  "Verifying",
  "Paid",
  "Disputed",
];

export function BountyBoard() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("All");
  const [mode, setMode] = React.useState<ModeFilter>("All");
  const [lang, setLang] = React.useState<string>("All");
  const [sort, setSort] = React.useState<SortKey>("recent");

  // Merge in rewards created in this browser (no subgraph yet), newest first.
  const [local, setLocal] = React.useState<Bounty[]>([]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load local cache on mount
    setLocal(loadLocalRewards());
  }, []);

  // Real rewards indexed from RewardCreated logs — no sample data, ever.
  const { data: onchain = [], isLoading: onchainLoading } = useOnchainRewards();

  const allBounties = React.useMemo(() => {
    const merged = [...onchain, ...local];
    const seen = new Set<string>();
    return merged.filter((b) => {
      const key = b.id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [onchain, local]);

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
        if (status === "Open" && !["Open", "In Review", "Changes Requested", "Merged"].includes(b.status))
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

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Filter rail */}
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
              key={s}
              active={status === s}
              onClick={() => setStatus(s)}
            >
              {s}
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

      {/* Results */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">
            <span className="tnum text-text">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "bounty" : "bounties"}
            <span className="mx-2 text-border">·</span>
            <span className="font-mono tnum text-text">
              $
              {allBounties
                .filter((b) =>
                  ["Open", "In Review", "Changes Requested", "Merged", "Verifying"].includes(
                    b.status
                  )
                )
                .reduce((s, b) => s + b.amount, 0)
                .toLocaleString("en-US")}
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
            Reading rewards from the chain…
          </div>
        ) : allBounties.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center">
            <p className="text-sm text-text">No funded bounties yet.</p>
            <p className="mt-1 text-sm text-muted">
              {DEMO_MODE
                ? "No escrow is deployed on this network."
                : "Be the first — fund a reward against a real GitHub issue."}
            </p>
            {!DEMO_MODE && (
              <Link
                href="/create"
                className="mt-4 inline-flex rounded-[6px] bg-accent px-3.5 py-2 text-sm font-medium text-[#0B0B0C] hover:bg-accent-hover"
              >
                Create a reward
              </Link>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center text-sm text-muted">
            No bounties match these filters.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((b) => (
              <BountyCard key={b.id} bounty={b} />
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
