import { cn } from "@/lib/utils";

// The ⑃ shunt/split mark — a single path that forks, echoing "one input, split
// into lanes". Drawn with the accent, hairline stroke.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src="/logo.svg" alt="PullPay Logo" className="h-6 w-auto" />
      <span className="text-[15px] font-semibold tracking-tight text-text">
        PullPay
      </span>
    </span>
  );
}
