"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { AgentCard } from "@/components/AgentCard";
import type { Agent } from "@/lib/squad";

/* Ordered workflow sequence */
const AGENT_ORDER = [
  "web-designer",
  "ux-researcher",
  "storytelling-specialist",
  "copy-specialist",
  "ui-developer",
  "motion-engineer",
  "assets-manager",
  "seo-specialist",
  "design-reviewer",
  "reference-scout",
  "deploy-agent",
];

const AGENT_META: Record<string, { phase: number; label: string; isLead?: boolean }> = {
  "web-designer":           { phase: 1,  label: "Direção",   isLead: true },
  "ux-researcher":          { phase: 2,  label: "Pesquisa"   },
  "storytelling-specialist":{ phase: 3,  label: "Narrativa"  },
  "copy-specialist":        { phase: 4,  label: "Copy"       },
  "ui-developer":           { phase: 5,  label: "Build"      },
  "motion-engineer":        { phase: 6,  label: "Motion"     },
  "assets-manager":         { phase: 7,  label: "Assets"     },
  "seo-specialist":         { phase: 8,  label: "SEO"        },
  "design-reviewer":        { phase: 9,  label: "Review"     },
  "reference-scout":        { phase: 10, label: "Scout"      },
  "deploy-agent":           { phase: 11, label: "Deploy"     },
};

function sortAgents(agents: Agent[]): Agent[] {
  return [...agents].sort((a, b) => {
    const ai = AGENT_ORDER.indexOf(a.id);
    const bi = AGENT_ORDER.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeBrief, setActiveBrief] = useState<{ name: string; niche?: string } | null>(null);

  useEffect(() => {
    fetch("/api/agents").then(r => r.json()).then(d => setAgents(d.agents ?? []));
    fetch("/api/brief").then(r => r.json()).then(data => {
      const briefs: { name: string; content: string }[] = data.briefs ?? [];
      if (briefs.length === 0) return;
      const latest = briefs[briefs.length - 1];
      const nicheMatch = latest.content.match(/\*\*Nicho:\*\*\s*(.+)/);
      setActiveBrief({ name: latest.name, niche: nicheMatch?.[1]?.trim() });
    }).catch(() => {});
  }, []);

  const sorted = sortAgents(agents);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Squad
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Agentes
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Cada agente é um especialista. Siga a ordem de fases para o fluxo ideal.
            </p>
          </motion.div>

          {/* Brief context banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="mb-6"
          >
            {activeBrief ? (
              <div
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{
                  borderColor: "rgba(0,230,118,0.2)",
                  background: "rgba(0,230,118,0.04)",
                }}
              >
                <CheckCircle2 size={14} style={{ color: "var(--accent)" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    Contexto carregado — {activeBrief.name}
                    {activeBrief.niche && <span style={{ color: "var(--text-subtle)", fontWeight: 400 }}> · {activeBrief.niche}</span>}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>
                    Todos os agentes já têm acesso ao brief do projeto. Selecione um agente para começar.
                  </p>
                </div>
                <Link
                  href="/brief"
                  className="text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 transition-all"
                  style={{ color: "var(--accent)", border: "1px solid rgba(0,230,118,0.2)", background: "rgba(0,230,118,0.06)" }}
                >
                  Ver brief
                </Link>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <FileText size={14} style={{ color: "var(--text-subtle)" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Nenhum brief ativo
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>
                    Os agentes funcionam melhor com contexto de projeto. Crie um brief primeiro.
                  </p>
                </div>
                <Link
                  href="/brief"
                  className="text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 transition-all"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  Criar brief
                </Link>
              </div>
            )}
          </motion.div>

          {/* Agent grid or skeleton */}
          {agents.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-52 rounded-xl animate-skeleton"
                  style={{ background: "var(--surface-1)" }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sorted.map((a, i) => {
                const meta = AGENT_META[a.id];
                return (
                  <AgentCard
                    key={a.id}
                    agent={a}
                    index={i}
                    phase={meta?.phase}
                    phaseLabel={meta?.label}
                    isLead={meta?.isLead}
                  />
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
