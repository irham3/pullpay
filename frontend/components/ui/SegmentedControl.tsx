"use client";

import { cn } from "@/lib/utils";

export interface Segment<T extends string | number> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  segments,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  segments: Segment<T>[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 rounded-[6px] border border-border bg-bg p-1",
        className
      )}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={String(s.value)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "flex-1 rounded-[4px] px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent text-[#0B0B0C] font-medium"
                : "text-muted hover:text-text hover:bg-surface-2"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
