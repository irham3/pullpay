import Link from "next/link";
import { Logo } from "./Logo";
import { DEMO_MODE } from "@/lib/contracts/addresses";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">
            Maintainers lock USDC for GitHub issues. Contributors get paid after
            their PR is merged, without paying gas to receive the payout.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/bounties" className="text-muted hover:text-text">
            Rewards
          </Link>
          <Link href="/create" className="text-muted hover:text-text">
            Create reward
          </Link>
          <Link href="/dashboard" className="text-muted hover:text-text">
            Dashboard
          </Link>
          <Link href="/docs" className="text-muted hover:text-text">
            Docs
          </Link>
          <a
            href="https://docs.uma.xyz"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-text"
          >
            UMA docs
          </a>
          <a
            href="https://docs.attest.sh"
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-text"
          >
            EAS docs
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-xs text-muted">
          <span className="font-mono">fund issue | verify merge | pay USDC</span>
          {DEMO_MODE && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--warn)" }}
              />
              Demo mode: sample on-chain data
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
