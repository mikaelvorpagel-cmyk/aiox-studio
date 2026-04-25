"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText, Compass, Users, CheckSquare, Rocket,
  ArrowRight, CheckCircle2, XCircle, AlertCircle, Plus, ExternalLink, Flame,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import type { Agent } from "@/lib/squad";
import type { ConfigItem } from "@/app/api/status/route";

function useProjectProgress(briefCount: number, kbCount: number): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let score = 0;
    const total = 100;

    // Brief preenchido: 30 pts
    if (briefCount > 0) score += 30;

    // Scout com referências: 15 pts
    if (kbCount > 0) score += 15;

    // localStorage: brief ativo: +10
    try {
      if (localStorage.getItem("activeBrief")) score += 10;
    } catch { /* ignore */ }

    // checklist: 25 pts máx
    try {
      const cl = localStorage.getItem("aiox-checklist-v1");
      if (cl) {
        const checked = JSON.parse(cl) as Record<string, boolean>;
        const done = Object.values(checked).filter(Boolean).length;
        const maxItems = 55; // aprox total de itens do checklist
        score += Math.min(25, Math.round((done / maxItems) * 25));
      }
    } catch { /* ignore */ }

    // studio sections: 20 pts máx
    try {
      const st = localStorage.getItem("aiox-studio-sections-v2");
      if (st) {
        const sections = JSON.parse(st) as { status: string }[];
        const done = sections.filter(s => s.status === "done").length;
        score += Math.min(20, Math.round((done / Math.max(sections.length, 1)) * 20));
      }
    } catch { /* ignore */ }

    setProgress(Math.min(100, Math.round((score / total) * 100)));
  }, [briefCount, kbCount]);

  return progress;
}

interface StatusData {
  provider: string;
  configs: ConfigItem[];
  stats: { agentCount: number; briefCount: number; kbCount: number };
}

interface WorkflowStep {
  id: string;
  step: number;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  getStatus: (stats: StatusData["stats"]) => "done" | "active" | "pending";
}

const WORKFLOW: WorkflowStep[] = [
  {
    id: "brief", step: 1, label: "Brief", icon: FileText,
    description: "Define o projeto, a estética e a narrativa",
    href: "/brief", color: "#A78BFA",
    getStatus: s => s.briefCount > 0 ? "done" : "active",
  },
  {
    id: "scout", step: 2, label: "Scout", icon: Compass,
    description: "Pesquise referências visuais para o nicho",
    href: "/scout", color: "#F59E0B",
    getStatus: s => s.kbCount > 0 ? "done" : s.briefCount > 0 ? "active" : "pending",
  },
  {
    id: "agentes", step: 3, label: "Agentes", icon: Users,
    description: "Trabalhe com o squad para construir o site",
    href: "/agents", color: "#60A5FA",
    getStatus: s => s.kbCount > 0 || s.briefCount > 0 ? "active" : "pending",
  },
  {
    id: "checklist", step: 4, label: "Checklist", icon: CheckSquare,
    description: "Valide a qualidade antes de publicar",
    href: "/checklist", color: "#34D399",
    getStatus: () => "pending",
  },
  {
    id: "deploy", step: 5, label: "Deploy", icon: Rocket,
    description: "Publique e entregue o projeto final",
    href: "/deploy", color: "#7DC52B",
    getStatus: () => "pending",
  },
];

