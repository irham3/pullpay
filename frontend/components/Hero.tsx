"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GitPullRequest,
  Rocket,
  ShieldCheck,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";
import { HeroStats } from "@/components/HeroStats";
import { cn } from "@/lib/utils";

const TERMINAL_LINES = [
  "pullpay@optimism:~$ verify-pr --repo pullpay/core --pr 128",
  "github.pr=merged commit=9f21c0a contributor=@devkai [OK]",
  "reward.mode=safeguarded uma_check=passed [OK]",
  "contributor.gas=0 ETH sponsor=pullpay [OK]",
  "usdc.payout=$150.00 status=paid [OK]",
  "eas.proof=queued for @devkai [OK]",
];

const PIPELINE = [
  { label: "PR merged", value: "GitHub checked", icon: GitPullRequest },
  { label: "Extra check", value: "UMA if needed", icon: ShieldCheck },
  { label: "USDC sent", value: "contributor pays 0 gas", icon: Wallet },
  { label: "Proof saved", value: "EAS after payout", icon: CheckCircle2 },
];

const FEED_ITEMS = [
  {
    event: "Contributor paid",
    detail: "$150.00 USDC -> 0x8f2c...a41b",
    meta: "pullpay/core #128",
  },
  {
    event: "Merge checked",
    detail: "UMA check passed",
    meta: "PR was merged",
  },
  {
    event: "Proof saved",
    detail: "EAS record queued",
    meta: "@devkai paid contribution",
  },
];

const QUICK_STEPS = [
  {
    title: "1. Maintainer adds a reward",
    body: "Choose an open GitHub issue and lock USDC for it.",
    icon: Wallet,
  },
  {
    title: "2. Contributor opens a PR",
    body: "Work on the issue and get the pull request merged.",
    icon: GitPullRequest,
  },
  {
    title: "3. PullPay pays",
    body: "PullPay checks the merge, sends USDC, and can save proof.",
    icon: CheckCircle2,
  },
];

type HeroProps = {
  launchHref?: string;
  docsHref?: string;
  className?: string;
};

export function Hero({
  launchHref = "/bounties",
  docsHref = "/docs",
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-[#8B5CF6]/20 bg-[#0B0F14]",
        className
      )}
    >
      <div className="hero-grid absolute inset-0 opacity-55" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/70 to-transparent" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center sm:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#1E2329]/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#AAB4C0] shadow-[0_0_24px_rgba(139,92,246,0.12)] backdrop-blur-md">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.85)]" />
          GitHub issue to merged PR to USDC payout
        </div>

        <h1 className="mt-7 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-tight text-[#F4F7FB] sm:text-6xl">
          Pay open source contributors when their PR is merged on{" "}
          <span className="text-[#8B5CF6] drop-shadow-[0_0_22px_rgba(139,92,246,0.38)]">
            Optimism.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-[#AAB4C0] sm:text-lg">
          Maintainers lock USDC for a GitHub issue. Contributors open a PR. If
          the PR is merged, PullPay checks it and pays the contributor without
          contributor-paid gas.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={launchHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#8B5CF6] px-6 text-sm font-semibold text-white shadow-[0_0_26px_rgba(139,92,246,0.32)] transition-all hover:-translate-y-0.5 hover:bg-[#A78BFA] hover:shadow-[0_0_40px_rgba(139,92,246,0.52)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]"
          >
            <Rocket className="h-4 w-4" strokeWidth={1.75} />
            Launch App
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <DocsLink href={docsHref} />
        </div>

        <QuickSteps />
        <CommandCenter />
        <HeroStats />
      </div>
    </section>
  );
}

