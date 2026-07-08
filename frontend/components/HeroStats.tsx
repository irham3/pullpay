"use client";

import { useOnchainRewards } from "@/hooks/useOnchainRewards";
import { CountUp } from "@/components/ui/CountUp";
import { DEMO_MODE } from "@/lib/contracts/addresses";

// Angka demo statis — hanya tampil saat DEMO_MODE dan belum ada data on-chain.
// Angka ini mencerminkan skenario testnet awal yang realistis untuk pitching.
const DEMO_STATS = {
  locked: 12450,
  paid: 8200,
  open: 24,
};

export function HeroStats() {
  const { data: rewards = [] } = useOnchainRewards();

  const openStates = ["Open", "In Review", "Changes Requested", "Merged", "Verifying"];
  const lockedOnchain = rewards
    .filter((b) => openStates.includes(b.status))
    .reduce((s, b) => s + b.amount, 0);
  const paidOnchain = rewards
    .filter((b) => b.status === "Paid")
    .reduce((s, b) => s + b.amount, 0);
  const openOnchain = rewards.filter((b) => b.status === "Open").length;

  // Pakai data demo kalau DEMO_MODE dan belum ada data on-chain sama sekali.
  const useDemo = DEMO_MODE && rewards.length === 0;
  const locked = useDemo ? DEMO_STATS.locked : lockedOnchain;
  const paid   = useDemo ? DEMO_STATS.paid   : paidOnchain;
  const open   = useDemo ? DEMO_STATS.open   : openOnchain;

  return (
    <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border bg-border sm:grid-cols-4">
      <Tile label={DEMO_MODE ? "USDC locked (demo)" : "USDC locked now"}>
        <CountUp value={locked} prefix="$" />
      </Tile>
      <Tile label="Paid out">
        <CountUp value={paid} prefix="$" />
      </Tile>
      <Tile label="Open rewards">
        <CountUp value={open} />
      </Tile>
      <Tile label="Contributor gas">
        <CountUp value={0} suffix=" ETH" />
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
