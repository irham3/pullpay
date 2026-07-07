import { cn } from "@/lib/utils";

// The ⑃ shunt/split mark — a single path that forks, echoing "one input, split
// into lanes". Drawn with the accent, hairline stroke.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="text-accent"
      >
        <path
          d="M12 21V13M12 13L5 4M12 13L19 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="21" r="1.6" fill="currentColor" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight text-text">
        PullPay
      </span>
    </span>
  );
}
