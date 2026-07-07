import { cn } from "@/lib/utils";

// Eyebrow + big mono number tile for hero/dashboard KPIs.
export function StatCard({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-border bg-surface p-4",
        className
      )}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1.5 font-mono tnum text-2xl text-text">{children}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
