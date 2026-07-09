"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { stringToHex } from "viem";
import type { Bounty } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/layout/ConnectButton";
import {
  useRefund,
  useEscalate,
} from "@/hooks/usePullPay";
import { useResolveAssertion } from "@/hooks/useBounty";
import { DEMO_MODE, MOCK_ORACLE } from "@/lib/contracts/addresses";
import { buildClaim } from "@/lib/rewardId";
import { WorkingOnButton } from "@/components/onchain/WorkingOnButton";
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
  const { escalate, isEscalating } = useEscalate();
  const { resolve, isResolving } = useResolveAssertion();

  const [note, setNote] = React.useState<string | null>(null);
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
          Connect a wallet to take actions on this reward.
        </span>
        <ConnectButton />
      </div>
    );
  }

  async function guarded(fn: () => Promise<unknown>, ok: string) {
    setNote(null);
    if (DEMO_MODE) {
      setNote("Demo mode: deploy an escrow to run this on-chain.");
      return;
    }
    try {
      await fn();
      setNote(ok);
    } catch (e) {
      setNote(e instanceof Error ? e.message.split("\n")[0] : "Transaction failed");
    }
  }

  const sections: React.ReactNode[] = [];

  // Note: there is no maintainer "settle" button. Merging the PR on GitHub is the
  // maintainer's only action — the webhook pays automatically, and a contributor
  // whose wallet wasn't linked yet claims from the Pull requests panel.

  if (
    MOCK_ORACLE &&
    bounty.status === "Verifying" &&
    assertionId &&
    assertionId !== "0x"
  ) {
    sections.push(
      <div key="resolve" className="space-y-2">
        <div className="text-xs text-muted">
          Demo oracle: choose the result for this pending check.
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isResolving}
            onClick={() =>
              guarded(
                () => resolve(assertionId, true),
                "Marked true. Contributor paid and bond returned."
              )
            }
          >
            {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark true
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={isResolving}
            onClick={() =>
              guarded(
                () => resolve(assertionId, false),
                "Marked false. Funds returned to maintainer."
              )
            }
          >
            <Gavel className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
            Mark false
          </Button>
        </div>
      </div>
    );
  }

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
            "Escalated to UMA. Wait for the challenge window."
          )
        }
      >
        {isEscalating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Escalate to UMA
      </Button>
    );
  }

  if (isMaintainer && isOpen && deadlinePassed) {
    sections.push(
      <Button
        key="refund"
        variant="danger"
        className="w-full"
        disabled={isRefunding}
        onClick={() => guarded(() => refund(bounty.id), "Refund submitted.")}
      >
        {isRefunding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Refund reward
      </Button>
    );
  }

  if (!isMaintainer && bounty.status === "Open") {
    sections.push(
      <div key="work" className="space-y-2">
        <Button asChild className="w-full">
          <a
            href={`https://github.com/${bounty.repo}/issues/${bounty.issueNumber}`}
            target="_blank"
            rel="noreferrer"
          >
            Open issue on GitHub
          </a>
        </Button>
        <WorkingOnButton id={bounty.id} />
      </div>
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
          No action available for your wallet right now.
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
