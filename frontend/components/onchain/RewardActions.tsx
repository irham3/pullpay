"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { isAddress, stringToHex, type Address } from "viem";
import type { Bounty } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConnectButton } from "@/components/layout/ConnectButton";
import {
  useRefund,
  useApproveAndRelease,
  useEscalate,
} from "@/hooks/usePullPay";
import { useResolveAssertion } from "@/hooks/useBounty";
import { DEMO_MODE, MOCK_ORACLE } from "@/lib/contracts/addresses";
import { buildClaim } from "@/lib/rewardId";
import { Loader2, Gavel } from "lucide-react";

export function RewardActions({
  bounty,
  assertionId,
}: {
  bounty: Bounty;
  assertionId?: `0x${string}`;
}) {
  const { address, isConnected } = useAccount();
  const { refund, isRefunding } = useRefund();
  const { approveAndRelease, isReleasing } = useApproveAndRelease();
  const { escalate, isEscalating } = useEscalate();
  const { resolve, isResolving } = useResolveAssertion();

  const [contributor, setContributor] = React.useState("");
  const [pr, setPr] = React.useState("");
  const [note, setNote] = React.useState<string | null>(null);
  const [settling, setSettling] = React.useState(false);

  // Read the clock after mount only (keeps render pure / SSR-safe).
  const [nowSec, setNowSec] = React.useState<number | null>(null);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time clock read on mount
    setNowSec(Math.floor(Date.now() / 1000));
  }, []);

  const isMaintainer =
    address?.toLowerCase() === bounty.maintainer.toLowerCase();
  const deadlinePassed = nowSec !== null && bounty.deadline < nowSec;
  const isOpen = ["Open", "In Review", "Changes Requested", "Merged"].includes(
    bounty.status
  );

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-border p-6">
        <span className="text-sm text-muted">
          Connect a wallet to interact with this reward
        </span>
        <ConnectButton />
      </div>
    );
  }

  async function guarded(fn: () => Promise<unknown>, ok: string) {
    setNote(null);
    if (DEMO_MODE) {
      setNote("Demo mode — deploy an escrow to run this on-chain.");
      return;
    }
    try {
      await fn();
      setNote(ok);
    } catch (e) {
      setNote(e instanceof Error ? e.message.split("\n")[0] : "Transaction failed");
    }
  }

  async function triggerRelayer() {
    setNote(null);
    if (!pr) {
      setNote("Enter the merged PR number first.");
      return;
    }
    setSettling(true);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: bounty.id,
          repo: bounty.repo,
          pr: Number(pr),
          issue: bounty.issueNumber,
        }),
      });
      const data = await res.json();
      setNote(
        res.ok
          ? `Relayer ${data.action} — tx ${String(data.txHash).slice(0, 10)}…`
          : `Relayer: ${data.error}${data.hint ? ` (${data.hint})` : ""}`
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "relayer call failed");
    } finally {
      setSettling(false);
    }
  }

  const sections: React.ReactNode[] = [];

  // --- Maintainer, Instant, still open: approve + release directly ---
  if (isMaintainer && isOpen && bounty.mode === "Instant") {
    sections.push(
      <div key="release" className="space-y-2">
        <div className="text-xs text-muted">
          Pay a contributor directly (Instant — no oracle)
        </div>
        <Input
          mono
          value={contributor}
          onChange={(e) => setContributor(e.target.value)}
          placeholder="0x… contributor address"
        />
        <Button
          className="w-full"
          disabled={isReleasing || !isAddress(contributor)}
          onClick={() =>
            guarded(
              () => approveAndRelease(bounty.id, contributor as Address),
              "Released — contributor paid + attestation minted."
            )
          }
        >
          {isReleasing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Approve &amp; release {bounty.amount} {bounty.token}
        </Button>
      </div>
    );
  }

  // --- Maintainer or relayer: settle via a verified merge (GitHub → relayer) ---
  if (isMaintainer && isOpen && !DEMO_MODE) {
    sections.push(
      <div key="relayer" className="space-y-2">
        <div className="text-xs text-muted">
          Or settle from a merged PR (relayer re-verifies via GitHub)
        </div>
        <div className="flex gap-2">
          <Input
            mono
            value={pr}
            onChange={(e) => setPr(e.target.value)}
            placeholder="PR #"
            className="w-24"
          />
          <Button
            variant="outline"
            className="flex-1"
            disabled={settling}
            onClick={triggerRelayer}
          >
            {settling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Trigger relayer settle
          </Button>
        </div>
      </div>
    );
  }

  // --- Demo: resolve a pending assertion via the mock oracle ---
  if (
    MOCK_ORACLE &&
    bounty.status === "Verifying" &&
    assertionId &&
    assertionId !== "0x"
  ) {
    sections.push(
      <div key="resolve" className="space-y-2">
        <div className="text-xs text-muted">
          Demo oracle — resolve the assertion
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isResolving}
            onClick={() =>
              guarded(
                () => resolve(assertionId, true),
                "Resolved TRUE — contributor paid, bond returned."
              )
            }
          >
            {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Settle (pay)
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={isResolving}
            onClick={() =>
              guarded(
                () => resolve(assertionId, false),
                "Resolved FALSE — funds returned to maintainer."
              )
            }
          >
            <Gavel className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
            Dispute
          </Button>
        </div>
      </div>
    );
  }

  // --- Contributor: escalate a stalled Instant reward past the deadline ---
  if (
    !isMaintainer &&
    isOpen &&
    bounty.mode === "Instant" &&
    deadlinePassed
  ) {
    sections.push(
      <Button
        key="escalate"
        variant="outline"
        className="w-full"
        disabled={isEscalating}
        onClick={() =>
          guarded(
            () =>
              escalate(
                bounty.id,
                stringToHex(
                  buildClaim({
                    pr: bounty.prNumber ?? 0,
                    repo: bounty.repo,
                    issue: bounty.issueNumber,
                    rewardId: bounty.id,
                    contributor: address as string,
                  })
                )
              ),
            "Escalated to UMA — awaiting the liveness window."
          )
        }
      >
        {isEscalating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Claim via UMA (escalate)
      </Button>
    );
  }

  // --- Maintainer: refund after the deadline ---
  if (isMaintainer && isOpen && deadlinePassed) {
    sections.push(
      <Button
        key="refund"
        variant="danger"
        className="w-full"
        disabled={isRefunding}
        onClick={() =>
          guarded(() => refund(bounty.id), "Refund submitted.")
        }
      >
        {isRefunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Refund reward
      </Button>
    );
  }

  // --- Contributor discovery / paid states ---
  if (!isMaintainer && bounty.status === "Open") {
    sections.push(
      <Button key="work" asChild className="w-full">
        <a
          href={`https://github.com/${bounty.repo}/issues/${bounty.issueNumber}`}
          target="_blank"
          rel="noreferrer"
        >
          Start working — open the issue ↗
        </a>
      </Button>
    );
  }

  if (bounty.status === "Paid" && bounty.contributor) {
    sections.push(
      <Button key="profile" asChild variant="outline" className="w-full">
        <a href={`/profile/${bounty.contributor}`}>View contributor reputation</a>
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {sections.length ? (
        sections
      ) : (
        <span className="text-sm text-muted">
          No actions available at this status for your address.
        </span>
      )}
      {note && (
        <p className="rounded-[6px] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          {note}
        </p>
      )}
    </div>
  );
}
