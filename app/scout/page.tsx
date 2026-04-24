"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import {
  Upload, Trash2, FileText, Plus, X, Search, ChevronRight,
  Globe, Loader2, CheckCircle2, Compass, BarChart2,
  RefreshCw, Save, Clock, Zap, AlertCircle,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */
interface KBFile {
  name: string;
  size: number;
  modified: string;
  preview: string;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  category: string;
  relevance: "alta" | "média" | "baixa";
}

interface MetricResult {
  title: string;
  url: string;
  summary: string;
  category: string;
  publishedDate?: string;
}

/* ── Constants ──────────────────────────────────────────── */
const CATEGORY_LABELS: Record<string, string> = {
  visual:    "🎨 Inspiração Visual",
  animation: "✨ Animação / Motion",
  ui:        "⚙️ UI / Componentes",
  reference: "📊 Benchmark / Referência",
};

const RELEVANCE_COLOR: Record<string, string> = {
  alta:  "#00E676",
  média: "#FBBF24",
  baixa: "#60A5FA",
};

const METRIC_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  seo:         { label: "SEO",        icon: "🔍", color: "#60A5FA" },
  cro:         { label: "Conversão",  icon: "📈", color: "#00E676" },
  design:      { label: "Design & UX",icon: "🎨", color: "#A78BFA" },
  performance: { label: "Performance",icon: "⚡", color: "#FBBF24" },
  mobile:      { label: "Mobile",     icon: "📱", color: "#F472B6" },
};

const AUTO_REFRESH_INTERVALS = [
  { label: "30 min", ms: 30 * 60 * 1000 },
  { label: "1h",     ms: 60 * 60 * 1000 },
  { label: "3h",     ms: 3 * 60 * 60 * 1000 },
];

