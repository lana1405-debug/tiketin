"use client";

import { useState, useEffect, useRef } from "react";
import { Palette } from "lucide-react";

const ACCENT_COLORS = [
  { name: "Ungu",   value: "#6D4AFF" },
  { name: "Pink",   value: "#FF007F" },
  { name: "Sian",   value: "#00F0FF" },
  { name: "Hijau",  value: "#39FF14" },
  { name: "Oranye", value: "#FF5F1F" },
  { name: "Kuning", value: "#FFEA00" },
];

const STORAGE_KEY = "tiketin-accent-color";
const DEFAULT_COLOR = "#6D4AFF";

export function applyAccentColor(color: string) {
  document.documentElement.style.setProperty("--primary-color", color);
  document.documentElement.style.setProperty("--primary", color);
  document.documentElement.style.setProperty("--ring", color);
}

export function getStoredAccentColor(): string {
  if (typeof window === "undefined") return DEFAULT_COLOR;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_COLOR;
}

export function useAccentColor() {
  useEffect(() => {
    const stored = getStoredAccentColor();
    applyAccentColor(stored);
  }, []);
}

export function AccentColorPicker({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredAccentColor();
    setActiveColor(stored);
    applyAccentColor(stored);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (color: string) => {
    setActiveColor(color);
    applyAccentColor(color);
    localStorage.setItem(STORAGE_KEY, color);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        title="Pilih warna aksen"
        className="border-4 border-slate-900 dark:border-zinc-700 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff2] rounded-none w-10 h-10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ backgroundColor: activeColor }}
        aria-label="Pilih warna tema"
      >
        <Palette size={18} className="text-white" strokeWidth={3} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute right-0 top-12 z-[200] bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-700 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#6D4AFF] p-3 min-w-[200px]"
          style={{ animation: "dropIn 0.15s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-8px) scale(0.95); }
              to   { opacity: 1; transform: translateY(0)  scale(1); }
            }
          `}</style>
          <p className="font-black uppercase italic text-[10px] tracking-widest text-slate-500 dark:text-zinc-400 mb-2 border-b-2 border-black dark:border-zinc-700 pb-2">
            🎨 PILIH WARNA AKSEN
          </p>
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {ACCENT_COLORS.map((c) => {
              const isSelected = activeColor.toLowerCase() === c.value.toLowerCase();
              return (
                <div key={c.value} className="flex flex-col items-center gap-1 group">
                  <button
                    onClick={() => handleSelect(c.value)}
                    title={c.name}
                    className={`w-full h-10 border-[3px] border-slate-900 dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                      isSelected ? "translate-x-[1px] translate-y-[1px] shadow-none" : ""
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && (
                      <div className="bg-slate-900 text-white dark:bg-white dark:text-black p-0.5 border-2 border-slate-900 dark:border-white">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1 5l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                  <span className="text-[9px] font-black uppercase text-slate-800 dark:text-zinc-300 tracking-wider">
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
