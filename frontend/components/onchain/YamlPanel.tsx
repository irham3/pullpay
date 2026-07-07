"use client";

import * as React from "react";
import type { Bounty } from "@/lib/types";
import { Check, Copy, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Generates the per-reward `pullpay.yml` a maintainer drops into their repo
// (PRD §11 example / §26). Bound to this reward's id, so a merged PR triggers
// the relayer to settle exactly this bounty.
export function YamlPanel({ bounty }: { bounty: Bounty }) {
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState("https://your-pullpay.app");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read window origin on mount
    setOrigin(window.location.origin);
  }, []);

  const yaml = `name: PullPay
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
          curl -X POST "${origin}/api/settle" \\
            -H 'Content-Type: application/json' \\
            -d '{
              "rewardId": "${bounty.id}",
              "repo": "${bounty.repo}",
              "pr": \${{ github.event.pull_request.number }},
              "issue": ${bounty.issueNumber},
              "author": "\${{ github.event.pull_request.user.login }}"
            }'`;

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-[10px] border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-text">
          <FileCode2 className="h-4 w-4 text-accent" strokeWidth={1.5} />
          Wire the repo — <span className="font-mono">.github/workflows/pullpay.yml</span>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[6px] border border-border px-2.5 py-1 text-xs transition-colors",
            copied ? "text-ok" : "text-muted hover:text-text hover:bg-surface-2"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={1.5} /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-muted">
        <code>{yaml}</code>
      </pre>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted">
        Commit this file to <span className="font-mono text-text">{bounty.repo}</span>.
        On merge it pings the relayer, which re-verifies via the GitHub API before
        settling.
      </p>
    </div>
  );
}
