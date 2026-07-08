"use client";

import type { Bounty } from "@/lib/types";
import { Countdown } from "./Countdown";
import { Gavel, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DisputePanel({ bounty }: { bounty: Bounty }) {
  if (bounty.status === "Verifying") {
    return (
      <div className="rounded-[10px] border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-warn live-dot" strokeWidth={1.75} />
          <span className="text-sm font-medium text-text">
            Waiting for UMA check
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          The payout is in the challenge window. If nobody disputes it, the
          contributor is paid.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-[6px] border border-border bg-bg px-3 py-2.5">
          <span className="text-xs uppercase tracking-wider text-muted">
            Can pay after
          </span>
          {bounty.livenessEndsAt ? (
            <Countdown
              target={bounty.livenessEndsAt}
              className="text-lg text-warn"
            />
          ) : (
            <span className="font-mono text-lg text-warn">-</span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="danger" size="sm">
            <Gavel className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
            Dispute
          </Button>
          <span className="text-xs text-muted">Requires a bond.</span>
        </div>
      </div>
    );
  }

  if (bounty.status === "Disputed") {
    return (
      <div className="rounded-[10px] border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-bad" strokeWidth={1.75} />
          <span className="text-sm font-medium text-text">
            Disputed in UMA
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">
          UMA decides whether the merged PR should be paid. The reward waits
          until the result is final.
        </p>
        <ol className="mt-4 space-y-2 text-sm">
          <Phase active label="Vote hidden" note="UMA voters submit votes" />
          <Phase label="Vote revealed" note="Votes become visible" />
          <Phase label="Result" note="Payout or refund is decided" />
        </ol>
      </div>
    );
  }

  return null;
}

function Phase({
  label,
  note,
  active,
}: {
  label: string;
  note: string;
  active?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: active ? "var(--bad)" : "var(--muted)" }}
      />
      <span>
        <span className={active ? "text-text font-medium" : "text-text"}>
          {label}
        </span>
        <span className="text-muted"> - {note}</span>
      </span>
    </li>
  );
}
