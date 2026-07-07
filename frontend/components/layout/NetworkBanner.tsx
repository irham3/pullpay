"use client";

import { useNetworkGuard } from "@/hooks/useNetworkGuard";
import { AlertTriangle } from "lucide-react";

// Thin banner shown only when connected to the wrong chain (PRD §30.3).
export function NetworkBanner() {
  const { wrongNetwork, fixNetwork } = useNetworkGuard();
  if (!wrongNetwork) return null;

  return (
    <div className="border-b border-border bg-[color-mix(in_srgb,var(--warn)_12%,transparent)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-2 text-sm">
        <span className="inline-flex items-center gap-2 text-text">
          <AlertTriangle className="h-4 w-4 text-warn" strokeWidth={1.5} />
          Wrong network — PullPay runs on OP Sepolia.
        </span>
        <button
          onClick={fixNetwork}
          className="rounded-[6px] border border-border px-2.5 py-1 text-xs text-text transition-colors hover:bg-surface-2"
        >
          Switch network
        </button>
      </div>
    </div>
  );
}
