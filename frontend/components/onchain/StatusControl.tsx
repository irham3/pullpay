"use client";

import * as React from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import type { Bounty, StoredReward } from "@/lib/types";
import { OPEN_PHASE, statusMessage, type UiStatus } from "@/lib/status";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

// The review phases a maintainer can move a reward through by hand. Terminal
// states (Verifying/Paid/Refunded/Rejected) are driven on-chain and never shown
// here. Fixes "the maintainer can't change an open reward's status".
const CHOICES: UiStatus[] = ["Open", "In Review", "Changes Requested", "Merged"];

export function StatusControl({ bounty }: { bounty: Bounty }) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<UiStatus | null>(null);
  const [note, setNote] = React.useState<string | null>(null);

  const isMaintainer =
    address?.toLowerCase() === bounty.maintainer.toLowerCase();

  // Only offer manual control while the reward is still in the off-chain review
  // phase; once money has moved on-chain the status is authoritative.
  if (!isMaintainer || !OPEN_PHASE.includes(bounty.status)) return null;

  async function setStatus(status: UiStatus) {
    if (status === bounty.status) return;
    setNote(null);
    setBusy(status);
    try {
      // eslint-disable-next-line react-hooks/purity -- click handler, not render
      const ts = Math.floor(Date.now() / 1000);
      const signature = await signMessageAsync({
        message: statusMessage(bounty.id, status, ts),
      });
      const res = await fetch("/api/rewards/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bounty.id, status, ts, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(data.error || "Could not update status");
      } else {
        setNote(`Status set to ${status}.`);
        // Optimistically patch the caches the detail page + board read, so the
        // pill flips immediately instead of waiting on a refetch (the refetch
        // then reconciles). This is why the status "wasn't changing" before.
        const key = bounty.id.toLowerCase();
        qc.setQueryData<StoredReward | null>(
          ["server-reward", key],
          (prev) => (prev ? { ...prev, status } : prev)
        );
        qc.setQueryData<Bounty[]>(["server-rewards"], (prev) =>
          Array.isArray(prev)
            ? prev.map((r) => (r.id.toLowerCase() === key ? { ...r, status } : r))
            : prev
        );
        await qc.invalidateQueries({ queryKey: ["server-rewards"] });
        await qc.invalidateQueries({ queryKey: ["server-reward", key] });
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message.split("\n")[0] : "Signing failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted">
        Move this reward through review. Signed with your wallet — no gas, no
        on-chain change.
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CHOICES.map((s) => (
          <Button
            key={s}
            variant={s === bounty.status ? "default" : "outline"}
            className="h-8 px-2.5 text-xs"
            disabled={busy !== null || s === bounty.status}
            onClick={() => setStatus(s)}
          >
            {busy === s && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
            {s}
          </Button>
        ))}
      </div>
      {note && (
        <p className="rounded-[6px] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          {note}
        </p>
      )}
    </div>
  );
}
