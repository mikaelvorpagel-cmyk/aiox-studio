"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, FileText, Folder, File, FolderOpen } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { AgentCard } from "@/components/AgentCard";
import type { Agent } from "@/lib/squad";
import { addActivity } from "@/lib/activityFeed";

/* Ordered workflow sequence — Vex → Reva → Saga → Copy → Dev → Motion → Assets → SEO → Review → Deploy */
const AGENT_ORDER = [
  "web-designer",           // Vex — Lead
  "ux-researcher",          // Reva
  "storytelling-specialist",// Saga
  "copy-specialist",        // Copy
  "ui-developer",           // Dev
  "motion-engineer",        // Motion
  "assets-manager",         // Assets
  "seo-specialist",         // SEO
  "design-reviewer",        // Review
  "reference-scout",        // Scout
  "deploy-agent",           // Deploy
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

interface LogEntry {
  ts: string;
  message: string;
}

const MAX_LOG_LINES = 50;

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeBrief, setActiveBrief] = useState<{ name: string; niche?: string } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([
    { ts: new Date().toLocaleTimeString("pt-BR"), message: "Sistema inicializado. Aguardando ativação do agente..." },
  ]);
  const [generatedFiles] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    const ts = new Date().toLocaleTimeString("pt-BR");
    setLog(prev => {
      const next = [...prev, { ts, message }];
      return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next;
    });
  }, []);

  useEffect(() => {
    fetch("/api/agents").then(r => r.json()).then(d => {
      const list: Agent[] = d.agents ?? [];
      setAgents(list);
      if (list.length > 0) {
        addLog(`${list.length} agente${list.length !== 1 ? "s" : ""} carregado${list.length !== 1 ? "s" : ""} com sucesso.`);
      }
    });
    fetch("/api/brief").then(r => r.json()).then(data => {
      const briefs: { name: string; content: string }[] = data.briefs ?? [];
      if (briefs.length === 0) return;
      const latest = briefs[briefs.length - 1];
      const nicheMatch = latest.content.match(/\*\*Nicho:\*\*\s*(.+)/);
      const brief = { name: latest.name, niche: nicheMatch?.[1]?.trim() };
      setActiveBrief(brief);
      addLog(`Brief ativo carregado: "${brief.name}"${brief.niche ? ` [${brief.niche}]` : ""}`);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const handleAgentActivate = useCallback((agent: Agent) => {
    addLog(`Agente ativado: [${agent.name}] — ${agent.title}`);
    addLog(`→ Abrindo console de chat com ${agent.name}...`);
    addActivity({ type: "agent_activated", message: `Agente ativado: ${agent.name}` });
  }, [addLog]);

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
                  borderColor: "rgba(251,191,36,0.2)",
                  background: "rgba(251,191,36,0.04)",
                }}
              >
                <FileText size={14} style={{ color: "#FBBF24" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "#FBBF24" }}>
                    Nenhum brief ativo
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>
                    Os agentes funcionam melhor com contexto de projeto. Crie um brief primeiro.
                  </p>
                </div>
                <Link
                  href="/brief"
                  className="text-[10px] px-2.5 py-1.5 rounded-lg shrink-0 transition-all"
                  style={{ color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.06)" }}
                >
                  Criar brief →
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
                    onActivate={handleAgentActivate}
                  />
                );
              })}
            </div>
          )}

          {/* Activity Log */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", animation: "pulse-dot 2s ease-in-out infinite" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Activity Log
              </p>
              <span className="ml-auto text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>
                {log.length}/{MAX_LOG_LINES} linhas
              </span>
            </div>
            <div
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: "rgba(0,230,118,0.12)" }}
            >
              <div
                className="h-48 overflow-y-auto p-4 font-mono text-xs space-y-1"
                style={{ background: "#0a0a0a" }}
              >
                {log.map((entry, i) => (
                  <div key={i} className="flex gap-2 leading-relaxed">
                    <span className="shrink-0 opacity-40" style={{ color: "#00E676" }}>{entry.ts}</span>
                    <span style={{ color: "#00E676" }}>{entry.message}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </motion.div>

          {/* File Tree */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-4 mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen size={12} style={{ color: "var(--text-subtle)" }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Arquivos Gerados
              </p>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              {generatedFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-50">
                  <Folder size={24} style={{ color: "var(--text-subtle)" }} />
                  <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                    Nenhum arquivo gerado ainda
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>
                    Os arquivos aparecem aqui quando os agentes produzirem output
                  </p>
                </div>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {generatedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 py-1" style={{ color: "var(--text-muted)" }}>
                      <File size={11} style={{ color: "var(--accent)", opacity: 0.7 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