/* ── Component ──────────────────────────────────────────── */
export default function ScoutPage() {
  const [tab, setTab] = useState<"base" | "metricas">("base");

  /* KB state */
  const [files, setFiles]           = useState<KBFile[]>([]);
  const [kbLoading, setKbLoading]   = useState(true);
  const [adding, setAdding]         = useState(false);
  const [newName, setNewName]       = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  /* Web search state */
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching]         = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError]     = useState("");
  const [savedNiche, setSavedNiche]       = useState("");
  const [selectedRefs, setSelectedRefs]   = useState<string[]>([]);

  /* Metrics state */
  const [selectedCats, setSelectedCats]     = useState<string[]>(Object.keys(METRIC_CATEGORIES));
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricResults, setMetricResults]   = useState<MetricResult[] | null>(null);
  const [metricsError, setMetricsError]     = useState("");
  const [lastUpdated, setLastUpdated]       = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh]       = useState<number | null>(null);
  const [countdown, setCountdown]           = useState<number>(0);
  const [metricsSaved, setMetricsSaved]     = useState(false);
  const autoRefreshTimerRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── KB helpers ─────────────────────────────────── */
  const loadKB = useCallback(async () => {
    setKbLoading(true);
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setFiles(data.files ?? []);
    setKbLoading(false);
  }, []);

  useEffect(() => { loadKB(); }, [loadKB]);

  const toggleRef = (url: string) => {
    setSelectedRefs(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const goToBriefWithRefs = () => {
    try {
      localStorage.setItem("scoutReferences", JSON.stringify(selectedRefs));
      // Mantém compatibilidade com o formato antigo (aiox-scout-refs)
      localStorage.setItem("aiox-scout-refs", JSON.stringify(selectedRefs.slice(0, 3)));
    } catch { /* ignore */ }
    window.location.href = "/brief";
  };

  const runWebSearch = async () => {
    if (!searchKeyword.trim() || searching) return;
    setSearching(true);
    setSearchResults(null);
    setSearchError("");
    setSavedNiche("");
    setSelectedRefs([]);

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: searchKeyword.trim(), save: true }),
    });
    const data = await res.json();
    setSearching(false);

    if (!res.ok) { setSearchError(data.error ?? "Erro na busca"); return; }
    setSearchResults(data.results);
    if (data.saved) { setSavedNiche(data.filename); loadKB(); }
  };

  const saveFile = async () => {
    if (!newName.trim() || !newContent.trim()) return;
    setSaving(true);
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), content: newContent.trim() }),
    });
    setSaving(false);
    setAdding(false);
    setNewName("");
    setNewContent("");
    loadKB();
  };

  const deleteFile = async (name: string) => {
    setDeleting(name);
    await fetch("/api/knowledge", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setDeleting(null);
    loadKB();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setSaving(true);
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, content }),
    });
    setSaving(false);
    loadKB();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const grouped = searchResults
    ? Object.keys(CATEGORY_LABELS).reduce<Record<string, SearchResult[]>>((acc, cat) => {
        acc[cat] = searchResults.filter(r => r.category === cat);
        return acc;
      }, {})
    : null;

  /* ── Metrics helpers ────────────────────────────── */
  const fetchMetrics = useCallback(async (save = false) => {
    if (metricsLoading) return;
    setMetricsLoading(true);
    setMetricsError("");
    setMetricsSaved(false);

    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: selectedCats, save }),
    });
    const data = await res.json();
    setMetricsLoading(false);

    if (!res.ok) { setMetricsError(data.error ?? "Erro ao buscar métricas"); return; }
    setMetricResults(data.results);
    setLastUpdated(new Date().toLocaleTimeString("pt-BR"));
    if (save) { setMetricsSaved(true); loadKB(); setTimeout(() => setMetricsSaved(false), 3000); }
  }, [metricsLoading, selectedCats, loadKB]);

  /* Auto-refresh logic */
  useEffect(() => {
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (autoRefresh !== null) {
      setCountdown(autoRefresh / 1000);

      countdownRef.current = setInterval(() => {
        setCountdown(p => {
          if (p <= 1) { return autoRefresh / 1000; }
          return p - 1;
        });
      }, 1000);

      autoRefreshTimerRef.current = setInterval(() => {
        fetchMetrics(false);
      }, autoRefresh);
    }

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, fetchMetrics]);

  const toggleCat = (key: string) =>
    setSelectedCats(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);

  const groupedMetrics = metricResults
    ? Object.keys(METRIC_CATEGORIES).reduce<Record<string, MetricResult[]>>((acc, cat) => {
        acc[cat] = metricResults.filter(r => r.category === cat);
        return acc;
      }, {})
    : null;

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-start justify-between mb-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Compass size={13} style={{ color: "var(--text-subtle)" }} />
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                  Passo 2
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Reference Scout
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Base de conhecimento · Pesquisa web · Métricas ao vivo
              </p>
            </div>
            <a
              href="/agents/reference-scout"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border transition-all shrink-0 mt-1"
              style={{ background: "var(--accent-subtle)", borderColor: "rgba(0,230,118,0.25)", color: "var(--accent)" }}
            >
              <Search size={13} /> Chat do Scout <ChevronRight size={13} />
            </a>
          </motion.div>

          {/* Tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            {[
              { id: "base",     label: "Base de Conhecimento", icon: FileText },
              { id: "metricas", label: "Métricas ao Vivo",     icon: BarChart2 },
            ].map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as "base" | "metricas")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={active ? {
                    background: "rgba(0,230,118,0.1)",
                    color: "var(--accent)",
                    boxShadow: "0 0 12px rgba(0,230,118,0.1)",
                    border: "1px solid rgba(0,230,118,0.2)",
                  } : {
                    color: "var(--text-muted)",
                    border: "1px solid transparent",
                  }}
                >
                  <Icon size={13} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab: Base de Conhecimento ────────────── */}
          <AnimatePresence mode="wait">
          {tab === "base" && (
            <motion.div
              key="base"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >

              {/* Web Search */}
              <div
                className="mb-6 p-4 rounded-xl border"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={14} style={{ color: "#F59E0B" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Mapear web por nicho
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && runWebSearch()}
                    placeholder="ex: advogado, clínica estética, restaurante..."
                    className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "#F59E0B44"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                  />
                  <button
                    onClick={runWebSearch}
                    disabled={!searchKeyword.trim() || searching}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 disabled:opacity-40"
                    style={{ background: "#F59E0B", color: "#020408" }}
                  >
                    {searching
                      ? <><Loader2 size={13} className="animate-spin" /> Buscando...</>
                      : <><Globe size={13} /> Mapear</>
                    }
                  </button>
                </div>
                <p className="text-[11px] mt-2" style={{ color: "var(--text-subtle)" }}>
                  Busca visual, motion, UI e benchmarks — salva automaticamente na base
                </p>
                {searchError && (
                  <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(252,165,165,0.9)" }}>
                    {searchError}
                  </div>
                )}
                {savedNiche && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 p-2.5 rounded-lg text-xs"
                    style={{ background: "var(--accent-subtle)", border: "1px solid rgba(0,230,118,0.2)", color: "var(--accent)" }}
                  >
                    <CheckCircle2 size={12} />
                    Salvo em <code className="font-mono">{savedNiche}</code>
                  </motion.div>
                )}
              </div>

              {/* Selected refs indicator */}
              {selectedRefs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl border"
                  style={{ borderColor: "rgba(0,230,118,0.25)", background: "rgba(0,230,118,0.05)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)", animation: "pulse-dot 2s ease-in-out infinite" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      {selectedRefs.length} referência{selectedRefs.length !== 1 ? "s" : ""} selecionada{selectedRefs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={goToBriefWithRefs}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
                    style={{ background: "var(--accent)", color: "#020408", boxShadow: "0 0 12px rgba(0,230,118,0.3)" }}
                  >
                    Ir para o Brief com referências →
                  </button>
                </motion.div>
              )}

              {/* Search results */}
              <AnimatePresence>
                {grouped && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                        Resultados para <span style={{ color: "#F59E0B" }}>{searchKeyword}</span>
                        <span className="font-normal ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          ({searchResults?.length} referências)
                        </span>
                      </p>
                    </div>
                    {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                      const items = grouped[cat] ?? [];
                      if (!items.length) return null;
                      return (
                        <div key={cat} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                          <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                            <p className="text-xs font-semibold" style={{ color: "var(--text-subtle)" }}>{label}</p>
                          </div>
                          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                            {items.map(r => {
                              const isSelected = selectedRefs.includes(r.url);
                              let domain = "";
                              try { domain = new URL(r.url).hostname; } catch { /* ignore */ }
                              return (
                                <div
                                  key={r.url}
                                  className="px-4 py-3 transition-colors"
                                  style={{ background: isSelected ? "rgba(0,230,118,0.04)" : undefined }}
                                >
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <button
                                      onClick={() => toggleRef(r.url)}
                                      className="shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
                                      title={isSelected ? "Remover seleção" : "Selecionar para o Brief"}
                                      style={{
                                        border: isSelected ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                                        background: isSelected ? "var(--accent)" : "transparent",
                                        color: isSelected ? "#020408" : "transparent",
                                      }}
                                    >
                                      {isSelected && <span style={{ fontSize: 8, fontWeight: 700 }}>✓</span>}
                                    </button>
                                    {/* Favicon */}
                                    {domain ? (
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                        alt=""
                                        width={16}
                                        height={16}
                                        className="rounded shrink-0"
                                        onError={e => {
                                          const img = e.currentTarget as HTMLImageElement;
                                          img.style.display = "none";
                                          const next = img.nextElementSibling as HTMLElement | null;
                                          if (next) next.style.display = "block";
                                        }}
                                      />
                                    ) : null}
                                    {domain ? (
                                      <Globe size={14} className="shrink-0" style={{ color: "var(--text-subtle)", display: "none" }} />
                                    ) : (
                                      <Globe size={14} className="shrink-0" style={{ color: "var(--text-subtle)" }} />
                                    )}
                                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                                      className="flex-1 text-sm font-medium truncate hover:underline"
                                      style={{ color: isSelected ? "var(--accent)" : "var(--text-secondary)" }}
                                    >
                                      {r.title}
                                    </a>
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                                      style={{ color: RELEVANCE_COLOR[r.relevance], background: `${RELEVANCE_COLOR[r.relevance]}18` }}
                                    >
                                      {r.relevance}
                                    </span>
                                    <button
                                      onClick={() => toggleRef(r.url)}
                                      className="shrink-0 text-[10px] px-2 py-0.5 rounded transition-all"
                                      style={isSelected ? {
                                        background: "rgba(0,230,118,0.12)",
                                        border: "1px solid rgba(0,230,118,0.3)",
                                        color: "var(--accent)",
                                      } : {
                                        border: "1px solid var(--border)",
                                        color: "var(--text-subtle)",
                                      }}
                                    >
                                      {isSelected ? "Selecionado" : "Usar no Brief"}
                                    </button>
                                  </div>
                                  <p className="text-[11px] truncate ml-6" style={{ color: "var(--text-subtle)" }}>{r.url}</p>
                                  {r.description && (
                                    <p className="text-xs mt-1 leading-relaxed line-clamp-2 ml-6" style={{ color: "var(--text-muted)" }}>
                                      {r.description}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Arquivos na base", value: files.length },
                  { label: "Tamanho total",    value: formatSize(files.reduce((a, f) => a + f.size, 0)) },
                  { label: "Nichos mapeados",  value: files.filter(f => f.name.startsWith("refs-")).length },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-subtle)" }}>{label}</p>
                    <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
                >
                  <Plus size={13} /> Adicionar manual
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
                >
                  <Upload size={13} /> Upload arquivo
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.html" onChange={uploadFile} className="hidden" />
              </div>

              {/* Add form */}
              <AnimatePresence>
                {adding && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mb-4 p-4 rounded-xl border"
                    style={{ borderColor: "rgba(0,230,118,0.2)", background: "var(--accent-subtle)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Novo arquivo de referência</p>
                      <button onClick={() => setAdding(false)} style={{ color: "var(--text-subtle)" }}><X size={14} /></button>
                    </div>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="Nome (ex: refs-advocacia-extra.md)"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-2 transition-all"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    />
                    <textarea
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="Cole aqui: URLs, bookmarks, notas, links..."
                      rows={5}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none transition-all"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={saveFile}
                        disabled={saving || !newName.trim() || !newContent.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                        style={{ background: "var(--accent)", color: "#020408", boxShadow: "0 0 16px rgba(0,230,118,0.3)" }}
                      >
                        {saving ? "Salvando..." : "Salvar na base"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File list */}
              {kbLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl animate-skeleton" style={{ background: "var(--surface-1)" }} />)}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm" style={{ color: "var(--text-subtle)" }}>Base de conhecimento vazia</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-subtle)", opacity: 0.6 }}>
                    Use "Mapear web" ou adicione arquivos manualmente
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map(file => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-start gap-3 p-4 rounded-xl border group transition-all"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                    >
                      <FileText size={14} className="shrink-0 mt-0.5" style={{
                        color: file.name.startsWith("guide-") ? "#A78BFA"
                             : file.name.startsWith("metrics-") ? "#00E676"
                             : "#F59E0B",
                      }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>{file.name}</p>
                          <span className="text-[10px] shrink-0" style={{ color: "var(--text-subtle)" }}>{formatSize(file.size)}</span>
                          {file.name.startsWith("refs-") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>ref</span>
                          )}
                          {file.name.startsWith("guide-") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>guia</span>
                          )}
                          {file.name.startsWith("metrics-") && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>live</span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed truncate" style={{ color: "var(--text-subtle)" }}>{file.preview}</p>
                      </div>
                      <button
                        onClick={() => deleteFile(file.name)}
                        disabled={deleting === file.name}
                        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: "rgba(239,68,68,0.6)" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-5 p-3 rounded-xl border text-xs" style={{ borderColor: "rgba(0,230,118,0.15)", background: "var(--accent-subtle)", color: "rgba(0,230,118,0.7)" }}>
                  💡 Base com {files.length} arquivo{files.length > 1 ? "s" : ""}. Abra o{" "}
                  <a href="/agents/reference-scout" className="underline">chat do Scout</a>{" "}
                  e ele lê tudo automaticamente.
                </div>
              )}
            </motion.div>
          )}

          {/* ── Tab: Métricas ao Vivo ─────────────────── */}
          {tab === "metricas" && (
            <motion.div
              key="metricas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >

              {/* Control panel */}
              <div
                className="p-4 rounded-xl border mb-5"
                style={{ borderColor: "var(--border-accent)", background: "rgba(0,230,118,0.03)", boxShadow: "0 0 24px rgba(0,230,118,0.05)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} style={{ color: "var(--accent)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Busca automática de métricas e tendências
                  </p>
                  {lastUpdated && (
                    <span className="ml-auto text-[11px] font-mono flex items-center gap-1" style={{ color: "var(--text-subtle)" }}>
                      <Clock size={10} /> {lastUpdated}
                    </span>
                  )}
                </div>

                {/* Category selector */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(METRIC_CATEGORIES).map(([key, cat]) => {
                    const active = selectedCats.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleCat(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                        style={active ? {
                          background: `${cat.color}15`,
                          border: `1px solid ${cat.color}40`,
                          color: cat.color,
                          boxShadow: `0 0 8px ${cat.color}18`,
                        } : {
                          border: "1px solid var(--border)",
                          color: "var(--text-subtle)",
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => fetchMetrics(false)}
                    disabled={metricsLoading || selectedCats.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: "var(--accent)",
                      color: "#020408",
                      boxShadow: metricsLoading ? "none" : "0 0 16px rgba(0,230,118,0.35)",
                    }}
                  >
                    {metricsLoading
                      ? <><Loader2 size={13} className="animate-spin" /> Buscando...</>
                      : <><RefreshCw size={13} /> Buscar agora</>
                    }
                  </button>

                  {metricResults && (
                    <button
                      onClick={() => fetchMetrics(true)}
                      disabled={metricsLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-40"
                      style={{ border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-muted)" }}
                    >
                      {metricsSaved ? <><CheckCircle2 size={13} style={{ color: "var(--accent)" }} /> Salvo!</> : <><Save size={13} /> Salvar na base</>}
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs" style={{ color: "var(--text-subtle)" }}>Auto:</span>
                    {AUTO_REFRESH_INTERVALS.map(opt => (
                      <button
                        key={opt.ms}
                        onClick={() => setAutoRefresh(autoRefresh === opt.ms ? null : opt.ms)}
                        className="px-2.5 py-1 rounded text-[11px] transition-all"
                        style={autoRefresh === opt.ms ? {
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                          border: "1px solid rgba(0,230,118,0.3)",
                        } : {
                          border: "1px solid var(--border)",
                          color: "var(--text-subtle)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {autoRefresh !== null && (
                      <span className="text-[11px] font-mono px-2" style={{ color: "var(--accent)" }}>
                        {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error */}
              {metricsError && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(252,165,165,0.9)" }}>
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {metricsError}
                </div>
              )}

              {/* Empty state */}
              {!metricResults && !metricsLoading && !metricsError && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="text-center py-10 px-6">
                    <BarChart2 size={28} className="mx-auto mb-3" style={{ color: "var(--text-subtle)" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                      Nenhuma métrica carregada
                    </p>
                    <p className="text-xs mb-4" style={{ color: "var(--text-subtle)" }}>
                      Selecione as categorias acima e clique em "Buscar agora".<br />
                      Requer <strong style={{ color: "var(--text-muted)" }}>EXA_API_KEY</strong> configurada.
                    </p>
                    <a
                      href="/settings"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{ border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.06)", color: "#FBBF24" }}
                    >
                      Verificar configurações →
                    </a>
                  </div>
                  {/* Preview mockup */}
                  <div className="px-4 pb-4 space-y-2 opacity-25 pointer-events-none">
                    {["SEO", "Conversão", "Performance"].map(label => (
                      <div key={label} className="p-3 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded" style={{ background: "var(--surface-2)" }} />
                          <div className="h-3 w-16 rounded" style={{ background: "var(--surface-2)" }} />
                        </div>
                        <div className="h-2.5 w-full rounded mb-1" style={{ background: "var(--surface-2)" }} />
                        <div className="h-2.5 w-3/4 rounded" style={{ background: "var(--surface-2)" }} />
                      </div>
                    ))}
                    <p className="text-center text-xs py-1" style={{ color: "var(--text-subtle)" }}>
                      Assim ficará quando configurado
                    </p>
                  </div>
                </div>
              )}

              {/* Results */}
              {groupedMetrics && (
                <div className="space-y-4">
                  {Object.entries(METRIC_CATEGORIES).map(([key, cat]) => {
                    const items = groupedMetrics[key] ?? [];
                    if (!items.length || !selectedCats.includes(key)) return null;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border overflow-hidden"
                        style={{ borderColor: `${cat.color}20`, background: `${cat.color}05` }}
                      >
                        <div
                          className="flex items-center gap-2 px-4 py-3 border-b"
                          style={{ borderColor: `${cat.color}15` }}
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-sm font-semibold" style={{ color: cat.color }}>
                            {cat.label}
                          </span>
                          <span
                            className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full"
                            style={{ background: `${cat.color}15`, color: cat.color }}
                          >
                            {items.length} fontes
                          </span>
                        </div>
                        <div className="divide-y" style={{ borderColor: `${cat.color}10` }}>
                          {items.map(r => (
                            <div key={r.url} className="px-4 py-3.5">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium hover:underline"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {r.title}
                                </a>
                                {r.publishedDate && (
                                  <span className="text-[10px] shrink-0 font-mono" style={{ color: "var(--text-subtle)" }}>
                                    {new Date(r.publishedDate).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                              {r.summary && (
                                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                  {r.summary}
                                </p>
                              )}
                              <p className="text-[10px] mt-1.5 truncate" style={{ color: "var(--text-subtle)" }}>
                                {r.url}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

            </motion.div>
          )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
