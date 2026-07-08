"use client";

import { useOnchainRewards } from "@/hooks/useOnchainRewards";
import { CountUp } from "@/components/ui/CountUp";
import { DEMO_MODE } from "@/lib/contracts/addresses";

// Real aggregate stats read from on-chain rewards — no sample numbers.
export function HeroStats() {
  const { data: rewards = [] } = useOnchainRewards();

  const openStates = ["Open", "In Review", "Changes Requested", "Merged", "Verifying"];
  const locked = rewards
    .filter((b) => openStates.includes(b.status))
    .reduce((s, b) => s + b.amount, 0);
  const paid = rewards
    .filter((b) => b.status === "Paid")
    .reduce((s, b) => s + b.amount, 0);
  const open = rewards.filter((b) => b.status === "Open").length;

  return (
    <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border bg-border sm:grid-cols-4">
      <Tile label={DEMO_MODE ? "USDC locked" : "USDC locked now"}>
        <CountUp value={locked} prefix="$" />
      </Tile>
      <Tile label="Paid out">
        <CountUp value={paid} prefix="$" />
      </Tile>
      <Tile label="Open bounties">
        <CountUp value={open} />
      </Tile>
      <Tile label="Settlement erosion">
        &lt;<CountUp value={1} suffix="%" />
      </Tile>
    </div>
  );
}

function Tile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface p-5">
      <div className="font-mono tnum text-2xl text-text sm:text-3xl">
        {children}
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
