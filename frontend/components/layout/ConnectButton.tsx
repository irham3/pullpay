"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import { truncateAddr } from "@/lib/format";
import { Wallet } from "lucide-react";

// Custom-rendered RainbowKit connect button so it matches our design tokens
// instead of RainbowKit's default pill (DESIGN.md §4.1).
export function ConnectButton() {
  return (
    <RKConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-accent px-3.5 text-sm font-medium text-[#0B0B0C] transition-all hover:bg-accent-hover hover:-translate-y-px"
                  >
                    <Wallet className="h-4 w-4" strokeWidth={1.75} />
                    Connect
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex h-9 items-center rounded-[6px] border border-bad px-3.5 text-sm text-bad transition-colors hover:bg-[color-mix(in_srgb,var(--bad)_10%,transparent)]"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden h-9 items-center gap-1.5 rounded-[6px] border border-border px-2.5 text-xs text-muted transition-colors hover:text-text hover:bg-surface-2 sm:inline-flex"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--ok)" }}
                    />
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-border px-3 font-mono text-sm text-text transition-colors hover:bg-surface-2"
                  >
                    {truncateAddr(account.address)}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RKConnectButton.Custom>
  );
}
