"use client";

import * as React from "react";
import Link from "next/link";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { AddressChip } from "@/components/onchain/AddressChip";
import { ConnectButton } from "@/components/layout/ConnectButton";
import { computeRewardId, criteriaHashFrom } from "@/lib/rewardId";
import { MODE } from "@/lib/contracts/PullPayEscrow";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  DEMO_MODE,
} from "@/lib/contracts/addresses";
import {
  useApproveUsdc,
  useCreateReward,
} from "@/hooks/usePullPay";
import { saveLocalReward } from "@/lib/localStore";
import type { Bounty } from "@/lib/types";
import { CheckCircle2, Loader2, Info } from "lucide-react";

type ModeVal = (typeof MODE)[keyof typeof MODE];
const BOND_DEFAULT = 10; // USDC bond bundled for Safeguarded (PRD §19.1)

export default function CreateRewardPage() {
  const { address, isConnected } = useAccount();
  const [repo, setRepo] = React.useState("");
  const [issue, setIssue] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [criteria, setCriteria] = React.useState("");
  const [deadlineDays, setDeadlineDays] = React.useState("30");
  const [mode, setMode] = React.useState<ModeVal>(MODE.Safeguarded);
  const [step, setStep] = React.useState<"form" | "approving" | "creating" | "done">(
    "form"
  );
  const [error, setError] = React.useState<string | null>(null);
  const [createdId, setCreatedId] = React.useState<`0x${string}` | null>(null);

  // GitHub enrichment for the issue (title/labels/language) via the relayer proxy.
  const [meta, setMeta] = React.useState<{
    labels: string[];
    language: string;
  } | null>(null);
  const [metaState, setMetaState] = React.useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );

  const { approve } = useApproveUsdc();
  const { createReward } = useCreateReward();

  async function fetchIssueMeta() {
    if (!repo.includes("/") || !Number(issue)) return;
    setMetaState("loading");
    try {
      const res = await fetch(
        `/api/github/issue?repo=${encodeURIComponent(repo)}&issue=${Number(issue)}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeta({ labels: data.labels ?? [], language: data.language ?? "" });
      if (!title && data.title) setTitle(data.title);
      setMetaState("ok");
    } catch {
      setMetaState("error");
    }
  }

  const amountNum = Number(amount) || 0;
  const bond = mode === MODE.Safeguarded ? BOND_DEFAULT : 0;
  const total = amountNum + bond;
  const valid = repo.includes("/") && Number(issue) > 0 && amountNum > 0;

  const rewardIdPreview = React.useMemo(() => {
    if (!repo.includes("/") || !Number(issue)) return null;
    return computeRewardId(repo, Number(issue), 0n); // preview nonce
  }, [repo, issue]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) return;

    const id = computeRewardId(repo, Number(issue));
    const amountParsed = parseUnits(amount, USDC_DECIMALS);
    const bondParsed = parseUnits(String(bond), USDC_DECIMALS);
    const total = amountParsed + bondParsed;
    const criteriaHash = criteriaHashFrom(criteria || title);
    const deadlineSec =
      Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400;
    const deadline = BigInt(deadlineSec);

    // Remember the reward locally (enriched with GitHub metadata) so it shows on
    // the board/dashboard/detail without a subgraph.
    const persist = (fundingTx: `0x${string}`) => {
      const record: Bounty = {
        id,
        repo,
        issueNumber: Number(issue),
        issueTitle: title || `${repo} #${issue}`,
        amount: amountNum,
        bond,
        token: "USDC",
        maintainer: (address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
        mode: mode === MODE.Instant ? "Instant" : "Safeguarded",
        status: "Open",
        deadline: deadlineSec,
        createdAt: Math.floor(Date.now() / 1000),
        language: meta?.language || "TypeScript",
        labels: meta?.labels ?? [],
        fundingTx,
      };
      saveLocalReward(record);
    };

    if (DEMO_MODE) {
      // No escrow deployed — walk the UI through the states for the demo.
      setStep("approving");
      await new Promise((r) => setTimeout(r, 700));
      setStep("creating");
      await new Promise((r) => setTimeout(r, 900));
      persist("0x" as `0x${string}`);
      setCreatedId(id);
      setStep("done");
      return;
    }

    try {
      setStep("approving");
      await approve(total);
      setStep("creating");
      const txHash = await createReward({
        id,
        token: USDC_ADDRESS,
        amount: amountParsed,
        bond: bondParsed,
        repo,
        issueNumber: BigInt(issue),
        criteriaHash,
        mode,
        deadline,
      });
      persist(txHash as `0x${string}`);
      setCreatedId(id);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
      setStep("form");
    }
  }

  if (step === "done" && createdId) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-ok text-ok">
              <CheckCircle2 className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-text">
              Reward funded
            </h2>
            <p className="mt-1 text-sm text-muted">
              {amountNum} USDC is locked in escrow for {repo} #{issue}.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-[8px] border border-border bg-bg px-3 py-2">
              <span className="text-xs text-muted">Reward ID</span>
              <AddressChip value={createdId} kind="hash" showExplorer={false} />
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link href={`/reward/${createdId}`}>View reward</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
            <p className="mt-6 text-left text-xs text-muted">
              Next: add a{" "}
              <span className="font-mono text-text">pullpay.yml</span> workflow
              to {repo} so a merged PR triggers settlement automatically.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const busy = step === "approving" || step === "creating";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Fund a reward
        </h1>
        <p className="mt-1 text-sm text-muted">
          Lock USDC against a GitHub issue. Verified and paid out automatically
          on merge.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward details</CardTitle>
          <CardDescription>
            The reward ID is derived from repo + issue, so it maps 1:1 to the
            work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Repository" hint="owner/repo on GitHub">
              <Input
                mono
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                onBlur={fetchIssueMeta}
                placeholder="wevm/viem"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Issue #"
                hint={
                  metaState === "loading"
                    ? "Checking GitHub…"
                    : metaState === "ok"
                      ? `Found · ${meta?.language || "repo"}`
                      : metaState === "error"
                        ? "Couldn’t verify issue"
                        : undefined
                }
              >
                <Input
                  mono
                  type="number"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  onBlur={fetchIssueMeta}
                  placeholder="3421"
                />
              </Field>
              <Field label="Reward (USDC)">
                <Input
                  mono
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="250"
                />
              </Field>
            </div>

            <Field label="Issue title" hint="Shown on the bounty board (optional)">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add simulateBlocks action"
              />
            </Field>

            <Field
              label="Acceptance criteria"
              hint="Hashed into the reward and used to judge disputes (optional)"
            >
              <textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                rows={3}
                placeholder="Link to the issue spec or paste the acceptance criteria…"
                className="w-full resize-none rounded-[6px] border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Settlement mode">
                <SegmentedControl<ModeVal>
                  value={mode}
                  onChange={setMode}
                  segments={[
                    { value: MODE.Instant, label: "Instant" },
                    { value: MODE.Safeguarded, label: "Safeguarded" },
                  ]}
                />
              </Field>
              <Field label="Refund deadline" hint="Days until refundable">
                <Input
                  mono
                  type="number"
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-[8px] border border-border bg-bg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Reward</span>
                <span className="font-mono tnum text-text">
                  {amountNum.toLocaleString("en-US")} USDC
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-muted">
                  Bond {mode === MODE.Instant && "(none in Instant)"}
                </span>
                <span className="font-mono tnum text-text">
                  {bond} USDC
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-text">Total to lock</span>
                <span className="font-mono tnum text-text">
                  {total.toLocaleString("en-US")} USDC
                </span>
              </div>
              {rewardIdPreview && (
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
                  <span className="text-muted">Reward ID</span>
                  <span className="font-mono text-muted">
                    {rewardIdPreview.slice(0, 10)}…
                  </span>
                </div>
              )}
            </div>

            {mode === MODE.Safeguarded && (
              <p className="flex gap-2 text-xs text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                The bond is returned on an honest settle. On a proven-false
                dispute, reward + bond return to you.
              </p>
            )}

            {error && (
              <p className="rounded-[6px] border border-bad/40 bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2 text-xs text-bad">
                {error}
              </p>
            )}

            {DEMO_MODE && (
              <p className="flex gap-2 rounded-[6px] border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                Demo mode — no escrow is deployed, so this simulates the approve →
                createReward flow without a real transaction.
              </p>
            )}

            {!isConnected ? (
              <div className="pt-1">
                <div className="flex flex-col items-center gap-2 rounded-[8px] border border-dashed border-border py-5">
                  <span className="text-sm text-muted">
                    Connect a wallet to fund a reward
                  </span>
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={!valid || busy}
              >
                {busy && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.75} />
                )}
                {step === "approving"
                  ? "Approving USDC…"
                  : step === "creating"
                    ? "Locking in escrow…"
                    : `Approve & lock ${total.toLocaleString("en-US")} USDC`}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
