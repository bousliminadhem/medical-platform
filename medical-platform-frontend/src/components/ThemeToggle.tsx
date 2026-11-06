"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        "group relative inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all duration-200",
        isDark
          ? "border-white/[0.1] bg-obsidian-850/80 text-zinc-300 hover:border-white/[0.2] hover:text-white"
          : "border-zinc-300 bg-white/90 text-zinc-700 hover:border-zinc-400 hover:text-zinc-950 shadow-sm",
        className
      )}
      title={isDark ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
      aria-label="Toggle theme mode"
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-teal-400 transition-transform duration-200 group-hover:-rotate-12" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500 transition-transform duration-200 group-hover:rotate-45" />
        )}
      </div>

      {showLabel && (
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
          {isDark ? "Dark View" : "Light View"}
        </span>
      )}
    </button>
  );
}

