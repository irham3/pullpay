"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { ThemeToggle } from "./ThemeToggle";
import { NetworkBanner } from "./NetworkBanner";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/bounties", label: "Bounties" },
  { href: "/maintainer", label: "Maintainer" },
  { href: "/contributor", label: "Contributor" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="PullPay home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[6px] px-3 py-1.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "text-text bg-surface-2"
                    : "text-muted hover:text-text"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectButton />
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted md:hidden"
          >
            {open ? (
              <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
            ) : (
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border px-6 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-[6px] px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "text-text bg-surface-2"
                  : "text-muted hover:text-text"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      <NetworkBanner />
    </header>
  );
}
