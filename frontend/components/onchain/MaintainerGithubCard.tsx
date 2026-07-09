"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Check } from "lucide-react";

// lucide-react doesn't include brand icons — inline the GitHub mark.
function GithubIcon({ className, ...props }: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 0 1 1.24 3.22c0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .31.22.69.83.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function MaintainerGithubCard() {
  const { isConnected } = useAccount();
  const [handle, setHandle] = React.useState("");
  const [showDisconnect, setShowDisconnect] = React.useState(false);

  React.useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)pullpay_gh=([^;]+)/);
    if (m) {
      setTimeout(() => {
        setHandle(decodeURIComponent(m[1]));
      }, 0);
    }
  }, []);

  if (!isConnected) return null;

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <GithubIcon className="h-4 w-4 text-muted" strokeWidth={1.5} />
        GitHub Connection
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Connect your GitHub account to allow PullPay to track merged pull requests and manage your bounties.
      </p>

      {handle ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-sm text-ok">
            <Check className="h-4 w-4" strokeWidth={2} /> Connected as @{handle}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDisconnect(true)}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <Button asChild className="w-full sm:w-auto">
            <a href="/api/github/login?next=/maintainer">
              Connect GitHub
            </a>
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={showDisconnect}
        onClose={() => setShowDisconnect(false)}
        onConfirm={() => {
          fetch("/api/github/logout", { method: "POST" }).finally(() => {
            document.cookie = "pullpay_gh=; max-age=0; path=/";
            window.location.reload();
          });
        }}
        title="Disconnect GitHub"
        description="Are you sure you want to disconnect your GitHub account? You will need to reconnect to create rewards for your repositories."
        confirmText="Disconnect"
        destructive
      />
    </div>
  );
}
