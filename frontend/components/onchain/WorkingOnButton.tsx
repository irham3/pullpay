"use client";

import * as React from "react";
import { toggleWorkingOn, isWorkingOn } from "@/lib/localStore";
import { Button } from "@/components/ui/Button";
import { Check, Hand } from "lucide-react";

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
          Marked as working
        </>
      ) : (
        <>
          <Hand className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
          Mark as working
        </>
      )}
    </Button>
  );
}
