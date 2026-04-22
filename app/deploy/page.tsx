"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Rocket, CheckCircle2, XCircle, ExternalLink, Terminal,
  Clock, ArrowRight, Settings, AlertCircle,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface ConfigItem { key: string; label: string; status: string }
interface StatusData {
  provider: string;
  configs: ConfigItem[];
  stats: { agentCount: number; briefCount: number; kbCount: number };
}

export default function DeployPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [deployUrl, setDeployUrl] = useState("");

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(setStatus).catch(() => {});
    try {
      const saved = localStorage.getItem("aiox-deploy-url");
      if (saved) setDeployUrl(saved);
    } catch { /* ignore */ }
  }, []);

  const saveUrl = (v: string) => {
    setDeployUrl(v);
    try { localStorage.setItem("aiox-deploy-url", v); } catch { /* ignore */ }
  };

  const allOk = status?.configs.every(c => c.status === "ok") ?? false;
  const hasBrief = (status?.stats.briefCount ?? 0) > 0;

  const CHECKLIST = [
    { label: "Brief do projeto salvo",          done: hasBrief },
    { label: "Agente Review aprovado",           done: false },
    { label: "Premium Gate ≥ 80% importantes",  done: false },
    { label: "URL de staging configurada",       done: !!deployUrl },
    { label: "Variáveis de ambiente OK",         done: allOk },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto" style={{ marginLeft: "var(--sidebar-w)" }}>
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-2">
              <Rocket size={13} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Passo 5
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Deploy
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Publique e entregue o projeto ao cliente
            </p>
          </motion.div>

          {/* Deploy URL */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="mb-6 p-4 rounded-xl border"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-subtle)" }}>
              URL do projeto
            </p>
            <div className="flex gap-2">
              <input
                value={deployUrl}
                onChange={e => saveUrl(e.target.value)}
                placeholder="https://meu-projeto.vercel.app"
                className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--border-accent)"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
              />
              {deployUrl && (
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm transition-all shrink-0"
                  style={{ background: "var(--accent)", color: "#020408", fontWeight: 600 }}
                >
                  <ExternalLink size={13} /> Abrir
                </a>
              )}
            </div>
          </motion.div>

          {/* Pre-deploy checklist */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-subtle)" }}>
              Checklist pré-deploy
            </p>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {CHECKLIST.map(({ label, done }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: "var(--border)", background: done ? "rgba(125,197,43,0.03)" : undefined }}
                >
                  {done
                    ? <CheckCircle2 size={13} style={{ color: "#7DC52B", flexShrink: 0 }} />
                    : <XCircle size={13} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  }
                  <span className="text-sm" style={{ color: done ? "var(--text-secondary)" : "var(--text-subtle)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Deploy agent + settings */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <Link
              href="/agents/deploy-agent"
              className="flex flex-col gap-3 p-5 rounded-xl border transition-all group"
              style={{ borderColor: "rgba(125,197,43,0.2)", background: "rgba(125,197,43,0.04)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(125,197,43,0.4)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(125,197,43,0.2)"}
            >
              <div className="flex items-center justify-between">
                <Terminal size={16} style={{ color: "#7DC52B" }} />
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "#7DC52B" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Agente Deploy</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Vercel, variáveis de ambiente, domínio e SSL
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex flex-col gap-3 p-5 rounded-xl border transition-all group"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
            >
              <div className="flex items-center justify-between">
                <Settings size={16} style={{ color: "var(--text-muted)" }} />
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Configurações</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  API keys, env vars e integrações
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Env vars status */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-subtle)" }}>
                Status das integrações
              </p>
              <div className="space-y-2">
                {status.configs.map(cfg => {
                  const ok = cfg.status === "ok";
                  return (
                    <Link
                      key={cfg.key}
                      href="/settings"
                      className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all ${
                        ok ? "border-white/5 bg-white/[0.02]" : "border-amber-500/20 bg-amber-500/5"
                      }`}
                    >
                      {ok
                        ? <CheckCircle2 size={12} className="text-[#7DC52B] shrink-0" />
                        : <AlertCircle size={12} className="text-amber-400 shrink-0" />
                      }
                      <p className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{cfg.label}</p>
                      {!ok && <span className="text-[10px] text-amber-400/60">Configurar →</span>}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "var(--text-subtle)" }}>
                <Clock size={10} />
                Atualizado agora
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
