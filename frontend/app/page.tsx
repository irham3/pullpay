import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { boardStats } from "@/lib/mock";
import {
  ShieldCheck,
  Award,
  Fuel,
  GitPullRequest,
  Lock,
  Scale,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const stats = boardStats();

  return (
    <main className="flex-1">
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

          {/* Stat row */}
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border bg-border sm:grid-cols-4">
            <HeroStat label="USDC locked" >
              <CountUp value={stats.totalLocked} prefix="$" />
            </HeroStat>
            <HeroStat label="Paid out">
              <CountUp value={stats.paidOut} prefix="$" />
            </HeroStat>
            <HeroStat label="Open bounties">
              <CountUp value={stats.openCount} />
            </HeroStat>
            <HeroStat label="Settlement erosion">
              &lt;<CountUp value={1} suffix="%" />
            </HeroStat>
          </div>
        </div>
      </section>

      {/* Differentiation */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>Why it&apos;s different</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Everyone else trusts a central bot and checks{" "}
            <span className="font-mono text-muted">merged == true</span>.
            PullPay asks a sharper question.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Feature
              icon={<ShieldCheck className="h-5 w-5 text-accent" strokeWidth={1.5} />}
              title="Decentralized verification"
              body="A structured claim — “this PR is merged and meets the criteria” — is asserted to UMA’s Optimistic Oracle with a bond and a challenge window. Anyone eligible can dispute; a neutral judge resolves it. From “is it merged?” to “is it worth paying?”."
            />
            <Feature
              icon={<Award className="h-5 w-5 text-accent" strokeWidth={1.5} />}
              title="Portable on-chain reputation"
              body="Every settled reward mints an EAS attestation — repo, contribution type, amount, date — to the contributor. A verifiable developer CV that no platform owns and no one can fake."
            />
            <Feature
              icon={<Fuel className="h-5 w-5 text-accent" strokeWidth={1.5} />}
              title="Gasless for contributors"
              body="Receiving USDC costs the contributor nothing. If they ever need to sign — to self-claim a stalled reward — an ERC-4337 paymaster sponsors the gas. No ETH, ever."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>How it works</Eyebrow>
          <div className="mt-8 grid gap-px overflow-hidden rounded-[10px] border border-border bg-border md:grid-cols-4">
            <Step
              n={1}
              title="Fund"
              body="Maintainer connects a wallet, approves USDC, and calls createReward. Funds lock in escrow — publicly verifiable."
            />
            <Step
              n={2}
              title="Wire the repo"
              body="Add one pullpay.yml file (or install the GitHub App). It fires when a PR is merged."
            />
            <Step
              n={3}
              title="Verify"
              body="The relayer re-checks the merge via the GitHub API, then asserts eligibility to UMA — with a dispute window."
            />
            <Step
              n={4}
              title="Pay + attest"
              body="No dispute → USDC to the contributor, bond back to the maintainer, and an EAS reputation attestation."
            />
          </div>
        </div>
      </section>

      {/* Two tiers */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Eyebrow>Two tiers</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            A fast lane for trust, a safety net for when it&apos;s absent.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Tier
              icon={<GitPullRequest className="h-5 w-5 text-warn" strokeWidth={1.5} />}
              name="Instant"
              tagline="Maintainer funds from their own wallet and trusts the merge."
              points={[
                "Merge = approval = pay. No oracle, no bond.",
                "Cheapest and fastest — ideal for solo maintainers.",
                "If the maintainer stalls past the grace deadline, the contributor can escalate to UMA.",
              ]}
            />
            <Tier
              icon={<Scale className="h-5 w-5 text-accent" strokeWidth={1.5} />}
              name="Safeguarded"
              tagline="Pool or sponsor funds, or trust is absent."
              points={[
                "UMA asserts eligibility with a bond + challenge window.",
                "Prevents self-dealing; anyone eligible can dispute.",
                "A neutral DVM decides — protecting both funder and contributor.",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Contributor protection */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <Eyebrow>Contributor protection</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                The contributor is a first-class claimant — not a passive
                recipient.
              </h2>
              <p className="mt-4 text-muted">
                If the work is merged and meets the criteria but payment never
                comes, the contributor can initiate their own assertion — “PR #X
                is merged and meets the criteria, pay me” — post a bond, and let a
                neutral judge decide. Honest claims cost nothing net. No dependency
                on the maintainer&apos;s goodwill.
              </p>
            </div>
            <div className="rounded-[10px] border border-border bg-surface p-6">
              <div className="flex items-center gap-2 text-sm text-text">
                <Lock className="h-4 w-4 text-ok" strokeWidth={1.5} />
                Funds are never stuck
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-ok">→</span> No mapped wallet by the
                  deadline? The maintainer refunds.
                </li>
                <li className="flex gap-2">
                  <span className="text-ok">→</span> Dispute proves the claim
                  false? Reward + bond return to the funder.
                </li>
                <li className="flex gap-2">
                  <span className="text-ok">→</span> Every path converges on one
                  settlement, one attestation.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Fund your first bounty in a minute.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Lock USDC once. The rest — verification, payout, reputation — is
            automatic.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/create">Create a reward</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/bounties">Browse the board</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </span>
  );
}

function HeroStat({
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

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-6">
      <div className="grid h-10 w-10 place-items-center rounded-[8px] border border-border bg-bg">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-medium text-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-surface p-6">
      <div className="font-mono text-sm text-accent">0{n}</div>
      <h3 className="mt-3 text-base font-medium text-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Tier({
  icon,
  name,
  tagline,
  points,
}: {
  icon: React.ReactNode;
  name: string;
  tagline: string;
  points: string[];
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-6">
      <div className="flex items-center gap-2.5">
        {icon}
        <h3 className="text-lg font-medium text-text">{name}</h3>
      </div>
      <p className="mt-2 text-sm text-muted">{tagline}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {points.map((p) => (
          <li key={p} className="flex gap-2 text-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
