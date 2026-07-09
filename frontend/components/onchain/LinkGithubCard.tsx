"use client";

import * as React from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Link2, Check, Loader2 } from "lucide-react";

// Links a contributor's verified GitHub account to the wallet that receives USDC.
export function LinkGithubCard() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [handle, setHandle] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [state, setState] = React.useState<"idle" | "signing" | "ok" | "error">(
    "idle"
  );
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)pullpay_gh=([^;]+)/);
    if (m) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read verified handle on mount
      setHandle(decodeURIComponent(m[1]));
      setVerified(true);
    }
  }, []);

  if (!isConnected) return null;

  async function link() {
    if (!handle || !address) return;
    setState("signing");
    setMsg(null);
    try {
      const message = `PullPay: link GitHub @${handle} to wallet ${address}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, address, signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "link failed");
      setState("ok");
      setMsg(`Linked @${handle} to ${address.slice(0, 6)}...`);
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "link failed");
    }
  }

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Link2 className="h-4 w-4 text-muted" strokeWidth={1.5} />
        Link GitHub to wallet
      </div>
      <p className="mt-1.5 text-xs text-muted">
        PullPay uses this to send USDC to the right contributor after merge.
        Receiving the payout costs you no gas.
      </p>

      {verified ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ok">
          <Check className="h-3.5 w-3.5" strokeWidth={2} /> GitHub identity
          verified - @{handle}
        </p>
      ) : (
        <a
          href="/api/github/login"
          className="mt-2 inline-block text-xs text-accent hover:underline"
        >
          Verify with GitHub (required)
        </a>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
          placeholder="verify with GitHub first"
          readOnly={verified}
          disabled={!verified}
        />
        {/* Linking needs a verified GitHub session — the server refuses to map a
            handle the caller hasn't proven, so don't offer a dead button. */}
        <Button
          onClick={link}
          disabled={!verified || !handle || state === "signing"}
          className="shrink-0"
        >
          {state === "signing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === "ok" ? (
            <Check className="h-4 w-4" />
          ) : (
            "Link"
          )}
        </Button>
      </div>
      {msg && (
        <p
          className={`mt-2 text-xs ${state === "error" ? "text-bad" : "text-ok"}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
