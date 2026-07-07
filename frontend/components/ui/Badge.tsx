import { cn } from "@/lib/utils";

// Small, quiet label chips (language, repo tags). Signal via a dot, not fill.
export function Badge({
  children,
  className,
  dot,
}: {
  children: React.ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted",
        className
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dot }}
        />
      )}
      {children}
    </span>
  );
}
