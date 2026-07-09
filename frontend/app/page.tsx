import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Fuel,
  GitPullRequest,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroStats } from "@/components/HeroStats";

import Aurora from "@/components/reactbits/Aurora";
import ClickSpark from "@/components/reactbits/ClickSpark";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import StarBorder from "@/components/reactbits/StarBorder";

const AURORA_STOPS = ["#2E1065", "#8B5CF6", "#F0ABFC"];

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

const TERMINAL_LINES = [
  ["repo", "pullpay/core"],
  ["issue", "#128 funded"],
  ["merge", "PR #42 verified"],
  ["payout", "$150 USDC sent"],
  ["gas", "0 ETH contributor cost"],
];

export default function Home() {
  return (
    <ClickSpark
      className="flex-1"
      sparkColor="#C084FC"
      sparkCount={9}
      sparkRadius={24}
      sparkSize={8}
    >
      <main className="flex-1 overflow-hidden">


        <section className="relative isolate overflow-hidden border-b border-border bg-bg">
          <div className="absolute inset-0 opacity-80">
            <Aurora
              colorStops={AURORA_STOPS}
              amplitude={0.95}
              blend={0.44}
              speed={0.55}
            />
          </div>
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(192,132,252,0.18),transparent_34%),linear-gradient(180deg,rgba(16,10,26,0.42),#100A1A_88%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C084FC]/80 to-transparent" />

          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <span className="reveal inline-flex items-center gap-2 rounded-full border border-[#C084FC]/30 bg-surface/65 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#D8B4FE] shadow-[0_0_28px_rgba(139,92,246,0.18)] backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                Trust-minimized OSS rewards on Optimism
              </span>

              <h1 className="reveal mt-7 max-w-4xl text-4xl font-semibold leading-[1.04] text-text sm:text-6xl">
                Merge the PR.
                <br />
                <span className="bg-gradient-to-r from-[#F5F3FF] via-[#C084FC] to-[#A78BFA] bg-clip-text text-transparent">
                  The contributor gets paid.
                </span>
              </h1>

              <p className="reveal mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
                A maintainer locks USDC in escrow and adds one workflow file.
                When a pull request is merged and verified through GitHub and
                UMA, the contributor gets paid in USDC with no gas cost.
              </p>

              <div className="reveal mt-8 flex flex-wrap items-center gap-3">
                <StarBorder
                  color="#C084FC"
                  speed="5s"
                  thickness={1}
                  innerClassName="transition-colors hover:bg-[#21152F]"
                >
                  <Link
                    href="/create"
                    className="inline-flex h-11 items-center justify-center gap-2 px-6 text-sm font-semibold"
                  >
                    Create a reward
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </Link>
                </StarBorder>

                <Button asChild variant="outline" size="lg">
                  <Link href="/bounties">Explore bounties</Link>
                </Button>
              </div>
            </div>

            <HeroConsole />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 pb-14">
            <HeroStats />
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-border">
          <div className="section-grid absolute inset-0 opacity-35" />
          <div className="relative mx-auto max-w-6xl px-6 py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <Eyebrow>Simple flow</Eyebrow>
                <h2 className="mt-3 text-2xl font-semibold text-text sm:text-3xl">
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
                <h2 className="mt-3 max-w-2xl text-2xl font-semibold text-text sm:text-3xl">
                  Four steps from issue to payout.
                </h2>
              </div>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 font-mono text-sm text-accent hover:text-[#C4B5FD]"
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
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold text-text sm:text-3xl">
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
                <h2 className="mt-3 text-2xl font-semibold text-text sm:text-3xl">
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
            <div className="overflow-hidden rounded-lg border border-[#C084FC]/25 bg-surface/75 p-6 text-center shadow-[0_0_36px_rgba(139,92,246,0.14)] backdrop-blur-md md:p-10">
              <div className="mx-auto max-w-2xl">
                <Eyebrow>Start small</Eyebrow>
                <h2 className="mt-3 text-2xl font-semibold text-text sm:text-3xl">
                  Try one funded issue first.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                  Create one reward, connect the repo, and let a merged PR
                  trigger payout.
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
    </ClickSpark>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
      {children}
    </span>
  );
}

function HeroConsole() {
  return (
    <div className="terminal-scanline reveal overflow-hidden rounded-lg border border-[#C084FC]/24 bg-surface/78 shadow-[0_0_44px_rgba(139,92,246,0.16)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#C084FC]" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok" />
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-muted">
          <Terminal className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          payout trace
        </div>
      </div>

      <div className="grid gap-px bg-white/[0.06] sm:grid-cols-3">
        <TerminalMetric label="chain" value="optimism" />
        <TerminalMetric label="escrow" value="funded" />
        <TerminalMetric label="gas" value="0 ETH" />
      </div>

      <div className="space-y-3 px-4 py-5 font-mono text-sm leading-6 sm:px-6">
        {TERMINAL_LINES.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-bg/55 px-3 py-2"
          >
            <span className="text-muted">{label}</span>
            <span className="text-right text-text">{value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3 rounded-md border border-[#C084FC]/20 bg-[#8B5CF6]/10 px-3 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[#C084FC]/14 text-[#E9D5FF]">
            <Wallet className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <div className="text-sm font-medium text-text">
              Settlement ready
            </div>
            <div className="font-mono text-xs text-muted">
              funds move after verified merge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg/60 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-text">{value}</div>
    </div>
  );
}

function ProofStrip() {
  return (
    <div className="rounded-lg border border-[#C084FC]/20 bg-surface/70 p-4 backdrop-blur-md">
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
            className="rounded-md border border-white/10 bg-bg/55 px-3 py-2"
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
    <SpotlightCard
      className="h-full bg-surface/78 transition-all hover:-translate-y-1 hover:border-[#C084FC]/45 hover:shadow-[0_0_28px_rgba(139,92,246,0.16)]"
      spotlightColor="rgba(192, 132, 252, 0.22)"
    >
      <div className="grid h-11 w-11 place-items-center rounded-md border border-[#C084FC]/25 bg-bg text-accent shadow-[0_0_18px_rgba(139,92,246,0.12)]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-base font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      <div className="mt-5 rounded-md border border-white/10 bg-bg/50 px-3 py-2 font-mono text-xs text-[#C4B5FD]">
        {meta}
      </div>
    </SpotlightCard>
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
    <SpotlightCard
      className="h-full bg-surface/85"
      spotlightColor="rgba(139, 92, 246, 0.2)"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-sm text-accent">0{n}</div>
        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_14px_rgba(139,92,246,0.75)]" />
      </div>
      <h3 className="mt-4 text-base font-medium text-text">{title}</h3>
      <p className="mt-2 min-h-[72px] text-sm leading-6 text-muted">{body}</p>
      <div className="mt-5 rounded-md border border-white/10 bg-bg/55 px-3 py-2 font-mono text-xs text-muted">
        {code}
      </div>
    </SpotlightCard>
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
          <span className="grid h-10 w-10 place-items-center rounded-md border border-[#C084FC]/25 bg-bg text-accent">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-lg font-medium text-text">{name}</h3>
            <p className="mt-1 text-sm text-muted">{tagline}</p>
          </div>
        </div>
        <span className="rounded-full border border-[#C084FC]/25 bg-[#8B5CF6]/10 px-2.5 py-1 font-mono text-[11px] text-[#C4B5FD]">
          {signal}
        </span>
      </div>

      <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-bg/65 p-3">
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
    <div className="overflow-hidden rounded-lg border border-[#C084FC]/22 bg-surface/76 shadow-[0_0_34px_rgba(139,92,246,0.12)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <Lock className="h-4 w-4 text-accent" strokeWidth={1.75} />
          Fallback paths
        </div>
        <span className="font-mono text-[11px] text-muted">
          after deadline
        </span>
      </div>
      <div className="grid gap-px bg-white/[0.06]">
        <ConsoleRow label="No linked wallet" value="maintainer can refund" />
        <ConsoleRow
          label="Instant reward stuck"
          value="contributor can escalate"
        />
        <ConsoleRow label="Invalid request" value="funds return" />
        <ConsoleRow label="Valid request" value="contributor paid" />
      </div>
    </div>
  );
}

function ConsoleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-bg/58 px-4 py-3">
      <span className="font-mono text-xs text-muted">{label}</span>
      <span className="text-right font-mono text-xs text-text">{value}</span>
    </div>
  );
}
