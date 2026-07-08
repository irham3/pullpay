import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  FileCode2,
  GitPullRequest,
  KeyRound,
  ShieldCheck,
  Terminal,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Technical Docs",
  description:
    "Simple technical steps for maintainers and contributors using PullPay.",
};

const MAINTAINER_STEPS = [
  {
    title: "Connect wallet",
    body: "Use the wallet that will pay for the reward. The maintainer signs the funding transactions.",
  },
  {
    title: "Select a GitHub issue",
    body: "Pick an open issue from your repo, or paste a public GitHub issue URL.",
  },
  {
    title: "Set the reward",
    body: "Enter the USDC amount, deadline, optional criteria, and reward mode.",
  },
  {
    title: "Approve and lock USDC",
    body: "Approve USDC, then lock it in escrow. Safeguarded mode also locks a bond.",
  },
  {
    title: "Connect the repo",
    body: "Install the GitHub App or add pullpay.yml so PullPay knows when a PR is merged.",
  },
];

const CONTRIBUTOR_STEPS = [
  {
    title: "Connect wallet",
    body: "Use the wallet that should receive the USDC payout.",
  },
  {
    title: "Link GitHub to wallet",
    body: "Verify your GitHub handle, then sign a message to link it to your wallet.",
  },
  {
    title: "Work on a funded issue",
    body: "Open a funded issue, read the requirements, and submit a pull request.",
  },
  {
    title: "Get the PR merged",
    body: "After merge, the repo notifies PullPay. PullPay checks GitHub again.",
  },
  {
    title: "Receive payout",
    body: "If the payout completes, you receive USDC without paying gas.",
  },
];

const MODES = [
  {
    name: "Instant",
    when: "Use for simple maintainer-funded rewards.",
    mechanics:
      "A merge can trigger payout. If payout stalls after the deadline, the contributor can escalate to UMA.",
  },
  {
    name: "Safeguarded",
    when: "Use when the reward needs extra checks.",
    mechanics:
      "PullPay sends the payout request to UMA before payment. A false request can be disputed.",
  },
];

const yamlExample = `name: PullPay
on:
  pull_request:
    types: [closed]
jobs:
  settle:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Notify PullPay relayer
        run: |
          curl -X POST "https://your-pullpay.app/api/settle" \\
            -H 'Content-Type: application/json' \\
            -d '{
              "rewardId": "0x...",
              "repo": "owner/repo",
              "pr": \${{ github.event.pull_request.number }},
              "issue": 123,
              "author": "\${{ github.event.pull_request.user.login }}"
            }'`;

const settlePayload = `{
  "rewardId": "0x...",
  "repo": "owner/repo",
  "pr": 42,
  "issue": 123,
  "author": "github-username"
}`;

