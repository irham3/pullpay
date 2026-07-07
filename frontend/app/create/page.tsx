"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useCreateReward } from "@/hooks/usePullPay";
import { parseUnits, keccak256, toBytes } from "viem";

export default function CreateRewardPage() {
  const { createReward, isCreating } = useCreateReward();
  const [repo, setRepo] = useState("");
  const [issueNum, setIssueNum] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<0 | 1>(1); // 0 = Instant, 1 = Safeguarded

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo || !issueNum || !amount) return;

    try {
      const id = keccak256(toBytes(`${repo}-${issueNum}-${Date.now()}`));
      const token = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
      const amountParsed = parseUnits(amount, 6); // USDC has 6 decimals
      const bondParsed = mode === 1 ? parseUnits("10", 6) : 0n; // 10 USDC bond for safeguarded
      const criteriaHash = keccak256(toBytes("default-criteria"));
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days

      await createReward(
        id,
        token,
        amountParsed,
        bondParsed,
        repo,
        BigInt(issueNum),
        criteriaHash,
        mode,
        deadline
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="flex-1 p-8 md:p-12 flex justify-center items-start pt-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Fund a New Reward</CardTitle>
          <CardDescription>Lock USDC to incentivize an open source contribution.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">Repository</label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. facebook/react"
                className="w-full bg-bg border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">Issue Number</label>
                <input
                  type="number"
                  value={issueNum}
                  onChange={(e) => setIssueNum(e.target.value)}
                  placeholder="e.g. 1024"
                  className="w-full bg-bg border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">Reward (USDC)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="250"
                  className="w-full bg-bg border border-border rounded-input px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono tnum"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text">Settlement Mode</label>
              <div className="flex items-center gap-2 p-1 border border-border rounded-input bg-bg">
                <button
                  type="button"
                  onClick={() => setMode(0)}
                  className={`flex-1 text-sm py-1.5 rounded-[4px] transition ${mode === 0 ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
                >
                  Instant
                </button>
                <button
                  type="button"
                  onClick={() => setMode(1)}
                  className={`flex-1 text-sm py-1.5 rounded-[4px] transition ${mode === 1 ? "bg-surface-2 text-text" : "text-muted hover:text-text"}`}
                >
                  Safeguarded (UMA)
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? "Confirming in Wallet..." : "Lock USDC & Create Reward"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
