import type { Metadata } from "next";
import { getProfile } from "@/lib/mock";
import { StatCard } from "@/components/onchain/StatCard";
import { AddressChip } from "@/components/onchain/AddressChip";
import { Badge } from "@/components/ui/Badge";
import { truncateAddr, timeFromNow, usd } from "@/lib/format";
import { explorerTx } from "@/lib/explorer";
import { Award, ExternalLink } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const p = getProfile(address);
  const name = p.handle ? `@${p.handle}` : truncateAddr(address);
  return {
    title: `${name} — contributor reputation`,
    description: `On-chain contribution reputation for ${name}, built from EAS attestations.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const profile = getProfile(address);
  const hasData = profile.attestations.length > 0;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      {/* Identity */}
      <div className="flex items-center gap-4">
        <div
          className="grid h-14 w-14 place-items-center rounded-full border border-border text-lg font-semibold text-accent"
          style={{
            background:
              "color-mix(in srgb, var(--accent) 10%, var(--surface))",
          }}
        >
          {(profile.handle || address).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text">
            {profile.handle ? `@${profile.handle}` : "Contributor"}
          </h1>
          <div className="mt-1">
            <AddressChip value={address} />
          </div>
        </div>
      </div>

      {/* Reputation stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total earned">
          {usd(profile.totalEarned)}
        </StatCard>
        <StatCard label="Contributions">{profile.contributions}</StatCard>
        <StatCard label="Repositories">{profile.reposCount}</StatCard>
      </div>

      {/* Attestations */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-accent" strokeWidth={1.5} />
          <h2 className="text-sm font-medium text-text">
            EAS attestations
          </h2>
          <span className="text-xs text-muted">
            portable, verifiable, non-revocable
          </span>
        </div>

        {!hasData ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center text-sm text-muted">
            No attestations yet for {truncateAddr(address)}. Contributions land
            here once a reward settles.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Repository</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profile.attestations.map((a) => (
                  <tr key={a.uid} className="hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <span className="font-mono text-text">{a.repo}</span>
                      <span className="ml-1 font-mono text-muted">
                        #{a.issueNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{a.contributionType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tnum text-text">
                      {usd(a.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {timeFromNow(a.date)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={explorerTx(a.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted hover:text-text"
                      >
                        {a.uid.slice(0, 8)}…
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
