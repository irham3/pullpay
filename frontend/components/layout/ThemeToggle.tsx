"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";

// Dark-first with a light option (DESIGN.md §1). Persists to localStorage and
// stamps data-theme on <html> so CSS vars flip.
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    const stored = localStorage.getItem("pullpay-theme") as
      | "dark"
      | "light"
      | null;
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync stored theme preference on mount
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("pullpay-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="grid h-9 w-9 place-items-center rounded-[6px] border border-border text-muted transition-colors hover:text-text hover:bg-surface-2"
    >
      {theme === "dark" ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      )}
    </button>
  );
}
