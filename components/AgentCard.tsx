"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Agent } from "@/lib/squad";

interface AgentCardProps {
  agent: Agent;
  index: number;
  phase?: number;
  phaseLabel?: string;
  isLead?: boolean;
}

export function AgentCard({ agent, index, phase, phaseLabel, isLead }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/agents/${agent.id}`}
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

        {/* Command count */}
        <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
          {agent.commands.length} comando{agent.commands.length !== 1 ? "s" : ""} disponíve{agent.commands.length !== 1 ? "is" : "l"}
        </p>
      </Link>
    </motion.div>
  );
}
