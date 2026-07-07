import { cn } from "@/lib/utils";
import { STATUS_META, signalVar, type UiStatus } from "@/lib/status";

export function StatusPill({
  status,
  className,
  live = false,
}: {
  status: UiStatus;
  className?: string;
  /** Pulse the dot for time-sensitive states (Verifying / Disputed). */
  live?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-text whitespace-nowrap",
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", live && "live-dot")}
        style={{ background: signalVar[meta.dot] }}
      />
      {status}
    </span>
  );
}
