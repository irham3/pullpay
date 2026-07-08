"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import { truncateAddr } from "@/lib/format";
import { Wallet } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useDisconnect } from "wagmi";

// Custom-rendered RainbowKit connect button so it matches our design tokens
// instead of RainbowKit's default pill (DESIGN.md §4.1).
export function ConnectButton() {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <RKConnectButton.Custom>
      {({
        account,
        chain,
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
                    className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-accent px-3.5 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:-translate-y-px"
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
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown((prev) => !prev)}
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-border px-3 font-mono text-sm text-text transition-colors hover:bg-surface-2"
                    >
                      {truncateAddr(account.address)}
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-56 rounded-[10px] border border-border bg-surface p-2 shadow-xl z-50">
                        <div className="flex flex-col px-2 py-1.5">
                          <span className="text-xs font-medium text-muted">Connected Wallet</span>
                          <span className="font-mono text-sm text-text mt-0.5">
                            {account.displayName}
                          </span>
                          {account.displayBalance && (
                            <span className="text-xs text-muted mt-1">
                              {account.displayBalance}
                            </span>
                          )}
                        </div>
                        <div className="my-1.5 h-px w-full bg-border" />
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            setShowDisconnect(true);
                          }}
                          className="w-full rounded-[6px] px-2 py-1.5 text-left text-sm font-medium text-bad hover:bg-[color-mix(in_srgb,var(--bad)_10%,transparent)] transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                  <ConfirmModal
                    isOpen={showDisconnect}
                    onClose={() => setShowDisconnect(false)}
                    onConfirm={() => disconnect()}
                    title="Disconnect Wallet"
                    description="Are you sure you want to disconnect your wallet?"
                    confirmText="Disconnect"
                    destructive
                  />
                </div>
              );
            })()}
          </div>
        );
      }}
    </RKConnectButton.Custom>
  );
}
