import { StatusPill, STATUS } from "@/components/ui/StatusPill";
import { usd } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const MOCK_BOUNTIES: { id: string; repo: string; issue: number; amount: number; status: keyof typeof STATUS; deadline: string }[] = [
  { id: "0x123...abc", repo: "irham3/pullpay", issue: 12, amount: 250, status: "Funded", deadline: "2024-12-01" },
  { id: "0x456...def", repo: "facebook/react", issue: 24501, amount: 1000, status: "Paid", deadline: "2024-11-15" },
  { id: "0x789...ghi", repo: "ethereum/go-ethereum", issue: 501, amount: 500, status: "Verifying", deadline: "2024-11-20" },
];

export default function BountiesPage() {
  return (
    <main className="flex-1 p-8 md:p-12 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Bounty Board</h1>
          <p className="text-muted text-sm mt-1">Discover and claim open source rewards.</p>
        </div>
        <Button asChild>
          <Link href="/create">Create Reward</Link>
        </Button>
      </div>

      <div className="rounded-[10px] border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-surface-2/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium text-muted uppercase tracking-wider text-[11px]">Repository</th>
              <th className="px-6 py-4 font-medium text-muted uppercase tracking-wider text-[11px]">Issue</th>
              <th className="px-6 py-4 font-medium text-muted uppercase tracking-wider text-[11px] text-right">Amount (USDC)</th>
              <th className="px-6 py-4 font-medium text-muted uppercase tracking-wider text-[11px]">Status</th>
              <th className="px-6 py-4 font-medium text-muted uppercase tracking-wider text-[11px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_BOUNTIES.map((b) => (
              <tr key={b.id} className="hover:bg-surface-2/30 transition-colors">
                <td className="px-6 py-4 font-mono text-text">{b.repo}</td>
                <td className="px-6 py-4 font-mono text-muted">#{b.issue}</td>
                <td className="px-6 py-4 font-mono tnum text-right text-text">{usd(b.amount)}</td>
                <td className="px-6 py-4">
                  <StatusPill status={b.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
