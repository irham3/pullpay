import { Check } from "lucide-react";
import { LIFECYCLE, type UiStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

// Reward lifecycle stepper (PRD §25.2). Highlights the reached phase; terminal
// off-path states (Disputed / Rejected / Refunded) render as a callout row.
const OFF_PATH: Record<string, { label: string; tone: string }> = {
  Disputed: { label: "Disputed — DVM voting in progress", tone: "var(--bad)" },
  Rejected: { label: "Rejected — funds returned to funder", tone: "var(--bad)" },
  Refunded: { label: "Refunded — deadline passed", tone: "var(--muted)" },
  "Changes Requested": {
    label: "Changes requested on the PR",
    tone: "var(--warn)",
  },
};

export function Lifecycle({ status }: { status: UiStatus }) {
  const offPath = OFF_PATH[status];
  // Where on the happy path are we? Verifying maps between Merged and Paid.
  const activeIndex = (() => {
    if (status === "Paid") return LIFECYCLE.length - 1;
    if (status === "Disputed") return LIFECYCLE.indexOf("Verifying");
    if (status === "Refunded" || status === "Rejected") return 0;
    if (status === "Changes Requested") return LIFECYCLE.indexOf("In Review");
    const i = LIFECYCLE.indexOf(status);
    return i === -1 ? 0 : i;
  })();

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5">
      <div className="mb-4 text-[11px] font-medium uppercase tracking-wider text-muted">
        Lifecycle
      </div>
      <ol className="space-y-0">
        {LIFECYCLE.map((phase, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex && !offPath;
          const last = i === LIFECYCLE.length - 1;
          return (
            <li key={phase} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[11px]",
                    done && "border-ok text-ok",
                    current && "border-accent text-accent",
                    !done && !current && "border-border text-muted"
                  )}
                  style={
                    current
                      ? { boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)" }
                      : undefined
                  }
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    i + 1
                  )}
                </span>
                {!last && (
                  <span
                    className={cn(
                      "my-0.5 w-px flex-1",
                      i < activeIndex ? "bg-ok/50" : "bg-border"
                    )}
                    style={{ minHeight: 20 }}
                  />
                )}
              </div>
              <div className={cn("pb-4", last && "pb-0")}>
                <div
                  className={cn(
                    "text-sm",
                    current ? "text-text font-medium" : done ? "text-text" : "text-muted"
                  )}
                >
                  {phase}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {offPath && (
        <div
          className="mt-2 flex items-center gap-2 rounded-[6px] border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, " + offPath.tone + " 40%, transparent)",
            background: "color-mix(in srgb, " + offPath.tone + " 8%, transparent)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: offPath.tone }}
          />
          <span className="text-text">{offPath.label}</span>
        </div>
      )}
    </div>
  );
}
