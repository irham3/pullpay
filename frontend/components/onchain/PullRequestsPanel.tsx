"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import type { Bounty, PullRequestRef } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GitMerge, Loader2, ExternalLink, GitPullRequest } from "lucide-react";

// Reads the contributor's verified GitHub handle (set by OAuth) and whether it's
// linked to a wallet. Claiming a payout requires this link — the contributor
// must connect GitHub↔wallet before they can be paid.
function useGithubLink() {
  const [handle, setHandle] = React.useState<string | null>(null);
  const [linkedAddress, setLinkedAddress] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)pullpay_gh=([^;]+)/);
    const h = m ? decodeURIComponent(m[1]) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read verified handle on mount
    setHandle(h);
    if (!h) {
      setChecked(true);
      return;
    }
    let ignore = false;
    fetch(`/api/link?handle=${encodeURIComponent(h)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!ignore) {
          setLinkedAddress(d.address ?? null);
          setChecked(true);
        }
      })
      .catch(() => !ignore && setChecked(true));
    return () => {
      ignore = true;
    };
  }, []);

  return { handle, linkedAddress, checked };
}

// The field of PRs competing for a reward. Contributors link their PR by
// referencing the issue; the maintainer's only action is merging on GitHub —
// that triggers payout automatically. If the winner hadn't linked a wallet at
// merge time, they link + claim here.
export function PullRequestsPanel({ bounty }: { bounty: Bounty }) {
  const { address } = useAccount();
  const qc = useQueryClient();
  const link = useGithubLink();
  const isMaintainer =
    address?.toLowerCase() === bounty.maintainer.toLowerCase();
  const prs = bounty.prs ?? [];
  const alreadyPaid = ["Paid", "Verifying", "Refunded", "Rejected"].includes(
    bounty.status
  );

  const refresh = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["server-rewards"] });
    qc.invalidateQueries({ queryKey: ["server-reward", bounty.id.toLowerCase()] });
  }, [qc, bounty.id]);

  return (
    <div className="rounded-[10px] border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium text-text">
        <GitPullRequest className="h-4 w-4 text-accent" strokeWidth={1.5} />
        Pull requests
        {prs.length > 0 && (
          <span className="ml-1 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted">
            {prs.length}
          </span>
        )}
      </div>

      {prs.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted">
          No linked pull requests yet. A PR that says{" "}
          <span className="font-mono text-text">closes #{bounty.issueNumber}</span>{" "}
          shows up here automatically.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {prs.map((pr) => (
            <PrRow
              key={pr.number}
              pr={pr}
              bounty={bounty}
              isMaintainer={isMaintainer}
              alreadyPaid={alreadyPaid}
              link={link}
              walletConnected={Boolean(address)}
              onDone={refresh}
            />
          ))}
        </ul>
      )}

      {/* Contributor path: link the PR you opened to this reward. */}
      {!isMaintainer && <SubmitPr bounty={bounty} onDone={refresh} />}
    </div>
  );
}

function PrRow({
  pr,
  bounty,
  isMaintainer,
  alreadyPaid,
  link,
  walletConnected,
  onDone,
}: {
  pr: PullRequestRef;
  bounty: Bounty;
  isMaintainer: boolean;
  alreadyPaid: boolean;
  link: ReturnType<typeof useGithubLink>;
  walletConnected: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  // Only the PR's own author claims their payout — and only once merged & unpaid.
  const isMyPr =
    Boolean(link.handle) &&
    pr.author?.toLowerCase() === link.handle?.toLowerCase();
  const claimable = pr.state === "merged" && !alreadyPaid;

  async function claim() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: bounty.id,
          repo: bounty.repo,
          pr: pr.number,
          issue: bounty.issueNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(`${data.error}${data.hint ? ` — ${data.hint}` : ""}`);
      } else {
        setNote(
          data.action === "settleInstant"
            ? "Paid! USDC is on its way to your wallet."
            : "Submitted — verifying with UMA, pays after the challenge window."
        );
        onDone();
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message : "claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-text hover:text-accent"
          >
            <span className="font-mono text-muted">#{pr.number}</span>
            <span className="truncate">{pr.title || "Pull request"}</span>
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.5} />
          </a>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
            {pr.author && <span>@{pr.author}</span>}
            <PrStateBadge state={pr.state} />
          </div>
        </div>

        {/* Contributor claim — gated on a linked wallet. */}
        {isMyPr && claimable && link.checked && link.linkedAddress && (
          <Button size="sm" disabled={busy} className="shrink-0" onClick={claim}>
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <GitMerge className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
            )}
            Claim payout
          </Button>
        )}
        {isMyPr && claimable && link.checked && !link.linkedAddress && (
          <a
            href="/contributor"
            className="shrink-0 rounded-[6px] border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
          >
            Link wallet to claim →
          </a>
        )}
        {isMaintainer && pr.state === "open" && (
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-[6px] border border-border px-2.5 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-text"
          >
            Review & merge
          </a>
        )}
      </div>

      {/* When the winner hasn't linked yet, tell the maintainer why it's unpaid. */}
      {isMaintainer && claimable && !isMyPr && (
        <p className="mt-2 text-xs text-muted">
          Merged. Pays automatically once @{pr.author} links a wallet — no action
          needed from you.
        </p>
      )}
      {!walletConnected && isMyPr && claimable && (
        <p className="mt-2 text-xs text-muted">Connect your wallet to claim.</p>
      )}
      {note && (
        <p className="mt-2 rounded-[6px] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          {note}
        </p>
      )}
    </li>
  );
}

function PrStateBadge({ state }: { state: PullRequestRef["state"] }) {
  const map = {
    open: { label: "open", color: "var(--ok)" },
    merged: { label: "merged", color: "var(--accent)" },
    closed: { label: "closed", color: "var(--muted)" },
  } as const;
  const s = map[state];
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

function SubmitPr({ bounty, onDone }: { bounty: Bounty; onDone: () => void }) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<string | null>(null);

  async function submit() {
    if (!value.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      const isUrl = value.includes("github.com");
      const res = await fetch(`/api/rewards/${bounty.id}/pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { url: value.trim() } : { pr: Number(value) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(`${data.error}${data.hint ? ` — ${data.hint}` : ""}`);
      } else {
        setNote("PR linked. It now appears above and pays out on merge.");
        setValue("");
        onDone();
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message : "submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="text-xs text-muted">
        Opened a PR for this issue? Link it here. It must say{" "}
        <span className="font-mono text-text">closes #{bounty.issueNumber}</span>.
        Payout goes to the wallet you link on{" "}
        <a href="/contributor" className="text-accent hover:underline">
          your contributor page
        </a>{" "}
        — link it first so you get paid the moment it merges.
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="PR number or github PR URL"
          className="flex-1"
        />
        <Button
          variant="outline"
          disabled={busy || !value.trim()}
          onClick={submit}
          className="shrink-0"
        >
          {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Link PR
        </Button>
      </div>
      {note && (
        <p className="mt-2 rounded-[6px] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          {note}
        </p>
      )}
    </div>
  );
}