export default function DocsPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border bg-[#0B0F14]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-18">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4285F4]/25 bg-[#1E2329]/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted backdrop-blur-md">
              <Terminal className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
              Technical guide
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-text sm:text-5xl">
              Simple steps for maintainers and contributors.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
              This page explains what each role must do. No product pitch, just
              the steps needed to make a reward work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/create">Create reward</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/bounties">Browse rewards</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-surface p-4 backdrop-blur-md">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                Contents
              </div>
              <nav className="mt-4 grid gap-2 text-sm">
                <Anchor href="#maintainer">Maintainer steps</Anchor>
                <Anchor href="#contributor">Contributor steps</Anchor>
                <Anchor href="#repo-wiring">Connect GitHub</Anchor>
                <Anchor href="#settlement">Reward modes</Anchor>
                <Anchor href="#edge-cases">Fallbacks</Anchor>
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-14">
            <DocSection
              id="maintainer"
              eyebrow="Maintainer"
              title="What the maintainer does"
              body="The maintainer creates the reward and locks USDC. This part uses normal wallet transactions."
            >
              <StepList items={MAINTAINER_STEPS} />
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <InfoTile label="Route" value="/create" />
                <InfoTile label="Token" value="USDC" />
                <InfoTile label="Bond" value="10 USDC in Safeguarded mode" />
              </div>
              <Callout icon={<Wallet className="h-4 w-4" strokeWidth={1.75} />}>
                Gasless only means the contributor does not pay gas to receive
                USDC. The maintainer still signs transactions to fund the reward.
              </Callout>
            </DocSection>

            <DocSection
              id="contributor"
              eyebrow="Contributor"
              title="What the contributor does"
              body="The contributor links GitHub to a wallet, opens a PR, and receives USDC if the PR is merged and the payout completes."
            >
              <StepList items={CONTRIBUTOR_STEPS} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <RequirementCard
                  icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
                  title="GitHub to wallet link"
                  body="The signature proves which wallet should receive payouts for your GitHub handle."
                />
                <RequirementCard
                  icon={<CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />}
                  title="Contributor pays no gas"
                  body="Receiving USDC does not require ETH from the contributor. Other actions may still require wallet transactions."
                />
              </div>
            </DocSection>

            <DocSection
              id="repo-wiring"
              eyebrow="GitHub"
              title="Connect GitHub to PullPay"
              body="PullPay must hear about merged PRs. Use the GitHub App or commit the workflow below."
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <CodeBlock title=".github/workflows/pullpay.yml" code={yamlExample} />
                <div className="space-y-3">
                  <RequirementCard
                    icon={<FileCode2 className="h-4 w-4" strokeWidth={1.75} />}
                    title="Where to put it"
                    body="Commit this file to the same repo as the funded issue."
                  />
                  <RequirementCard
                    icon={<GitPullRequest className="h-4 w-4" strokeWidth={1.75} />}
                    title="When it runs"
                    body="It only calls PullPay after a pull request is closed and merged."
                  />
                  <RequirementCard
                    icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.75} />}
                    title="Safety check"
                    body="PullPay checks GitHub again before payout."
                  />
                </div>
              </div>
              <CodeBlock title="POST /api/settle payload" code={settlePayload} />
            </DocSection>

            <DocSection
              id="settlement"
              eyebrow="Payout"
              title="Choose a reward mode"
              body="Use Instant for simple rewards. Use Safeguarded when the payout needs an UMA check."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {MODES.map((mode) => (
                  <div
                    key={mode.name}
                    className="rounded-lg border border-border bg-surface p-5 backdrop-blur-md"
                  >
                    <div className="font-mono text-xs text-accent">{mode.name}</div>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      <span className="text-text">Use when:</span> {mode.when}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      <span className="text-text">Mechanics:</span>{" "}
                      {mode.mechanics}
                    </p>
                  </div>
                ))}
              </div>
            </DocSection>

            <DocSection
              id="edge-cases"
              eyebrow="Operations"
              title="Fallback actions"
              body="These actions appear on the reward detail page when they apply."
            >
              <div className="grid gap-3">
                <RunbookRow
                  title="Maintainer direct release"
                  actor="Maintainer"
                  detail="For Instant rewards, the maintainer can manually pay a contributor address."
                />
                <RunbookRow
                  title="Settle from PR"
                  actor="Maintainer or relayer"
                  detail="Submit a merged PR number. PullPay verifies it before payout."
                />
                <RunbookRow
                  title="Contributor escalation"
                  actor="Contributor"
                  detail="If an Instant reward is stuck after the deadline, the contributor can escalate to UMA."
                />
                <RunbookRow
                  title="Refund"
                  actor="Maintainer"
                  detail="If no valid payout happens before the deadline, the maintainer can refund."
                />
              </div>
              <Callout
                icon={
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                }
              >
                Each reward should end in one place: paid, rejected, or
                refunded. Avoid duplicate rewards for the same issue unless you
                intentionally want multiple rewards.
              </Callout>
            </DocSection>
          </div>
        </div>
      </section>
    </main>
  );
}

function Anchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-muted hover:text-text" href={href}>
      {children}
    </a>
  );
}

function DocSection({
  id,
  eyebrow,
  title,
  body,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          {eyebrow}
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{body}</p>
      </div>
      {children}
    </section>
  );
}

function StepList({ items }: { items: Array<{ title: string; body: string }> }) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div
          key={item.title}
          className="grid gap-3 rounded-lg border border-border bg-surface p-4 backdrop-blur-md sm:grid-cols-[72px_1fr]"
        >
          <div className="font-mono text-sm text-accent">
            step {index + 1}
          </div>
          <div>
            <h3 className="text-base font-medium text-text">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 backdrop-blur-md">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-1 font-mono text-base text-text">{value}</div>
    </div>
  );
}

function RequirementCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-mono text-xs text-muted">
        <Code2 className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
        {title}
      </div>
      <pre className="overflow-x-auto bg-[#0B0F14]/70 px-4 py-4 font-mono text-xs leading-relaxed text-[#DCE3EA]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RunbookRow({
  title,
  actor,
  detail,
}: {
  title: string;
  actor: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-medium text-text">{title}</h3>
        <span className="rounded-full border border-[#4285F4]/25 bg-[#4285F4]/10 px-2 py-0.5 font-mono text-[11px] text-[#8CB8FF]">
          {actor}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function Callout({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-4 flex gap-3 rounded-lg border border-[#4285F4]/20 bg-[#4285F4]/10 p-4 text-sm leading-6 text-muted">
      <span className="mt-0.5 shrink-0 text-accent">{icon}</span>
      <p>{children}</p>
    </div>
  );
}
