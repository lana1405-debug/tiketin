"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      // Gaya brutalist untuk tombol toggle
      className="border-4 border-slate-900 shadow-[4px_4px_0_0_#000] dark:border-amber-400 dark:shadow-[4px_4px_0_0_#FBBF24] rounded-none bg-white dark:bg-slate-900"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-900" strokeWidth={3} />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-amber-400" strokeWidth={3} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}