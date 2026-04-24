"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

/* ── Context ────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Config ─────────────────────────────────────────────── */
const TYPE_CONFIG: Record<ToastType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}> = {
  success: {
    icon: CheckCircle2,
    color: "#00E676",
    bg: "rgba(0,230,118,0.08)",
    border: "rgba(0,230,118,0.25)",
  },
  error: {
    icon: XCircle,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
  },
  info: {
    icon: Info,
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.25)",
  },
};

const AUTO_DISMISS_MS = 3000;
const MAX_TOASTS = 3;

/* ── Single Toast ───────────────────────────────────────── */
function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[toast.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative flex items-start gap-3 px-4 py-3 rounded-xl overflow-hidden min-w-[280px] max-w-[360px] shadow-xl"
      style={{
        background: "rgba(2,4,8,0.97)",
        border: `1px solid ${cfg.border}`,
        backdropFilter: "blur(12px)",
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}`,
      }}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 rounded-full"
        style={{ background: cfg.color, opacity: 0.6 }}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
      />

      <Icon size={15} className="shrink-0 mt-0.5" style={{ color: cfg.color }} />

      <p className="flex-1 text-sm leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
        {toast.message}
      </p>

      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-30 hover:opacity-70 transition-opacity -mt-0.5 -mr-1"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

/* ── Provider ───────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => {
      const next = [...prev, { id, type, message }];
      // Keep max 3
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    setTimeout(() => dismiss(id), AUTO_DISMISS_MS + 300);
  }, [dismiss]);

  const ctx: ToastContextValue = {
    success: (msg) => add("success", msg),
    error:   (msg) => add("error", msg),
    info:    (msg) => add("info", msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Portal-like fixed container */}
      <div
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ alignItems: "flex-end" }}
      >
        <AnimatePresence mode="sync">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────── */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
