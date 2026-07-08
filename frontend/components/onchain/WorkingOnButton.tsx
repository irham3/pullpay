"use client";

import * as React from "react";
import { toggleWorkingOn, isWorkingOn } from "@/lib/localStore";
import { Button } from "@/components/ui/Button";
import { Check, Hand } from "lucide-react";

// Optional, non-binding "I'm working on this" signal (reduces duplicate work).
// Not a claim and not required to get paid — you still just open a PR.
export function WorkingOnButton({ id }: { id: string }) {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read local flag on mount
    setOn(isWorkingOn(id));
  }, [id]);

  return (
    <Button
      variant={on ? "outline" : "ghost"}
      className="w-full"
      onClick={() => setOn(toggleWorkingOn(id))}
    >
      {on ? (
        <>
          <Check className="mr-1.5 h-3.5 w-3.5 text-ok" strokeWidth={2} />
          You’re working on this
        </>
      ) : (
        <>
          <Hand className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
          I’m working on this
        </>
      )}
    </Button>
  );
}
