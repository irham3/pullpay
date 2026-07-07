import * as React from "react"
import { cn } from "@/lib/utils"

export const STATUS = {
  Open:      { dot: "var(--muted)" },
  Funded:    { dot: "var(--ok)" },
  "In Review":{ dot: "var(--accent)" },
  Verifying: { dot: "var(--warn)" },
  Paid:      { dot: "var(--ok)" },
  Disputed:  { dot: "var(--bad)" },
  Refunded:  { dot: "var(--muted)" },
  Rejected:  { dot: "var(--bad)" },
} as const;

export function StatusPill({ 
  status, 
  className 
}: { 
  status: keyof typeof STATUS,
  className?: string
}) {
  const dotStyle = { background: STATUS[status]?.dot || STATUS.Open.dot };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-text",
      className
    )}>
      <span className="h-1.5 w-1.5 rounded-full" style={dotStyle} />
      {status}
    </span>
  );
}