function DocsLink({ href }: { href: string }) {
  const className =
    "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#8B5CF6]/25 bg-[#1E2329]/30 px-6 font-mono text-sm text-[#F4F7FB] transition-all hover:border-[#8B5CF6]/55 hover:bg-[#1E2329]/75 hover:shadow-[0_0_24px_rgba(139,92,246,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F14]";

  const content = (
    <>
      <BookOpen className="h-4 w-4" strokeWidth={1.75} />
      Read Docs
    </>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function QuickSteps() {
  return (
    <div className="mt-10 grid w-full gap-3 md:grid-cols-3">
      {QUICK_STEPS.map((step) => {
        const Icon = step.icon;

        return (
          <div
            key={step.title}
            className="rounded-lg border border-[#8B5CF6]/16 bg-[#1E2329]/68 p-4 text-left backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#8B5CF6]/25 bg-[#0B0F14] text-[#8B5CF6] shadow-[0_0_18px_rgba(139,92,246,0.14)]">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-semibold text-[#F4F7FB]">
                {step.title}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#AAB4C0]">
              {step.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CommandCenter() {
  return (
    <div className="mt-12 grid w-full gap-4 text-left lg:grid-cols-[1.25fr_0.75fr]">
      <LiveTerminal />
      <div className="grid gap-4">
        <VerificationPipeline />
        <SettlementFeed />
      </div>
    </div>
  );
}

function LiveTerminal() {
  const [visibleLines, setVisibleLines] = React.useState<string[]>([]);
  const [activeLine, setActiveLine] = React.useState(0);
  const [activeChar, setActiveChar] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(media.matches);

    syncPreference();
    media.addEventListener("change", syncPreference);

    return () => media.removeEventListener("change", syncPreference);
  }, []);

  React.useEffect(() => {
    if (reducedMotion) return;

    const currentLine = TERMINAL_LINES[activeLine];
    const lineComplete = activeChar >= currentLine.length;
    const isLastLine = activeLine === TERMINAL_LINES.length - 1;
    const delay = lineComplete ? (isLastLine ? 1700 : 360) : 18;

    const timer = window.setTimeout(() => {
      if (!lineComplete) {
        setActiveChar((value) => value + 1);
        return;
      }

      if (isLastLine) {
        setVisibleLines([]);
        setActiveLine(0);
        setActiveChar(0);
        return;
      }

      setVisibleLines((lines) => [...lines, currentLine]);
      setActiveLine((line) => line + 1);
      setActiveChar(0);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeChar, activeLine, reducedMotion]);

  const renderedLines = reducedMotion
    ? TERMINAL_LINES
    : [
        ...visibleLines,
        TERMINAL_LINES[activeLine].slice(0, activeChar),
      ].filter(Boolean);

  return (
    <div className="terminal-scanline min-h-[390px] overflow-hidden rounded-lg border border-[#8B5CF6]/28 bg-[#1E2329]/78 shadow-[0_0_44px_rgba(139,92,246,0.12)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-xs text-[#AAB4C0]">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E0B341]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
        </div>
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#8B5CF6]" strokeWidth={1.75} />
          Live Terminal
        </div>
      </div>

      <div className="grid gap-px border-b border-white/10 bg-white/[0.06] sm:grid-cols-3">
        <TerminalMetric label="chain" value="optimism" />
        <TerminalMetric label="bond" value="live" accent="blue" />
        <TerminalMetric label="contributor gas" value="0 ETH" />
      </div>

      <div
        className="min-h-[260px] space-y-2 px-4 py-5 font-mono text-sm leading-6 text-[#DCE3EA] sm:px-6"
        aria-live="polite"
      >
        {renderedLines.map((line, index) => (
          <div key={`${line}-${index}`} className="break-words">
            <TerminalLine line={line} />
            {!reducedMotion && index === renderedLines.length - 1 && (
              <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-[#8B5CF6]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue";
}) {
  return (
    <div className="bg-[#11161D]/70 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#AAB4C0]">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-sm",
          accent === "blue" ? "text-[#8B5CF6]" : "text-[#F4F7FB]"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function VerificationPipeline() {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1E2329]/72 p-4 shadow-[0_0_28px_rgba(139,92,246,0.08)] backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[#F4F7FB]">
          <Activity className="h-4 w-4 text-[#8B5CF6]" strokeWidth={1.75} />
          Payout path
        </div>
        <span className="font-mono text-[11px] text-[#AAB4C0]">live</span>
      </div>

      <div className="mt-5 space-y-4">
        {PIPELINE.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.label} className="relative flex items-center gap-3">
              {index < PIPELINE.length - 1 && (
                <span className="absolute left-[15px] top-8 h-7 w-px bg-gradient-to-b from-[#8B5CF6]/70 to-[#8B5CF6]/20" />
              )}
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#8B5CF6]/25 bg-[#0B0F14] shadow-[0_0_18px_rgba(139,92,246,0.12)]">
                <Icon className="h-4 w-4 text-[#8B5CF6]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#F4F7FB]">
                  {step.label}
                </div>
                <div className="font-mono text-xs text-[#AAB4C0]">
                  {step.value}
                </div>
              </div>
              <CheckCircle2
                className="ml-auto h-4 w-4 text-[#8B5CF6]"
                strokeWidth={1.75}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettlementFeed() {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % FEED_ITEMS.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-white/10 bg-[#1E2329]/72 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[#F4F7FB]">
          <Zap className="h-4 w-4 text-[#8B5CF6]" strokeWidth={1.75} />
          Recent events
        </div>
        <span className="font-mono text-[11px] text-[#AAB4C0]">
          contributor gasless
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {FEED_ITEMS.map((item, index) => {
          const active = index === activeIndex;

          return (
            <div
              key={item.event}
              className={cn(
                "rounded-md border px-3 py-3 transition-all",
                active
                  ? "border-[#8B5CF6]/45 bg-[#8B5CF6]/10 shadow-[0_0_24px_rgba(139,92,246,0.16)]"
                  : "border-white/10 bg-[#0B0F14]/45"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    active ? "bg-[#8B5CF6]" : "bg-[#A78BFA]/60"
                  )}
                />
                <span className="text-sm font-medium text-[#F4F7FB]">
                  {item.event}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs text-[#DCE3EA]">
                {item.detail}
              </div>
              <div className="mt-1 text-xs text-[#AAB4C0]">{item.meta}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TerminalLine({ line }: { line: string }) {
  const okToken = "[OK]";
  const okIndex = line.indexOf(okToken);

  if (okIndex === -1) {
    return <span>{highlightLine(line)}</span>;
  }

  return (
    <>
      <span>{highlightLine(line.slice(0, okIndex))}</span>
      <span className="text-[#8B5CF6] drop-shadow-[0_0_10px_rgba(139,92,246,0.45)]">
        {okToken}
      </span>
      <span>{highlightLine(line.slice(okIndex + okToken.length))}</span>
    </>
  );
}

function highlightLine(line: string) {
  const pieces = line.split(/(0x[a-fA-F0-9.]+|\$[0-9,.]+|@[a-zA-Z0-9_-]+)/g);

  return pieces.map((piece, index) => {
    const key = `${piece}-${index}`;
    if (piece.startsWith("0x")) {
      return (
        <span key={key} className="text-[#8B5CF6]">
          {piece}
        </span>
      );
    }
    if (piece.startsWith("$") || piece.startsWith("@")) {
      return (
        <span key={key} className="text-[#C4B5FD]">
          {piece}
        </span>
      );
    }
    return <React.Fragment key={key}>{piece}</React.Fragment>;
  });
}
