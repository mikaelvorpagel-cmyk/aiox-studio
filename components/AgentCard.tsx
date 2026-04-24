"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Play, RotateCcw } from "lucide-react";
import type { Agent } from "@/lib/squad";

export type AgentStatus = "not-started" | "in-progress" | "done";

const STORAGE_KEY = "aiox-agent-status";

export function getAgentStatuses(): Record<string, AgentStatus> {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export function setAgentStatus(agentId: string, status: AgentStatus) {
  try {
    const all = getAgentStatuses();
    all[agentId] = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

interface AgentCardProps {
  agent: Agent;
  index: number;
  phase?: number;
  phaseLabel?: string;
  isLead?: boolean;
  onActivate?: (agent: Agent) => void;
}

export function AgentCard({ agent, index, phase, phaseLabel, isLead, onActivate }: AgentCardProps) {
  const [status, setStatus] = useState<AgentStatus>(() => {
    if (typeof window === "undefined") return "not-started";
    return getAgentStatuses()[agent.id] ?? "not-started";
  });

  const changeStatus = useCallback((s: AgentStatus, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus(s);
    setAgentStatus(agent.id, s);
  }, [agent.id]);

  const STATUS_CFG: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
    "not-started": { label: "",             color: "rgba(255,255,255,0.15)", pulse: false },
    "in-progress": { label: "Em andamento", color: "#FBBF24",                pulse: true  },
    "done":        { label: "Concluído",    color: "#00E676",                pulse: false },
  };
  const cfg = STATUS_CFG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <Link
        href={`/agents/${agent.id}`}
        onClick={() => {
          onActivate?.(agent);
          if (status === "not-started") {
            setStatus("in-progress");
            setAgentStatus(agent.id, "in-progress");
          }
        }}
        className="group flex flex-col p-5 rounded-xl border transition-all duration-200 h-full relative"
        style={{
          borderColor: isLead ? `${agent.color}50` : "var(--border)",
          background: isLead ? `${agent.color}06` : "var(--surface-1)",
          boxShadow: isLead ? `0 0 20px ${agent.color}12` : "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = isLead ? `${agent.color}80` : "var(--border-hover)";
          (e.currentTarget as HTMLElement).style.background = isLead ? `${agent.color}0d` : "var(--surface-2)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = isLead ? `${agent.color}50` : "var(--border)";
          (e.currentTarget as HTMLElement).style.background = isLead ? `${agent.color}06` : "var(--surface-1)";
        }}
      >
        {/* Status indicator top-right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {cfg.label && (
            <span className="text-[9px] font-medium" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          )}
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: cfg.color,
              boxShadow: status === "done" ? `0 0 6px ${cfg.color}` : "none",
              animation: cfg.pulse ? "pulse-dot 2s ease-in-out infinite" : "none",
            }}
          />
        </div>

        {/* Phase badge */}
        {phase !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: `${agent.color}15`,
                color: agent.color,
                border: `1px solid ${agent.color}25`,
              }}
            >
              {String(phase).padStart(2, "0")}
            </span>
            {phaseLabel && (
              <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: "var(--text-subtle)" }}>
                {phaseLabel}
              </span>
            )}
            {isLead && (
              <span
                className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{
                  background: `${agent.color}20`,
                  color: agent.color,
                  border: `1px solid ${agent.color}35`,
                }}
              >
                Lead
              </span>
            )}
          </div>
        )}

        {/* Top row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{
              background: `${agent.color}14`,
              border: `1px solid ${agent.color}28`,
              boxShadow: isLead ? `0 0 12px ${agent.color}20` : "none",
            }}
          >
            {agent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none mb-1" style={{ color: "var(--text-primary)" }}>
              {agent.name}
            </p>
            <p className="text-[11px] font-medium" style={{ color: agent.color }}>
              {agent.title}
            </p>
          </div>
          <ArrowRight
            size={13}
            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-40 transition-all -translate-x-1 group-hover:translate-x-0 duration-200"
            style={{ color: "var(--text-muted)" }}
          />
        </div>

        {/* Identity/focus */}
        <p
          className="text-xs leading-relaxed line-clamp-2 flex-1 mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          {agent.focus}
        </p>

        {/* Primary command highlight */}
        {agent.commands[0] && (
          <div
            className="px-3 py-2 rounded-lg text-xs mb-3"
            style={{
              background: `${agent.color}0d`,
              border: `1px solid ${agent.color}20`,
            }}
          >
            <span className="font-mono font-medium" style={{ color: agent.color }}>
              *{agent.commands[0].name}
            </span>
            <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--text-subtle)" }}>
              {agent.commands[0].description}
            </p>
          </div>
        )}

        {/* Bottom row: command count + status actions */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
            {agent.commands.length} comando{agent.commands.length !== 1 ? "s" : ""} disponíve{agent.commands.length !== 1 ? "is" : "l"}
          </p>

          {/* Status action buttons — visible on hover */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {status !== "in-progress" && (
                <button
                  onClick={e => changeStatus("in-progress", e)}
                  title="Iniciar"
                  className="p-1 rounded transition-colors"
                  style={{ color: "#FBBF24" }}
                >
                  <Play size={10} />
                </button>
              )}
              {status !== "done" && (
                <button
                  onClick={e => changeStatus("done", e)}
                  title="Concluir"
                  className="p-1 rounded transition-colors"
                  style={{ color: "#00E676" }}
                >
                  <CheckCircle2 size={10} />
                </button>
              )}
              {status !== "not-started" && (
                <button
                  onClick={e => changeStatus("not-started", e)}
                  title="Resetar"
                  className="p-1 rounded transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <RotateCcw size={10} />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
}
