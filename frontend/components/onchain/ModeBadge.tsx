import { Zap, ShieldCheck } from "lucide-react";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/utils";

// Instant = trust the merge (no oracle). Safeguarded = UMA-backed (PRD §24).
export function ModeBadge({
  mode,
  className,
}: {
  mode: Mode;
  className?: string;
}) {
  const instant = mode === "Instant";
  return (
    <span
      title={
        instant
          ? "Instant — maintainer trusts the merge; direct release, no oracle."
          : "Safeguarded — verified through UMA with a dispute window."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted",
        className
      )}
    >
      {instant ? (
        <Zap className="h-3 w-3 text-warn" strokeWidth={1.75} />
      ) : (
        <ShieldCheck className="h-3 w-3 text-accent" strokeWidth={1.75} />
      )}
      {mode}
    </span>
  );
}
