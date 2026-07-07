import { AddressChip } from "./AddressChip";
import { ShieldCheck } from "lucide-react";
import type { Bounty } from "@/lib/types";
import { ESCROW_ADDRESS } from "@/lib/contracts/addresses";
import { explorerAddr } from "@/lib/explorer";

// Proof of Funding (PRD §28 / F11): every bounty exposes contract-level proof so
// a contributor can confirm funds are locked before starting work.
export function ProofPanel({ bounty }: { bounty: Bounty }) {
  const funded = ["Open", "In Review", "Changes Requested", "Merged"].includes(
    bounty.status
  );

  return (
    <div className="rounded-[10px] border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-ok" strokeWidth={1.75} />
        <span className="text-sm font-medium text-text">
          {funded
            ? `Funded — ${bounty.amount} ${bounty.token} locked on-chain`
            : `Escrow record — ${bounty.amount} ${bounty.token}`}
        </span>
      </div>
      <dl className="divide-y divide-border text-sm">
        <Row label="Reward ID">
          <AddressChip value={bounty.id} kind="hash" showExplorer={false} />
        </Row>
        <Row label="Funding tx">
          <AddressChip value={bounty.fundingTx} kind="tx" />
        </Row>
        <Row label="Escrow contract">
          {ESCROW_ADDRESS ===
          "0x0000000000000000000000000000000000000000" ? (
            <span className="font-mono text-sm text-muted">
              not deployed (demo)
            </span>
          ) : (
            <a
              href={explorerAddr(ESCROW_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-text hover:text-accent"
            >
              {ESCROW_ADDRESS.slice(0, 10)}… ↗
            </a>
          )}
        </Row>
        <Row label="Maintainer">
          <AddressChip value={bounty.maintainer} />
        </Row>
      </dl>
      <p className="border-t border-border px-4 py-3 text-xs text-muted">
        Recompute the ID from{" "}
        <span className="font-mono">
          keccak256(repo, issue, nonce)
        </span>{" "}
        and read <span className="font-mono">getReward(id)</span> on any RPC — no
        trust in PullPay required.
      </p>
    </div>
  );
}

function Row({
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
