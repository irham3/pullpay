"use client";

import * as React from "react";
import { formatDuration } from "@/lib/format";

// Live countdown to a unix-seconds target (UMA liveness / DVM timers, PRD §25.3).
export function Countdown({
  target,
  className,
  onDone,
}: {
  target: number;
  className?: string;
  onDone?: () => void;
}) {
  const [remaining, setRemaining] = React.useState(() =>
    Math.max(0, target - Math.floor(Date.now() / 1000))
  );

  React.useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, target - Math.floor(Date.now() / 1000));
      setRemaining(r);
      if (r === 0) {
        clearInterval(t);
        onDone?.();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [target, onDone]);

  return (
    <span className={className}>
      <span className="font-mono tnum">{formatDuration(remaining)}</span>
    </span>
  );
}
