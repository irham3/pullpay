import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroStats } from "@/components/HeroStats";
import { RedirectIfConnected } from "@/components/RedirectIfConnected";

import {
  ArrowRight,
  CheckCircle2,
  Fuel,
  GitPullRequest,
  Lock,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/Button";

const VALUE_CARDS = [
  {
    icon: ShieldCheck,
    title: "Maintainer creates a reward",
    body: "Choose an open GitHub issue, set the USDC amount, and lock the funds.",
    meta: "USDC locked",
  },
  {
    icon: GitPullRequest,
    title: "Contributor opens a PR",
    body: "The contributor fixes the issue and gets the pull request merged.",
    meta: "PR merged",
  },
  {
    icon: Fuel,
    title: "PullPay sends the payout",
    body: "PullPay checks the merge and sends USDC. The contributor pays no gas to receive it.",
    meta: "contributor gas = 0",
  },
];

const PROOF_EVENTS = [
  ["issue", "owner/project #128"],
  ["reward", "$150 USDC locked"],
  ["PR", "#42 merged"],
  ["check", "GitHub verified"],
  ["payout", "sent to contributor"],
  ["proof", "EAS record"],
];

const WORKFLOW_STEPS = [
  {
    n: 1,
    title: "Create reward",
    body: "The maintainer picks an issue and locks USDC.",
    code: "issue + amount",
  },
  {
    n: 2,
    title: "Connect repo",
    body: "The repo sends PullPay a message when a PR is merged.",
    code: "GitHub App or pullpay.yml",
  },
  {
    n: 3,
    title: "Check merge",
    body: "PullPay verifies that the PR was really merged.",
    code: "GitHub API check",
  },
  {
    n: 4,
    title: "Pay contributor",
    body: "USDC goes to the contributor without contributor-paid gas.",
    code: "USDC payout + EAS",
  },
];

const TIER_DATA = [
  {
    icon: GitPullRequest,
    name: "Instant",
    tagline: "Fast payout for rewards funded by one maintainer.",
    signal: "fast",
    stats: [
      ["UMA", "not used first"],
      ["bond", "none"],
      ["fallback", "contributor can escalate"],
    ],
    points: [
      "Use this when the maintainer trusts the normal merge flow.",
      "If payout stalls after the deadline, the contributor can escalate.",
    ],
  },
  {
    icon: Scale,
    name: "Safeguarded",
    tagline: "Extra verification for pooled or higher-risk rewards.",
    signal: "safer",
    stats: [
      ["UMA", "used"],
      ["bond", "required"],
      ["fallback", "dispute window"],
    ],
    points: [
      "PullPay sends the payout request to UMA before payment.",
      "False requests can be disputed before funds move.",
    ],
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <RedirectIfConnected />
      {/* Hero */}
      <section className="dot-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="reveal inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted">
              <span className="shiny">Trust-minimized OSS rewards</span>
              <span className="text-muted">· on Optimism</span>
            </span>
            <h1 className="reveal mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-text sm:text-6xl">
              Merge the PR.
              <br />
              The contributor gets paid.
            </h1>
            <p className="reveal mt-6 max-w-xl text-lg text-muted">
              A maintainer locks USDC in escrow and adds one workflow file. When a
              pull request is merged and verified — decentrally, via UMA — the
              contributor is paid in USDC with no gas, and the work is recorded as
              on-chain reputation.
            </p>
            <div className="reveal mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/create">
                  Create a reward
                  <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={1.75} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/bounties">Explore bounties</Link>
              </Button>
            </div>
          </div>

      <section className="relative overflow-hidden border-b border-border">
        <div className="section-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <Eyebrow>Simple flow</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                Fund an issue. Merge a PR. Pay the contributor.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                PullPay connects GitHub work to an on-chain USDC reward. The
                contributor does not pay gas to receive the payout.
              </p>
            </div>
            <ProofStrip />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {VALUE_CARDS.map((item) => (
              <ValueCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                Four steps from issue to payout.
              </h2>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 font-mono text-sm text-accent hover:text-[#8CB8FF]"
            >
              Technical docs
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((step) => (
              <WorkflowCard key={step.title} {...step} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>Reward modes</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Choose how much verification the reward needs.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {TIER_DATA.map((tier) => (
              <Tier key={tier.name} {...tier} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-center">
            <div>
              <Eyebrow>If payout gets stuck</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                Contributors have a fallback.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                If an Instant reward is not paid after the deadline, the
                contributor can escalate the payout to UMA.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/contributor">Contributor hub</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/docs#edge-cases">View edge cases</Link>
                </Button>
              </div>
            </div>
            <ClaimConsole />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="overflow-hidden rounded-lg border border-[#4285F4]/25 bg-[#1E2329]/75 p-6 text-center shadow-[0_0_36px_rgba(66,133,244,0.12)] backdrop-blur-md md:p-10">
            <div className="mx-auto max-w-2xl">
              <Eyebrow>Start small</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                Try one funded issue first.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                Create one reward, connect the repo, and let a merged PR trigger
                payout.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/create">Create a reward</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/bounties">Browse rewards</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
      {children}
    </span>
  );
}

function ProofStrip() {
  return (
    <div className="rounded-lg border border-[#4285F4]/20 bg-[#1E2329]/70 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <CheckCircle2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
          Current reward state
        </div>
        <span className="font-mono text-[11px] text-muted">example</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {PROOF_EVENTS.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-white/10 bg-[#0B0F14]/55 px-3 py-2"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {label}
            </div>
            <div className="mt-1 truncate font-mono text-sm text-text">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  body,
  meta,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[#4285F4]/18 bg-[#1E2329]/78 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#4285F4]/45 hover:shadow-[0_0_28px_rgba(66,133,244,0.16)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4285F4]/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="grid h-11 w-11 place-items-center rounded-md border border-[#4285F4]/25 bg-[#0B0F14] text-accent shadow-[0_0_18px_rgba(66,133,244,0.12)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-base font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      <div className="mt-5 rounded-md border border-white/10 bg-[#0B0F14]/50 px-3 py-2 font-mono text-xs text-[#8CB8FF]">
        {meta}
      </div>
    </div>
  );
}

function WorkflowCard({
  n,
  title,
  body,
  code,
}: {
  n: number;
  title: string;
  body: string;
  code: string;
}) {
  return (
    <div className="relative rounded-lg border border-border bg-surface p-5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-sm text-accent">0{n}</div>
        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_14px_rgba(66,133,244,0.75)]" />
      </div>
      <h3 className="mt-4 text-base font-medium text-text">{title}</h3>
      <p className="mt-2 min-h-[72px] text-sm leading-6 text-muted">{body}</p>
      <div className="mt-5 rounded-md border border-white/10 bg-[#0B0F14]/55 px-3 py-2 font-mono text-xs text-muted">
        {code}
      </div>
    </div>
  );
}

function Tier({
  icon: Icon,
  name,
  tagline,
  signal,
  stats,
  points,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  name: string;
  tagline: string;
  signal: string;
  stats: string[][];
  points: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md border border-[#4285F4]/25 bg-bg text-accent">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-lg font-medium text-text">{name}</h3>
            <p className="mt-1 text-sm text-muted">{tagline}</p>
          </div>
        </div>
        <span className="rounded-full border border-[#4285F4]/25 bg-[#4285F4]/10 px-2.5 py-1 font-mono text-[11px] text-[#8CB8FF]">
          {signal}
        </span>
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-[#0B0F14]/65 p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {label}
            </div>
            <div className="mt-1 font-mono text-sm text-text">{value}</div>
          </div>
        ))}
      </div>

      <ul className="mt-5 space-y-2.5 text-sm">
        {points.map((point) => (
          <li key={point} className="flex gap-2 text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClaimConsole() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#4285F4]/22 bg-[#1E2329]/76 shadow-[0_0_34px_rgba(66,133,244,0.1)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Lock className="h-4 w-4 text-accent" strokeWidth={1.75} />
          Fallback paths
        </div>
        <span className="font-mono text-[11px] text-muted">after deadline</span>
      </div>
      <div className="grid gap-px bg-white/[0.06]">
        <ConsoleRow label="No linked wallet" value="maintainer can refund" />
        <ConsoleRow label="Instant reward stuck" value="contributor can escalate" />
        <ConsoleRow label="Invalid request" value="funds return" />
        <ConsoleRow label="Valid request" value="contributor paid" />
      </div>
    </div>
  );
}

function ConsoleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#0B0F14]/58 px-4 py-3">
      <span className="font-mono text-xs text-muted">{label}</span>
      <span className="text-right font-mono text-xs text-[#DCE3EA]">
        {value}
      </span>
    </div>
  );
}
