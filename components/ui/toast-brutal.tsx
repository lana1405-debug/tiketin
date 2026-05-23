"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

// ─── Config per type ──────────────────────────────────────────────────────────
const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; shadow: string }> = {
  success: {
    bg: "bg-emerald-400",
    border: "border-black",
    shadow: "shadow-[4px_4px_0_0_#000]",
    icon: <CheckCircle size={20} strokeWidth={3} className="text-black shrink-0" />,
  },
  error: {
    bg: "bg-red-500",
    border: "border-black",
    shadow: "shadow-[4px_4px_0_0_#000]",
    icon: <XCircle size={20} strokeWidth={3} className="text-white shrink-0" />,
  },
  warning: {
    bg: "bg-amber-400",
    border: "border-black",
    shadow: "shadow-[4px_4px_0_0_#000]",
    icon: <AlertTriangle size={20} strokeWidth={3} className="text-black shrink-0" />,
  },
  info: {
    bg: "bg-[#6D4AFF]",
    border: "border-black",
    shadow: "shadow-[4px_4px_0_0_#FBBF24]",
    icon: <Info size={20} strokeWidth={3} className="text-white shrink-0" />,
  },
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const cfg = TOAST_CONFIG[toast.type];
  const isLight = toast.type === "success" || toast.type === "warning";

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        flex items-center gap-3 px-4 py-3 border-4
        ${cfg.bg} ${cfg.border} ${cfg.shadow}
        min-w-[260px] max-w-[360px] relative
      `}
    >
      {cfg.icon}
      <p className={`font-black italic uppercase text-xs tracking-wide flex-1 ${isLight ? "text-black" : "text-white"}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className={`shrink-0 p-0.5 hover:scale-110 transition-transform ${isLight ? "text-black" : "text-white"}`}
      >
        <X size={16} strokeWidth={3} />
      </button>
      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 ${isLight ? "bg-black/20" : "bg-white/30"}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: (toast.duration ?? 3500) / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
