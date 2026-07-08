"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wrench, Code2 } from "lucide-react";

// Switch between the two role areas. One wallet can be both — this only changes
// which view you're managing (funding vs contributing).
const TABS = [
  { href: "/maintainer", label: "Maintainer", icon: Wrench },
  { href: "/contributor", label: "Contributor", icon: Code2 },
];

export function RoleTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex items-center gap-1 rounded-[8px] border border-border bg-surface p-1">
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent text-[#0B0B0C] font-medium"
                : "text-muted hover:text-text hover:bg-surface-2"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
