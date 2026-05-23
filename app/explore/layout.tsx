"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Palette, Sun, Moon, Check } from "lucide-react";

const ACCENT_COLORS = [
  { name: "Ungu", hex: "#6D4AFF" },
  { name: "Pink", hex: "#FF007F" },
  { name: "Sian", hex: "#00F0FF" },
  { name: "Hijau", hex: "#39FF14" },
  { name: "Oranye", hex: "#FF5F1F" },
  { name: "Kuning", hex: "#FFEA00" }
];

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [activeColor, setActiveColor] = useState("#6D4AFF");
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  // Load and apply color on mount
  useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem("tiketin-accent-color") || "#6D4AFF";
    setActiveColor(savedColor);
    document.documentElement.style.setProperty("--primary-color", savedColor);
  }, []);

  // Monitor page transitions
  useEffect(() => {
    setIsPageTransitioning(true);
    const timer = setTimeout(() => {
      setIsPageTransitioning(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [pathname]);

  const changeAccentColor = (hex: string) => {
    setActiveColor(hex);
    localStorage.setItem("tiketin-accent-color", hex);
    document.documentElement.style.setProperty("--primary-color", hex);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen">
      {/* Dynamic Main Children Content */}
      {children}

      {/* ── BRUTAL PAGE TRANSITION OVERLAY ── */}
      <AnimatePresence mode="wait">
        {isPageTransitioning && (
          <div className="fixed inset-0 pointer-events-none z-[99999]">
            {/* Block 1: Pitch Black Block */}
            <motion.div
              initial={{ top: "-100%" }}
              animate={{ top: "100%" }}
              exit={{ top: "100%" }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              className="fixed inset-x-0 h-screen bg-[#000000] pointer-events-auto"
            />
            {/* Block 2: Colored Block */}
            <motion.div
              initial={{ top: "-100%" }}
              animate={{ top: "100%" }}
              exit={{ top: "100%" }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.08 }}
              className="fixed inset-x-0 h-screen bg-[var(--primary-color,#6D4AFF)] flex items-center justify-center border-b-8 border-slate-900 pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              <div className="font-black italic text-4xl sm:text-7xl text-white uppercase -skew-x-12 tracking-tighter drop-shadow-[6px_6px_0_#000] select-none text-center px-4">
                LOADING ARENA... ⚡
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FLOATING ACCENT COLOR & THEME SWITCHER WIDGET ── */}
      <div className="fixed bottom-24 right-8 z-[80] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: -1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, rotate: 2 }}
              className="mb-4 bg-white dark:bg-zinc-950 border-4 border-slate-900 dark:border-white p-5 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_var(--primary-color)] w-64 text-left"
            >
              {/* Accent Switcher Header */}
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-400 dark:text-zinc-500 block mb-2">
                  AKSEN NEO-BRUTAL
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {ACCENT_COLORS.map((color) => {
                    const isSelected = activeColor.toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={color.hex}
                        onClick={() => changeAccentColor(color.hex)}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        className={`h-12 w-full border-3 border-slate-900 dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 relative ${
                          isSelected ? "translate-x-[1px] translate-y-[1px] shadow-none" : ""
                        }`}
                      >
                        {isSelected && (
                          <div className="bg-slate-900 text-white dark:bg-white dark:text-black p-0.5 rounded-none border-2 border-slate-900 dark:border-white">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Toggler Header */}
              <div className="border-t-2 border-slate-200 dark:border-zinc-800 pt-4">
                <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-400 dark:text-zinc-500 block mb-2">
                  TEMA MULTIVERSE
                </span>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full py-2.5 px-3 border-3 border-slate-900 dark:border-white bg-amber-400 dark:bg-zinc-900 text-slate-900 dark:text-white font-black italic uppercase text-xs shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_var(--primary-color)] flex items-center justify-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun size={14} strokeWidth={3} className="text-amber-400" />
                      MODE TERANG
                    </>
                  ) : (
                    <>
                      <Moon size={14} strokeWidth={3} className="text-slate-900" />
                      MODE GELAP
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white border-4 border-slate-900 dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_var(--primary-color)] flex items-center justify-center cursor-pointer transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
        >
          <Palette size={24} strokeWidth={3} className={`transition-transform duration-300 ${isOpen ? "rotate-90 text-[var(--primary-color)]" : ""}`} />
        </button>
      </div>
    </div>
  );
}
