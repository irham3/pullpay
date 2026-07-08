"use client";

import * as React from "react";

// Adds a smooth transition animation to all route changes.
// Using template.tsx instead of layout.tsx ensures the component is re-mounted
// (and animation re-triggered) on every navigation.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out flex-1 flex flex-col">
      {children}
    </div>
  );
}
