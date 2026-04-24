"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FolderOpen, FileText, ArrowRight, Plus, Clock, CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface Brief { name: string; content: string }

function extractField(content: string, label: string): string {
  const match = content.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brief")
      .then(r => r.json())
      .then(data => { setBriefs(data.briefs ?? []); setLoading(false); })
      .catch(() => setLoading(false));

    try {
      const stored = localStorage.getItem("activeBrief");
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string };
        setActiveBriefId(parsed.id ?? null);
      }
    } catch { /* ignore */ }
  }, []);

  const openBrief = (brief: Brief) => {
    const client = extractField(brief.content, "Nome");
    const niche  = extractField(brief.content, "Nicho");
    try {
      localStorage.setItem("activeBrief", JSON.stringify({
        name: client || brief.name,
        niche,
        id: brief.name,
      }));
      setActiveBriefId(brief.name);
    } catch { /* ignore */ }
  };

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
            className="flex items-start justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen size={13} style={{ color: "var(--text-subtle)" }} />
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                  Projetos
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Briefs Salvos
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Todos os projetos disponíveis para os agentes do squad
              </p>
            </div>
            <Link
              href="/brief"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-1 shrink-0 transition-all"
              style={{ background: "var(--accent)", color: "#020408", boxShadow: "0 0 16px rgba(0,230,118,0.3)" }}
            >
              <Plus size={13} /> Novo Brief
            </Link>
          </motion.div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 rounded-xl animate-skeleton" style={{ background: "var(--surface-1)" }} />
              ))}
            </div>
          ) : briefs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed"
              style={{ borderColor: "var(--border)" }}
            >
              <FileText size={32} className="mb-4" style={{ color: "var(--text-subtle)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                Nenhum projeto salvo ainda
              </p>
              <p className="text-xs mb-6" style={{ color: "var(--text-subtle)" }}>
                Crie um brief para definir o contexto de todos os agentes
              </p>
              <Link
                href="/brief"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "var(--accent)", color: "#020408", boxShadow: "0 0 16px rgba(0,230,118,0.3)" }}
              >
                <Plus size={13} /> Criar primeiro brief
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {briefs.map((brief, i) => {
                const niche    = extractField(brief.content, "Nicho");
                const client   = extractField(brief.content, "Nome");
                const target   = extractField(brief.content, "Público");
                const aesthetic = extractField(brief.content, "Estética");

                return (
                  <motion.div
                    key={brief.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <div
                      className="group flex items-start gap-4 p-5 rounded-xl border transition-all duration-200"
                      style={{
                        borderColor: activeBriefId === brief.name ? "rgba(0,230,118,0.3)" : "var(--border)",
                        background: activeBriefId === brief.name ? "rgba(0,230,118,0.04)" : "var(--surface-1)",
                      }}
                      onMouseEnter={e => {
                        if (activeBriefId !== brief.name) {
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
                          (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (activeBriefId !== brief.name) {
                          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLElement).style.background = "var(--surface-1)";
                        }
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: activeBriefId === brief.name ? "rgba(0,230,118,0.12)" : "rgba(0,230,118,0.08)",
                          border: `1px solid ${activeBriefId === brief.name ? "rgba(0,230,118,0.3)" : "rgba(0,230,118,0.18)"}`,
                        }}
                      >
                        <FileText size={16} style={{ color: "var(--accent)" }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {client || brief.name}
                          </p>
                          {activeBriefId === brief.name && (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(0,230,118,0.12)", color: "var(--accent)", border: "1px solid rgba(0,230,118,0.25)" }}>
                              <CheckCircle2 size={9} /> Ativo
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {niche && (
                            <span className="text-[11px]" style={{ color: "var(--accent)", opacity: 0.8 }}>
                              {niche}
                            </span>
                          )}
                          {target && (
                            <span className="text-[11px]" style={{ color: "var(--text-subtle)" }}>
                              {target}
                            </span>
                          )}
                          {aesthetic && (
                            <span className="text-[11px]" style={{ color: "var(--text-subtle)" }}>
                              {aesthetic}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock size={10} style={{ color: "var(--text-subtle)" }} />
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>
                            {brief.name}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0 items-end">
                        <Link
                          href={`/brief`}
                          onClick={() => openBrief(brief)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: activeBriefId === brief.name ? "var(--accent)" : "var(--surface-2)",
                            color: activeBriefId === brief.name ? "#020408" : "var(--text-secondary)",
                            border: `1px solid ${activeBriefId === brief.name ? "var(--accent)" : "var(--border)"}`,
                          }}
                        >
                          {activeBriefId === brief.name ? "Aberto" : "Abrir"}
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
