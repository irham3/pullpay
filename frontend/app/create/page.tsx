"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import {
  CheckCircle2,
  Loader2,
  Info,
  ExternalLink,
  ChevronDown,
  Link2,
  Search,
} from "lucide-react";

// lucide-react doesn't include brand icons — inline the GitHub mark.
function GithubIcon({ className, ...props }: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 0 1 1.24 3.22c0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .31.22.69.83.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

// ---------- Types ----------
type ModeVal = (typeof MODE)[keyof typeof MODE];
type SourceMode = "github" | "manual";
type IssueItem = { number: number; title: string; labels: string[]; state: string; url: string };
type RepoItem = { full_name: string; language: string | null; private: boolean };

const BOND_DEFAULT = 10; // USDC bond bundled for Safeguarded (PRD §19.1)

// ---------- Helpers ----------
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ---------- Component ----------
function CreateRewardContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();

  // GitHub identity (from OAuth callback or cookie).
  const ghUser = React.useMemo(() => {
    const fromQuery = searchParams.get("gh");
    if (fromQuery && fromQuery !== "error" && fromQuery !== "unconfigured") {
      return fromQuery;
    }
    return getCookie("pullpay_gh");
  }, [searchParams]);

  // Source mode: GitHub-first or manual URL.
  const [sourceMode, setSourceMode] = React.useState<SourceMode>("github");

  // GitHub-first state.
  const [repos, setRepos] = React.useState<RepoItem[]>([]);
  const [reposLoading, setReposLoading] = React.useState(false);
  const [selectedRepo, setSelectedRepo] = React.useState<string>("");
  const [issues, setIssues] = React.useState<IssueItem[]>([]);
  const [issuesLoading, setIssuesLoading] = React.useState(false);
  const [selectedIssue, setSelectedIssue] = React.useState<IssueItem | null>(null);
  const [issueSearch, setIssueSearch] = React.useState("");

  // Manual URL state.
  const [manualUrl, setManualUrl] = React.useState("");
  const [manualValidating, setManualValidating] = React.useState(false);
  const [manualError, setManualError] = React.useState<string | null>(null);
  const [manualValidated, setManualValidated] = React.useState<{
    full_name: string;
    issue: number;
    title: string;
    labels: string[];
    language: string;
    state: string;
  } | null>(null);


  // Shared form state.
  const [title, setTitle] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [criteria, setCriteria] = React.useState("");
  const [deadlineDays, setDeadlineDays] = React.useState("30");
  const [mode, setMode] = React.useState<ModeVal>(MODE.Safeguarded);
  const [step, setStep] = React.useState<"form" | "approving" | "creating" | "done">("form");
  const [error, setError] = React.useState<string | null>(null);
  const [createdId, setCreatedId] = React.useState<`0x${string}` | null>(null);

  const { approve } = useApproveUsdc();
  const { createReward } = useCreateReward();

  // Derived values.
  const repo =
    sourceMode === "github"
      ? selectedRepo
      : manualValidated?.full_name ?? "";
  const issueNumber =
    sourceMode === "github"
      ? selectedIssue?.number ?? 0
      : manualValidated?.issue ?? 0;
  const amountNum = Number(amount) || 0;
  const bond = mode === MODE.Safeguarded ? BOND_DEFAULT : 0;
  const total = amountNum + bond;
  const valid = repo.includes("/") && issueNumber > 0 && amountNum > 0;

  const rewardIdPreview = React.useMemo(() => {
    if (!repo.includes("/") || !issueNumber) return null;
    return computeRewardId(repo, issueNumber, 0n);
  }, [repo, issueNumber]);

  // ---------- Fetch repos when GitHub user is known ----------
  React.useEffect(() => {
    if (!ghUser || sourceMode !== "github") return;
    let ignore = false;
    const controller = new AbortController();
    (async () => {
      setReposLoading(true);
      try {
        const r = await fetch(
          `/api/github/repos?user=${encodeURIComponent(ghUser)}`,
          { signal: controller.signal }
        );
        const d = await r.json();
        if (!ignore) {
          setRepos(d.repos ?? []);
          setReposLoading(false);
        }
      } catch {
        if (!ignore) {
          setRepos([]);
          setReposLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [ghUser, sourceMode]);

  // ---------- Fetch issues when repo is selected ----------
  React.useEffect(() => {
    if (!selectedRepo || sourceMode !== "github") return;
    let ignore = false;
    const controller = new AbortController();
    (async () => {
      setIssuesLoading(true);
      setSelectedIssue(null);
      setIssueSearch("");
      try {
        const r = await fetch(
          `/api/github/issues?repo=${encodeURIComponent(selectedRepo)}`,
          { signal: controller.signal }
        );
        const d = await r.json();
        if (!ignore) {
          setIssues(d.issues ?? []);
          setIssuesLoading(false);
        }
      } catch {
        if (!ignore) {
          setIssues([]);
          setIssuesLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedRepo, sourceMode]);

  // ---------- Validate manual URL ----------
  async function validateManualUrl() {
    if (!manualUrl.trim()) return;
    setManualValidating(true);
    setManualError(null);
    setManualValidated(null);
    try {
      const res = await fetch(
        `/api/github/issues?url=${encodeURIComponent(manualUrl.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setManualError(data.error || "Invalid URL");
        return;
      }
      if (data.state === "closed") {
        setManualError("This issue is closed. Only open issues can be funded.");
        return;
      }
      setManualValidated({
        full_name: data.full_name,
        issue: data.issue,
        title: data.title,
        labels: data.labels ?? [],
        language: data.language ?? "",
        state: data.state,
      });
      if (!title && data.title) setTitle(data.title);
    } catch {
      setManualError("Failed to validate URL. Please check and try again.");
    } finally {
      setManualValidating(false);
    }
  }

  // ---------- Submit ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) return;

    const id = computeRewardId(repo, issueNumber);
    const amountParsed = parseUnits(amount, USDC_DECIMALS);
    const bondParsed = parseUnits(String(bond), USDC_DECIMALS);
    const totalParsed = amountParsed + bondParsed;
    const criteriaHash = criteriaHashFrom(criteria || title);
    const deadlineSec =
      Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400;
    const deadline = BigInt(deadlineSec);

    const issueTitle =
      sourceMode === "github"
        ? selectedIssue?.title ?? title
        : manualValidated?.title ?? title;
    const language =
      sourceMode === "github"
        ? repos.find((r) => r.full_name === selectedRepo)?.language ?? "TypeScript"
        : manualValidated?.language ?? "TypeScript";
    const labels =
      sourceMode === "github"
        ? selectedIssue?.labels ?? []
        : manualValidated?.labels ?? [];

    const persist = (fundingTx: `0x${string}`) => {
      const record: Bounty = {
        id,
        repo,
        issueNumber,
        issueTitle: issueTitle || `${repo} #${issueNumber}`,
        amount: amountNum,
        bond,
        token: "USDC",
        maintainer: (address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
        mode: mode === MODE.Instant ? "Instant" : "Safeguarded",
        status: "Open",
        deadline: deadlineSec,
        createdAt: Math.floor(Date.now() / 1000),
        language,
        labels,
        fundingTx,
      };
      saveLocalReward(record);
    };

    if (DEMO_MODE) {
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
      await approve(totalParsed);
      setStep("creating");
      const txHash = await createReward({
        id,
        token: USDC_ADDRESS,
        amount: amountParsed,
        bond: bondParsed,
        repo,
        issueNumber: BigInt(issueNumber),
        criteriaHash,
        mode,
        deadline,
      });
      persist(txHash as `0x${string}`);
      fetch("/api/reward/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: id, repo, issue: issueNumber }),
      }).catch(() => {});
      setCreatedId(id);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message.split("\n")[0] : "Transaction failed");
      setStep("form");
    }
  }

  // ---------- Done state ----------
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
              {amountNum} USDC is locked in escrow for {repo} #{issueNumber}.
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
  const filteredIssues = issueSearch
    ? issues.filter(
        (i) =>
          i.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
          String(i.number).includes(issueSearch)
      )
    : issues;

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
          <CardTitle>Select an issue</CardTitle>
          <CardDescription>
            Connect your GitHub to pick from your repos, or paste a public issue URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ---------- Source mode toggle ---------- */}
            <SegmentedControl<SourceMode>
              value={sourceMode}
              onChange={(v) => {
                setSourceMode(v);
                setError(null);
              }}
              segments={[
                { value: "github", label: "My GitHub repos" },
                { value: "manual", label: "Paste issue URL" },
              ]}
            />

            {/* ---------- GitHub-first flow ---------- */}
            {sourceMode === "github" && (
              <>
                {!ghUser ? (
                  <div className="flex flex-col items-center gap-3 rounded-[8px] border border-dashed border-border py-6">
                    <GithubIcon className="h-8 w-8 text-muted" />
                    <p className="text-sm text-muted">
                      Connect GitHub to see your repos
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        window.location.href = "/api/github/login?next=/create";
                      }}
                    >
                      <GithubIcon className="mr-2 h-4 w-4" />
                      Connect GitHub
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Connected badge */}
                    <div className="flex items-center justify-between rounded-[8px] border border-border bg-bg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <GithubIcon className="h-4 w-4 text-ok" />
                        <span className="text-sm text-text font-medium">
                          {ghUser}
                        </span>
                      </div>
                      <Link
                        href="/maintainer"
                        className="text-xs text-muted hover:text-text transition-colors"
                      >
                        Manage connection
                      </Link>
                    </div>

                    {/* Repo picker */}
                    <Field label="Repository" hint={
                      reposLoading
                        ? "Loading repos…"
                        : repos.length === 0
                          ? ""
                          : `${repos.length} repo${repos.length > 1 ? "s" : ""} with PullPay installed`
                    }>
                      <div className="relative">
                        <select
                          value={selectedRepo}
                          onChange={(e) => setSelectedRepo(e.target.value)}
                          disabled={reposLoading || repos.length === 0}
                          className="w-full appearance-none rounded-[6px] border border-border bg-bg px-3 py-2 pr-8 text-sm text-text font-mono transition-colors focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a repository…</option>
                          {repos.map((r) => (
                            <option key={r.full_name} value={r.full_name}>
                              {r.full_name}{r.language ? ` · ${r.language}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      </div>

                      {!reposLoading && repos.length === 0 && (
                        <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-border bg-muted/5 py-4">
                          <p className="text-sm text-muted">
                            PullPay App is not installed on your repos.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => window.open("https://github.com/apps/pullpay-sigma/installations/new", "_blank")}
                          >
                            Install App on GitHub
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </Field>

                    {/* Issue picker */}
                    {selectedRepo && (
                      <Field label="Issue" hint={
                        issuesLoading
                          ? "Loading issues…"
                          : issues.length === 0
                            ? "No open issues found"
                            : `${issues.length} open issue${issues.length > 1 ? "s" : ""}`
                      }>
                        {/* Search box for issues */}
                        {issues.length > 5 && (
                          <div className="relative mb-2">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                            <input
                              type="text"
                              value={issueSearch}
                              onChange={(e) => setIssueSearch(e.target.value)}
                              placeholder="Search issues…"
                              className="w-full rounded-[6px] border border-border bg-bg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                            />
                          </div>
                        )}
                        <div className="max-h-48 overflow-y-auto rounded-[6px] border border-border bg-bg divide-y divide-border">
                          {issuesLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-muted" />
                            </div>
                          ) : filteredIssues.length === 0 ? (
                            <div className="py-4 text-center text-xs text-muted">
                              {issueSearch ? "No matching issues" : "No open issues"}
                            </div>
                          ) : (
                            filteredIssues.map((iss) => {
                              const isSelected = selectedIssue?.number === iss.number;
                              return (
                                <button
                                  key={iss.number}
                                  type="button"
                                  onClick={() => {
                                    setSelectedIssue(iss);
                                    if (!title) setTitle(iss.title);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-surface-2 ${
                                    isSelected
                                      ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-l-2 border-l-accent"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-mono text-xs text-muted shrink-0 mt-0.5">
                                      #{iss.number}
                                    </span>
                                    <span className="text-text leading-snug">
                                      {iss.title}
                                    </span>
                                  </div>
                                  {iss.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1 ml-6">
                                      {iss.labels.slice(0, 3).map((l) => (
                                        <span
                                          key={l}
                                          className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
                                        >
                                          {l}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </Field>
                    )}

                    {/* No app installed hint */}
                    {!reposLoading && repos.length === 0 && ghUser && (
                      <div className="flex items-start gap-2 rounded-[8px] border border-border bg-surface-2 px-3 py-2.5">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                        <div className="text-xs text-muted">
                          <p>
                            Install the{" "}
                            <a
                              href={`https://github.com/apps/pullpay-sigma`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline inline-flex items-center gap-0.5"
                            >
                              PullPay GitHub App
                              <ExternalLink className="h-3 w-3" />
                            </a>{" "}
                            on your repo to enable this flow, or switch to{" "}
                            <button
                              type="button"
                              onClick={() => setSourceMode("manual")}
                              className="text-accent hover:underline"
                            >
                              paste an issue URL
                            </button>
                            .
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ---------- Manual URL flow ---------- */}
            {sourceMode === "manual" && (
              <>
                <Field
                  label="GitHub issue URL"
                  hint="Paste the full URL to a public GitHub issue"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        mono
                        value={manualUrl}
                        onChange={(e) => {
                          setManualUrl(e.target.value);
                          setManualValidated(null);
                          setManualError(null);
                        }}
                        onBlur={() => {
                          if (manualUrl.trim() && !manualValidated) validateManualUrl();
                        }}
                        placeholder="https://github.com/owner/repo/issues/123"
                        className="pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateManualUrl}
                      disabled={!manualUrl.trim() || manualValidating}
                      className="shrink-0"
                    >
                      {manualValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </Field>

                {manualError && (
                  <p className="rounded-[6px] border border-bad/40 bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] px-3 py-2 text-xs text-bad">
                    {manualError}
                  </p>
                )}

                {manualValidated && (
                  <div className="rounded-[8px] border border-ok/30 bg-[color-mix(in_srgb,var(--ok)_6%,transparent)] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-ok shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text truncate">
                          {manualValidated.title}
                        </p>
                        <p className="text-xs text-muted font-mono">
                          {manualValidated.full_name} #{manualValidated.issue}
                        </p>
                      </div>
                    </div>
                    {manualValidated.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 ml-6">
                        {manualValidated.labels.slice(0, 4).map((l) => (
                          <span
                            key={l}
                            className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ---------- Reward details (shared) ---------- */}
            {(sourceMode === "github" ? selectedIssue : manualValidated) && (
              <>
                <hr className="border-border" />

                <Field label="Issue title" hint="Shown on the bounty board (editable)">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add simulateBlocks action"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Reward (USDC)">
                    <Input
                      mono
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="250"
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

                {/* Cost summary */}
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
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function CreateRewardPage() {
  return (
    <React.Suspense fallback={
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-2" />
          <div className="h-4 w-64 rounded bg-surface-2" />
          <div className="h-64 rounded-[10px] bg-surface-2" />
        </div>
      </main>
    }>
      <CreateRewardContent />
    </React.Suspense>
  );
}
