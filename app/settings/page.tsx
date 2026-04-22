"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, Settings } from "lucide-react";
import type { ConfigItem } from "@/app/api/status/route";

interface StatusData {
  provider: string;
  configs: ConfigItem[];
  stats: { agentCount: number; briefCount: number; kbCount: number };
}

export default function SettingsPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/status");
    setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings size={13} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Sistema
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Configurações
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Status das integrações e variáveis de ambiente
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs transition-colors mt-1 shrink-0"
            style={{ color: "var(--text-subtle)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)"}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </motion.div>

        {loading || !data ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Config cards */}
            <div className="space-y-3 mb-8">
              {data.configs.map(cfg => (
                <ConfigCard key={cfg.key} cfg={cfg} />
              ))}
            </div>

            {/* Stats */}
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Estado do Squad</h2>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Agentes",  value: data.stats.agentCount },
                { label: "Briefs",   value: data.stats.briefCount },
                { label: "Base KB",  value: data.stats.kbCount    },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl border border-white/6 bg-white/[0.02]">
                  <p className="text-xs text-white/30 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-white/80">{value}</p>
                </div>
              ))}
            </div>

            {/* .env.local reference */}
            <div className="p-4 rounded-xl border border-white/6 bg-white/[0.02]">
              <p className="text-xs text-white/40 mb-2 font-semibold">Arquivo de configuração</p>
              <code className="block text-xs font-mono text-white/50 bg-white/3 rounded-lg p-3 leading-relaxed whitespace-pre">
                {[
                  `# ${data.provider === "vertex" ? "Google Vertex AI" : "Anthropic API"}`,
                  data.provider === "vertex"
                    ? "GOOGLE_CLOUD_PROJECT_ID=seu-projeto"
                    : "ANTHROPIC_API_KEY=sk-ant-...",
                  "",
                  "# Exa — busca semântica (exa.ai)",
                  "EXA_API_KEY=sua-chave-exa",
                  "",
                  "# Squad",
                  "SQUAD_PATH=/caminho/para/squad",
                ].join("\n")}
              </code>
              <p className="text-[11px] text-white/20 mt-2">
                Após editar <code className="font-mono">.env.local</code>, reinicie o servidor com <code className="font-mono">npm run dev</code>
              </p>
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

function ConfigCard({ cfg }: { cfg: ConfigItem }) {
  const ok = cfg.status === "ok";
  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      ok ? "border-white/6 bg-white/[0.02]" : "border-amber-500/20 bg-amber-500/5"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {ok
              ? <CheckCircle2 size={13} className="text-[#7DC52B] shrink-0" />
              : <XCircle size={13} className="text-amber-400 shrink-0" />
            }
            <span className="text-sm font-semibold text-white/80">{cfg.label}</span>
            <code className="text-[10px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">{cfg.key}</code>
          </div>
          <p className="text-xs text-white/40 leading-relaxed">{cfg.hint}</p>
          {ok && cfg.value && (
            <p className="text-[11px] font-mono text-white/25 mt-1 truncate">{cfg.value}</p>
          )}
          {!ok && (
            <p className="text-[11px] text-amber-400/70 mt-1">
              Adicione <code className="font-mono">{cfg.key}=sua-chave</code> no .env.local
            </p>
          )}
        </div>
        {cfg.url && (
          <a
            href={cfg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors mt-0.5"
          >
            Obter chave <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}
