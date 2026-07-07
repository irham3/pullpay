"use client";

import * as React from "react";
import { truncateAddr, truncateHash } from "@/lib/format";
import { explorerAddr, explorerTx } from "@/lib/explorer";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Monospace on-chain reference (address, tx hash, rewardId) with copy + explorer
// affordances (DESIGN.md §4.5). Data stays static and readable — no animation.
export function AddressChip({
  value,
  kind = "address",
  className,
  showExplorer = true,
}: {
  value: string;
  kind?: "address" | "tx" | "hash";
  className?: string;
  showExplorer?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);

  const label =
    kind === "address" ? truncateAddr(value) : truncateHash(value);
  const href =
    kind === "tx" ? explorerTx(value) : kind === "address" ? explorerAddr(value) : undefined;

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-sm text-muted",
        className
      )}
    >
      <span className="text-text">{label}</span>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy"
        className="text-muted transition-colors hover:text-text"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} />
        ) : (
          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
      {showExplorer && href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label="View on explorer"
          className="text-muted transition-colors hover:text-text"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
        </a>
      )}
    </span>
  );
}