const STATUS_CONFIG = {
  done:    { label: "Concluído",     bg: "bg-[#7DC52B]/10",  border: "border-[#7DC52B]/25",  text: "text-[#7DC52B]"  },
  active:  { label: "Próximo passo", bg: "bg-[#60A5FA]/10",  border: "border-[#60A5FA]/25",  text: "text-[#60A5FA]"  },
  pending: { label: "Aguardando",    bg: "bg-white/3",       border: "border-white/6",        text: "text-white/25"   },
};

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  "LLM Provider":       "Necessário para todos os agentes conversarem",
  "Anthropic API":      "Necessário para todos os agentes conversarem",
  "Google Vertex AI":   "Necessário para todos os agentes conversarem",
  "Exa Search":         "Necessário para Scout buscar referências e métricas",
  "Squad Path":         "Caminho para os agentes, playbook e knowledge base",
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    fetch("/api/agents").then(r => r.json()).then(d => setAgents(d.agents ?? []));
    fetch("/api/status").then(r => r.json()).then(setStatus);
  }, []);

  const pendingConfigs = status?.configs.filter(c => c.status !== "ok") ?? [];
  const hasBriefs = (status?.stats.briefCount ?? 0) > 0;
  const progress = useProjectProgress(
    status?.stats.briefCount ?? 0,
    status?.stats.kbCount ?? 0,
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)", animation: "pulse-dot 2s ease-in-out infinite" }}
              />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Squad ativo
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Web Design Studio
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {status
                ? `${status.stats.agentCount} agentes · ${status.stats.kbCount} referências · ${status.stats.briefCount} briefs`
                : "Carregando..."}
            </p>
          </motion.div>

          {/* Barra de progresso geral */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03, duration: 0.35 }}
              className="mb-6 p-4 rounded-xl border"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Progresso do projeto
                </span>
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: progress > 0 ? "var(--accent)" : "var(--text-subtle)" }}
                >
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)", boxShadow: "0 0 8px rgba(0,230,118,0.4)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              {progress === 0 && (
                <p className="text-[10px] mt-1.5" style={{ color: "var(--text-subtle)" }}>
                  Comece criando um brief para iniciar o rastreamento de progresso
                </p>
              )}
            </motion.div>
          )}

          {/* Config alert */}
          {pendingConfigs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4 }}
              className="mb-6"
            >
              <Link
                href="/settings"
                className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8 transition-colors"
              >
                <AlertCircle size={15} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-400/90">
                    {pendingConfigs.length === 1
                      ? `${pendingConfigs[0].label} não configurado`
                      : `${pendingConfigs.length} integrações pendentes`}
                  </p>
                  <p className="text-xs text-amber-400/50 mt-0.5">
                    {pendingConfigs.map(c => c.label).join(" · ")} · Clique para configurar
                  </p>
                </div>
                <ArrowRight size={14} className="text-amber-400/40 shrink-0" />
              </Link>
            </motion.div>
          )}

          {/* Workflow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-subtle)" }}>
              Fluxo de criação
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {WORKFLOW.map((step, i) => {
                const Icon = step.icon;
                const statusKey = status ? step.getStatus(status.stats) : "pending";
                const cfg = STATUS_CONFIG[statusKey];

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                  >
                    <Link
                      href={step.href}
                      className={`group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 h-full ${cfg.bg} ${cfg.border} hover:border-opacity-60`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>
                          {String(step.step).padStart(2, "0")}
                        </span>
                        {statusKey === "done"
                          ? <CheckCircle2 size={13} className="text-[#7DC52B]" />
                          : <Icon size={13} style={{ color: step.color }} />
                        }
                      </div>
                      <div>
                        <p className={`text-sm font-semibold mb-0.5 group-hover:opacity-100 transition-opacity ${
                          statusKey === "pending" ? "text-white/35" : "text-white/85"
                        }`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                          {step.description}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium mt-auto ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Demo output card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-subtle)" }}>
              Output gerado pelo squad
            </h2>
            <Link
              href="/preview/emagrecimento"
              className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
              style={{ borderColor: "rgba(255,104,53,0.2)", background: "rgba(255,104,53,0.04)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,104,53,0.4)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,104,53,0.07)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,104,53,0.2)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,104,53,0.04)";
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,104,53,0.12)", border: "1px solid rgba(255,104,53,0.2)" }}>
                <Flame size={16} style={{ color: "#FF6835" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold" style={{ color: "#F5F0F8" }}>SLIM30 — Landing Page Emagrecimento</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,104,53,0.15)", color: "#FF6835", border: "1px solid rgba(255,104,53,0.3)" }}>DEMO</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-subtle)" }}>
                  Landing page premium gerada pelo squad · Termogênico feminino · Dark Luxury
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all" style={{ background: "#FF6835", color: "#fff" }}>
                <ExternalLink size={11} /> Ver preview
              </div>
            </Link>
          </motion.div>

          {/* Config status + Squad */}
          <div className="grid grid-cols-3 gap-6">

            {/* Config status */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-subtle)" }}>
                Integrações
              </h2>
              <div className="space-y-2">
                {status?.configs.map(cfg => {
                  const ok = cfg.status === "ok";
                  const desc = CONFIG_DESCRIPTIONS[cfg.label] ?? "";
                  return (
                    <Link
                      key={cfg.key}
                      href="/settings"
                      className={`flex items-start gap-2.5 p-3 rounded-lg border transition-all ${
                        ok
                          ? "border-white/5 bg-white/[0.02] hover:border-white/10"
                          : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30"
                      }`}
                    >
                      {ok
                        ? <CheckCircle2 size={12} className="text-[#7DC52B] shrink-0 mt-0.5" />
                        : <XCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                      }
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                          {cfg.label}
                        </p>
                        {ok ? (
                          <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Configurado</p>
                        ) : (
                          <>
                            <p className="text-[10px] text-amber-400/60">Configurar →</p>
                            {desc && (
                              <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--text-subtle)" }}>
                                {desc}
                              </p>
                            )}
                            {/* Preview mockup por tipo */}
                            {(cfg.label === "Anthropic API" || cfg.label === "LLM Provider" || cfg.label === "Google Vertex AI") && (
                              <div className="mt-2 opacity-30 pointer-events-none select-none">
                                <p className="text-[9px] text-amber-400/70 mb-1">Preview — conecte para ativar</p>
                                <div
                                  className="rounded-lg p-2 text-[10px] leading-relaxed"
                                  style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.1)", color: "rgba(0,230,118,0.6)" }}
                                >
                                  Analisando brief do projeto...
                                </div>
                              </div>
                            )}
                            {cfg.label === "Exa Search" && (
                              <div className="mt-2 opacity-25 pointer-events-none select-none">
                                <p className="text-[9px] text-amber-400/70 mb-1">Preview — conecte para ativar</p>
                                <div className="space-y-1">
                                  <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>3 referências encontradas</p>
                                  {[1, 2, 3].map(n => (
                                    <div key={n} className="h-2 rounded" style={{ background: "var(--surface-2)", width: `${90 - n * 10}%` }} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* Squad agents */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="col-span-2"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                  Squad
                </h2>
                <Link
                  href="/agents"
                  className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                  style={{ color: "var(--text-subtle)" }}
                >
                  Ver todos <ArrowRight size={10} />
                </Link>
              </div>

              {agents.length === 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 rounded-lg animate-skeleton" style={{ background: "var(--surface-1)" }} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {agents.map(a => (
                    <Link
                      key={a.id}
                      href={`/agents/${a.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 hover:border-opacity-50"
                      style={{
                        background: "var(--surface-1)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <span className="text-sm shrink-0">{a.icon}</span>
                      <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                        {a.name}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full ml-auto shrink-0" style={{ background: a.color }} />
                    </Link>
                  ))}
                </div>
              )}

              {/* No briefs CTA */}
              {!hasBriefs && status && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 rounded-xl border flex items-center gap-3"
                  style={{ borderColor: "rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.04)" }}
                >
                  <FileText size={14} style={{ color: "#A78BFA" }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "rgba(167,139,250,0.9)" }}>
                      Comece pelo brief
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-subtle)" }}>
                      O brief define o contexto de todos os agentes
                    </p>
                  </div>
                  <Link
                    href="/brief"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all"
                    style={{ background: "#A78BFA", color: "#020408" }}
                  >
                    <Plus size={12} /> Criar brief
                  </Link>
                </motion.div>
              )}
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
