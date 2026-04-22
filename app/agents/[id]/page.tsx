"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { ChatConsole } from "@/components/ChatConsole";
import type { Agent } from "@/lib/squad";

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then(r => r.json())
      .then(d => {
        const found = (d.agents as Agent[]).find(a => a.id === id);
        setAgent(found ?? null);
      });
  }, [id]);

  if (!agent) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div
          className="flex-1 flex items-center justify-center"
          style={{ marginLeft: "var(--sidebar-w)" }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-subtle)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--text-subtle)", animation: "pulse-dot 1s ease-in-out infinite" }}
            />
            Carregando agente...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className="flex-1 flex flex-col lg:flex-row h-screen overflow-hidden"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        {/* Agent info panel */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full lg:w-64 shrink-0 flex flex-col overflow-y-auto border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Back link */}
          <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <Link
              href="/agents"
              className="flex items-center gap-1.5 text-xs transition-colors mb-5"
              style={{ color: "var(--text-subtle)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)"}
            >
              <ArrowLeft size={12} /> Agentes
            </Link>

            {/* Agent identity */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${agent.color}14`, border: `1px solid ${agent.color}28` }}
              >
                {agent.icon}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  {agent.name}
                </p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: agent.color }}>
                  {agent.title}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 px-5 py-4 space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-subtle)" }}>
                Identidade
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {agent.identity}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-subtle)" }}>
                Foco
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {agent.focus}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-subtle)" }}>
                Comandos
              </p>
              <div className="space-y-1.5">
                {agent.commands.map(cmd => (
                  <div
                    key={cmd.name}
                    className="p-2.5 rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                  >
                    <p
                      className="font-mono text-[11px] font-semibold mb-0.5"
                      style={{ color: agent.color }}
                    >
                      *{cmd.name}
                    </p>
                    <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                      {cmd.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Chat area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="flex-1 overflow-hidden"
        >
          <ChatConsole agent={agent} />
        </motion.div>
      </div>
    </div>
  );
}
