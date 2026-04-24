"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Activity, Trash2, Bot, FileText, Search, CheckSquare, Layers, RefreshCw } from "lucide-react";
import { getActivity, clearActivity, formatRelativeTime } from "@/lib/activityFeed";
import type { ActivityEntry } from "@/lib/activityFeed";

const TYPE_CONFIG: Record<
  ActivityEntry["type"],
  { icon: React.ReactNode; label: string; color: string }
> = {
  agent_activated: {
    icon: <Bot size={13} />,
    label: "Agente",
    color: "#60A5FA",
  },
  brief_saved: {
    icon: <FileText size={13} />,
    label: "Brief",
    color: "#A78BFA",
  },
  scout_search: {
    icon: <Search size={13} />,
    label: "Scout",
    color: "#F59E0B",
  },
  section_updated: {
    icon: <Layers size={13} />,
    label: "Studio",
    color: "#34D399",
  },
  checklist_item: {
    icon: <CheckSquare size={13} />,
    label: "Checklist",
    color: "#7DC52B",
  },
};

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [now, setNow] = useState(Date.now());

  const reload = useCallback(() => {
    setEntries(getActivity());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    reload();
    // Atualiza timestamps a cada minuto
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [reload]);

  // Trick to re-render relative times
  void now;

  const handleClear = () => {
    clearActivity();
    setEntries([]);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-start justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={13} style={{ color: "var(--text-subtle)" }} />
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                  Projeto
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Feed de Atividade
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Histórico de ações realizadas no projeto
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1 shrink-0">
              <button
                onClick={reload}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--surface-1)",
                  color: "var(--text-secondary)",
                }}
                title="Atualizar"
              >
                <RefreshCw size={13} />
              </button>
              {entries.length > 0 && (
                <button
                  onClick={handleClear}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{
                    border: "1px solid rgba(239,68,68,0.2)",
                    background: "rgba(239,68,68,0.04)",
                    color: "rgba(248,113,113,0.7)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
                    (e.currentTarget as HTMLElement).style.color = "#F87171";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.04)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.7)";
                  }}
                >
                  <Trash2 size={13} /> Limpar histórico
                </button>
              )}
            </div>
          </motion.div>

          {/* Count badge */}
          {entries.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <span
                className="text-xs font-mono px-2.5 py-1 rounded-full"
                style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid rgba(0,230,118,0.2)" }}
              >
                {entries.length} entrada{entries.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Feed */}
          <AnimatePresence mode="popLayout">
            {entries.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <Activity size={36} style={{ color: "var(--text-subtle)", opacity: 0.3 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Nenhuma atividade registrada ainda
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                    As ações realizadas no Brief, Agentes e Checklist aparecerão aqui.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, i) => {
                  const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.brief_saved;
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="flex items-start gap-3 p-3.5 rounded-xl border group"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                    >
                      {/* Icon */}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: `${cfg.color}12`, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>
                            {formatRelativeTime(entry.ts)}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {entry.message}
                        </p>
                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(entry.meta).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[10px] px-2 py-0.5 rounded font-mono"
                                style={{ background: "var(--surface-2)", color: "var(--text-subtle)", border: "1px solid var(--border)" }}
                              >
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timestamp absolute */}
                      <span className="text-[10px] font-mono shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-subtle)" }}>
                        {new Date(entry.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
