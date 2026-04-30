"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import {
  Layers, Monitor, Tablet, Smartphone, Plus, ChevronUp, ChevronDown,
  Trash2, MessageSquare, Send, Loader2, Check, Palette,
  Globe, Zap, LayoutTemplate, RefreshCw, ExternalLink, Pen, Info,
  Code2, Copy, PlayCircle, StopCircle, CheckCircle2, AlertCircle,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */
const SECTION_TYPES = {
  hero:         { label: "Hero",          color: "#818CF8" },
  about:        { label: "Sobre",         color: "#FB923C" },
  services:     { label: "Serviços",      color: "#34D399" },
  portfolio:    { label: "Portfólio",     color: "#22D3EE" },
  testimonials: { label: "Depoimentos",   color: "#F472B6" },
  faq:          { label: "FAQ",           color: "#FBBF24" },
  cta:          { label: "CTA",           color: "#F87171" },
  metrics:      { label: "Métricas",      color: "#A78BFA" },
  process:      { label: "Processo",      color: "#6EE7B7" },
  custom:       { label: "Personalizada", color: "#9CA3AF" },
} as const;

type SectionType = keyof typeof SECTION_TYPES;
type SectionStatus = "draft" | "in-progress" | "done";
type Device = "desktop" | "tablet" | "mobile";
type GenStatus = "idle" | "pending" | "generating" | "done" | "error";

const STATUS_DOT: Record<SectionStatus, string> = {
  "draft":       "rgba(156,163,175,0.5)",
  "in-progress": "#FBBF24",
  "done":        "#7DC52B",
};

const DEVICE_W: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 375 };

const AVAILABLE_EFFECTS = [
  "fade-up", "fade-in", "slide-left", "slide-right", "scroll-reveal",
  "parallax", "magnetic-button", "counter", "stagger",
  "horizontal-scroll", "noise-texture", "glitch", "typewriter", "shader-bg",
];

const AGENTS_LIST = [
  "web-designer", "ux-researcher", "ui-developer",
  "motion-engineer", "copy-specialist", "assets-manager",
];

interface Section {
  id: string;
  order: number;
  name: string;
  type: SectionType;
  status: SectionStatus;
  notes: string;
  agent: string;
  effects: string[];
}

interface ChatMsg { role: "user" | "assistant"; content: string }
interface AIAction { type: string; params: Record<string, string> }

/* ─── Defaults ──────────────────────────────────────────────────────── */
const DEFAULT_SECTIONS: Section[] = [
  { id: "s1", order: 1, name: "Hero",        type: "hero",         status: "draft", notes: "", agent: "web-designer",   effects: ["fade-up", "magnetic-button"] },
  { id: "s2", order: 2, name: "Sobre",       type: "about",        status: "draft", notes: "", agent: "copy-specialist", effects: [] },
  { id: "s3", order: 3, name: "Serviços",    type: "services",     status: "draft", notes: "", agent: "ui-developer",    effects: ["stagger", "scroll-reveal"] },
  { id: "s4", order: 4, name: "Portfólio",   type: "portfolio",    status: "draft", notes: "", agent: "assets-manager",  effects: ["horizontal-scroll"] },
  { id: "s5", order: 5, name: "Depoimentos", type: "testimonials", status: "draft", notes: "", agent: "copy-specialist", effects: [] },
  { id: "s6", order: 6, name: "FAQ",         type: "faq",          status: "draft", notes: "", agent: "copy-specialist", effects: [] },
  { id: "s7", order: 7, name: "CTA Final",   type: "cta",          status: "draft", notes: "", agent: "web-designer",   effects: ["magnetic-button"] },
];

/* ─── Parse AI XML-style actions ────────────────────────────────────── */
function parseActions(text: string): AIAction[] {
  const out: AIAction[] = [];
  const re = /<(add|update|remove|reorder)-section\s([^/]*?)\/>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const params: Record<string, string> = {};
    const ap = /(\w+)="([^"]*)"/g;
    let am;
    while ((am = ap.exec(m[2])) !== null) params[am[1]] = am[2];
    out.push({ type: m[1] + "-section", params });
  }
  return out;
}

/* ─── Section height ratios for wireframe blocks ────────────────────── */
const SECTION_HEIGHTS: Record<SectionType, number> = {
  hero: 180, about: 120, services: 150, portfolio: 200,
  testimonials: 130, faq: 100, cta: 90, metrics: 100, process: 140, custom: 100,
};

/* ─── StatusField with tooltip ──────────────────────────────────────── */
function StatusField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
          Status
        </label>
        <div className="relative">
          <button
            type="button"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex items-center justify-center"
            style={{ color: "var(--text-subtle)", lineHeight: 0 }}
          >
            <Info size={11} />
          </button>
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 p-2.5 rounded-lg pointer-events-none"
                style={{
                  background: "rgba(10,14,20,0.97)",
                  border: "1px solid rgba(0,230,118,0.2)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  fontSize: 11,
                  lineHeight: "1.5",
                  color: "var(--text-secondary)",
                }}
              >
                O status é alterado pelo usuário manualmente ou pelo agente ao concluir uma tarefa via comando.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg px-2 py-2 text-xs outline-none"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
      >
        <option value="draft">Rascunho</option>
        <option value="in-progress">Em progresso</option>
        <option value="done">Pronto</option>
      </select>
      <p className="text-[9px] mt-1 leading-snug" style={{ color: "var(--text-subtle)" }}>
        Alterado por você ou pelo agente ao concluir
      </p>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function StudioPage() {
  const STORAGE_KEY = "aiox-studio-sections-v2";

  const [sections, setSections] = useState<Section[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SECTIONS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    } catch { return DEFAULT_SECTIONS; }
  });

  const [selected, setSelected] = useState<string | null>("s1");
  const [device, setDevice] = useState<Device>("desktop");
  const [previewMode, setPreviewMode] = useState<"wireframe" | "iframe">("wireframe");
  const [previewUrl, setPreviewUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<AIAction[]>([]);
  const [zoom, setZoom] = useState(100);
  const [briefBanner, setBriefBanner] = useState<{ name: string; niche?: string; siteType?: string } | null>(null);
  const [briefBannerDismissed, setBriefBannerDismissed] = useState(false);
  // ─── Generation state ──────────────────────────────────────────────
  const [genResults, setGenResults] = useState<Record<string, string>>({});
  const [genStatus, setGenStatus] = useState<Record<string, GenStatus>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const stopGenRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Persist sections
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sections)); } catch { /* quota */ }
  }, [sections]);

  // Load brief banner suggestion
  useEffect(() => {
    if (briefBannerDismissed) return;
    try {
      const stored = localStorage.getItem("activeBrief");
      if (stored) {
        const parsed = JSON.parse(stored) as { name: string; niche?: string; siteType?: string };
        setBriefBanner(parsed);
      }
    } catch { /* ignore */ }
  }, [briefBannerDismissed]);

  // Load preview URL
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aiox-preview-url");
      if (saved) setPreviewUrl(saved);
    } catch { /* ignore */ }
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── Section operations ──────────────────────────────────────────── */
  const updateSection = useCallback((id: string, patch: Partial<Section>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }, []);

  const moveUp = useCallback((id: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }, []);

  const addSection = useCallback((afterIndex?: number) => {
    const newSec: Section = {
      id: `s${Date.now()}`,
      order: sections.length + 1,
      name: "Nova Seção",
      type: "custom",
      status: "draft",
      notes: "",
      agent: "web-designer",
      effects: [],
    };
    setSections(prev => {
      if (afterIndex === undefined) return [...prev, newSec].map((s, i) => ({ ...s, order: i + 1 }));
      const next = [...prev];
      next.splice(afterIndex + 1, 0, newSec);
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setSelected(newSec.id);
  }, [sections.length]);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
    setSelected(null);
  }, []);

  const toggleEffect = useCallback((sectionId: string, effect: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const effects = s.effects.includes(effect)
        ? s.effects.filter(e => e !== effect)
        : [...s.effects, effect];
      return { ...s, effects };
    }));
  }, []);

  /* ─── Apply AI actions ───────────────────────────────────────────── */
  const applyAction = useCallback((action: AIAction) => {
    const { type, params } = action;
    if (type === "add-section") {
      const afterOrder = params.after ? parseInt(params.after) - 1 : undefined;
      const afterIdx = afterOrder !== undefined
        ? sections.findIndex(s => s.order === afterOrder)
        : undefined;
      const newSec: Section = {
        id: `s${Date.now()}`,
        order: (afterIdx !== undefined ? afterIdx + 2 : sections.length + 1),
        name: params.name ?? "Nova Seção",
        type: (params.type as SectionType) ?? "custom",
        status: "draft",
        notes: params.notes ?? "",
        agent: params.agent ?? "web-designer",
        effects: [],
      };
      setSections(prev => {
        const idx = afterIdx !== undefined ? afterIdx : prev.length - 1;
        const next = [...prev];
        next.splice(idx + 1, 0, newSec);
        return next.map((s, i) => ({ ...s, order: i + 1 }));
      });
      setSelected(newSec.id);
    } else if (type === "update-section") {
      const target = sections.find(s =>
        s.order === parseInt(params.order ?? "0") || s.name === params.name
      );
      if (target) {
        const patch: Partial<Section> = {};
        if (params.status) patch.status = params.status as SectionStatus;
        if (params.newName) patch.name = params.newName;
        if (params.type) patch.type = params.type as SectionType;
        if (params.notes) patch.notes = params.notes;
        updateSection(target.id, patch);
      }
    } else if (type === "remove-section") {
      const target = sections.find(s =>
        s.order === parseInt(params.order ?? "0") || s.name === params.name
      );
      if (target) removeSection(target.id);
    }
    setPendingActions(prev => prev.filter(a => a !== action));
  }, [sections, updateSection, removeSection]);

  /* ─── AI Chat ─────────────────────────────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput("");

    const sectionsContext = sections.map(s =>
      `${s.order}. ${s.name} (${SECTION_TYPES[s.type].label}) — ${s.status}${s.effects.length ? ` — efeitos: ${s.effects.join(", ")}` : ""}`
    ).join("\n");

    const systemContext = `Você é um consultor de web design premium trabalhando no AIOX Studio.
As seções atuais do projeto são:
${sectionsContext}

Quando o usuário pedir para ADICIONAR, REMOVER, ATUALIZAR ou REORDENAR seções, inclua na resposta tags XML de ação no formato:
- Adicionar: <add-section name="Nome" type="tipo" after="N" />
- Atualizar: <update-section order="N" status="done" />
- Remover: <remove-section order="N" />

Tipos válidos: hero, about, services, portfolio, testimonials, faq, cta, metrics, process, custom.
Responda em português. Seja direto e prático.`;

    const newMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: "web-designer",
          messages: [
            { role: "user", content: systemContext },
            { role: "assistant", content: "Entendido. Estou pronto para ajudar com o projeto." },
            ...newMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const reply = data.content ?? data.message ?? "Sem resposta.";
      const actions = parseActions(reply);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      if (actions.length > 0) setPendingActions(prev => [...prev, ...actions]);
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Erro ao conectar com o agente. Verifique a configuração da API.",
      }]);
    } finally {
      setChatLoading(false);
    }
  }, [input, chatLoading, messages, sections]);

  /* ─── Generation ─────────────────────────────────────────────────── */
  const generateSection = useCallback(async (sec: Section): Promise<boolean> => {
    setGenStatus(prev => ({ ...prev, [sec.id]: "generating" }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: { order: sec.order, name: sec.name, type: sec.type, agent: sec.agent, effects: sec.effects, notes: sec.notes } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      setGenResults(prev => ({ ...prev, [sec.id]: data.code }));
      setGenStatus(prev => ({ ...prev, [sec.id]: "done" }));
      updateSection(sec.id, { status: "done" });
      return true;
    } catch {
      setGenStatus(prev => ({ ...prev, [sec.id]: "error" }));
      return false;
    }
  }, [updateSection]);

  const generateAll = useCallback(async () => {
    if (isGenerating) { stopGenRef.current = true; return; }
    stopGenRef.current = false;
    setIsGenerating(true);
    setShowCode(false);
    const statuses: Record<string, GenStatus> = {};
    sections.forEach(s => { statuses[s.id] = "pending"; });
    setGenStatus(statuses);
    for (const sec of sections) {
      if (stopGenRef.current) break;
      await generateSection(sec);
      if (!stopGenRef.current) await new Promise(r => setTimeout(r, 4500));
    }
    setIsGenerating(false);
    stopGenRef.current = false;
  }, [isGenerating, sections, generateSection]);

  const copySectionCode = useCallback((id: string) => {
    const code = genResults[id];
    if (code) navigator.clipboard.writeText(code).catch(() => {});
  }, [genResults]);

  /* ─── Computed ────────────────────────────────────────────────────── */
  const selectedSection = sections.find(s => s.id === selected) ?? null;
  const previewWidth = DEVICE_W[device];

  const SITE_SECTION_SUGGESTIONS: Record<string, string[]> = {
    portfolio:     ["Hero", "Sobre", "Projetos", "Processo", "Contato"],
    "landing-page": ["Hero", "Benefícios", "Como Funciona", "Depoimentos", "CTA", "FAQ"],
    "e-commerce":  ["Hero", "Produtos em Destaque", "Sobre", "Contato"],
  };

  const detectSiteType = (niche?: string): string | null => {
    if (!niche) return null;
    const n = niche.toLowerCase();
    if (n.includes("portfolio") || n.includes("portfólio") || n.includes("designer") || n.includes("fotógrafo")) return "portfolio";
    if (n.includes("loja") || n.includes("e-commerce") || n.includes("produto")) return "e-commerce";
    return "landing-page";
  };

  const suggestedType = briefBanner ? detectSiteType(briefBanner.niche) : null;
  const suggestedSections = suggestedType ? SITE_SECTION_SUGGESTIONS[suggestedType] : null;

  /* ─── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      {/* ── Main canvas area ── */}
      <div className="flex flex-1" style={{ marginLeft: "var(--sidebar-w)" }}>

        {/* ── LEFT: Sections Tree (220px) ── */}
        <div
          className="flex flex-col shrink-0 border-r"
          style={{ width: 220, borderColor: "var(--border)", background: "rgba(2,4,8,0.7)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Layers size={13} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Seções
              </span>
            </div>
            <button
              onClick={() => addSection()}
              className="w-5 h-5 rounded flex items-center justify-center transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text-subtle)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,230,118,0.4)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
              title="Adicionar seção"
            >
              <Plus size={10} />
            </button>
          </div>

          {/* Sections list */}
          <div className="flex-1 overflow-y-auto py-2">
            <AnimatePresence initial={false}>
              {sections.map((sec, idx) => {
                const type = SECTION_TYPES[sec.type];
                const isSelected = selected === sec.id;
                return (
                  <motion.div
                    key={sec.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div
                      className="group flex items-center gap-2 px-3 py-2.5 cursor-pointer mx-1 rounded-lg transition-all"
                      style={isSelected ? {
                        background: `${type.color}12`,
                        borderLeft: `2px solid ${type.color}`,
                        paddingLeft: 10,
                      } : {
                        borderLeft: "2px solid transparent",
                        paddingLeft: 10,
                      }}
                      onClick={() => setSelected(sec.id)}
                    >
                      {/* Order number */}
                      <span
                        className="text-[9px] font-mono shrink-0 w-4 text-right"
                        style={{ color: isSelected ? type.color : "var(--text-subtle)" }}
                      >
                        {sec.order}
                      </span>

                      {/* Status dot */}
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: STATUS_DOT[sec.status] }}
                      />

                      {/* Name */}
                      <span
                        className="text-xs flex-1 truncate font-medium"
                        style={{ color: isSelected ? "var(--text-primary)" : "var(--text-secondary)" }}
                      >
                        {sec.name}
                      </span>

                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); moveUp(sec.id); }}
                          className="w-3.5 h-3 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                          disabled={idx === 0}
                          style={{ opacity: idx === 0 ? 0.2 : 1 }}
                        >
                          <ChevronUp size={9} style={{ color: "var(--text-muted)" }} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); moveDown(sec.id); }}
                          className="w-3.5 h-3 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                          disabled={idx === sections.length - 1}
                          style={{ opacity: idx === sections.length - 1 ? 0.2 : 1 }}
                        >
                          <ChevronDown size={9} style={{ color: "var(--text-muted)" }} />
                        </button>
                      </div>
                    </div>

                    {/* Type badge */}
                    {isSelected && (
                      <div className="mx-3 mb-1 -mt-1">
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${type.color}15`, color: type.color }}
                        >
                          {type.label}
                        </span>
                        {sec.effects.slice(0, 2).map(ef => (
                          <span
                            key={ef}
                            className="text-[8px] px-1.5 py-0.5 rounded ml-1"
                            style={{ background: "rgba(0,230,118,0.08)", color: "rgba(0,230,118,0.6)" }}
                          >
                            {ef}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Add section at end */}
            <button
              onClick={() => addSection(sections.length - 1)}
              className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 mx-1 rounded-lg text-[10px] transition-all"
              style={{ color: "var(--text-subtle)", border: "1px dashed var(--border)", width: "calc(100% - 8px)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,230,118,0.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              <Plus size={9} /> Adicionar seção
            </button>
          </div>

          {/* Footer stats */}
          <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between text-[9px]" style={{ color: "var(--text-subtle)" }}>
              <span>{sections.length} seções</span>
              <span style={{ color: "#7DC52B" }}>
                {sections.filter(s => s.status === "done").length} prontas
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#7DC52B" }}
                animate={{ width: `${(sections.filter(s => s.status === "done").length / sections.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* ── CENTER: Preview Canvas ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "var(--surface-0, #060a0e)" }}>
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: "var(--border)", background: "rgba(2,4,8,0.8)" }}
          >
            {/* Device toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              {(["desktop", "tablet", "mobile"] as Device[]).map(d => {
                const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
                return (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className="flex items-center justify-center w-7 h-6 rounded transition-all"
                    style={device === d ? {
                      background: "var(--accent)",
                      color: "#020408",
                    } : {
                      color: "var(--text-subtle)",
                    }}
                  >
                    <Icon size={12} />
                  </button>
                );
              })}
            </div>

            {/* Center: mode + URL */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(p => p === "wireframe" ? "iframe" : "wireframe")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
              >
                <LayoutTemplate size={11} />
                {previewMode === "wireframe" ? "Wireframe" : "Iframe"}
              </button>

              {previewMode === "iframe" && (
                <div className="flex items-center gap-1.5">
                  {showUrlInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={urlInputRef}
                        value={previewUrl}
                        onChange={e => setPreviewUrl(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            try { localStorage.setItem("aiox-preview-url", previewUrl); } catch {}
                            setShowUrlInput(false);
                          }
                          if (e.key === "Escape") setShowUrlInput(false);
                        }}
                        placeholder="https://..."
                        className="text-xs px-2 py-1 rounded outline-none"
                        style={{
                          width: 220, background: "var(--surface-2)",
                          border: "1px solid var(--border-accent)", color: "var(--text-primary)",
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          try { localStorage.setItem("aiox-preview-url", previewUrl); } catch {}
                          setShowUrlInput(false);
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: "var(--accent)", color: "#020408" }}
                      >
                        <Check size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowUrlInput(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all"
                      style={{ border: "1px solid var(--border)", color: "var(--text-subtle)" }}
                    >
                      <Globe size={10} />
                      {previewUrl ? new URL(previewUrl).hostname : "Definir URL"}
                    </button>
                  )}
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={12} style={{ color: "var(--text-subtle)" }} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Zoom + Gerar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>{zoom}%</span>
                <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5" style={{ color: "var(--text-subtle)" }}>
                  <span className="text-sm leading-none">−</span>
                </button>
                <button onClick={() => setZoom(z => Math.min(150, z + 25))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5" style={{ color: "var(--text-subtle)" }}>
                  <span className="text-sm leading-none">+</span>
                </button>
                <button onClick={() => setZoom(100)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5" style={{ color: "var(--text-subtle)" }}>
                  <RefreshCw size={10} />
                </button>
              </div>
              <div className="w-px h-4 shrink-0" style={{ background: "var(--border)" }} />
              {isGenerating && (
                <span className="text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>
                  {Object.values(genStatus).filter(s => s === "done").length}/{sections.length}
                </span>
              )}
              <button
                onClick={generateAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={isGenerating
                  ? { background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171" }
                  : { background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.25)", color: "var(--accent)" }
                }
              >
                {isGenerating ? <><StopCircle size={10} /> Parar</> : <><PlayCircle size={10} /> Gerar</>}
              </button>
            </div>
          </div>

          {/* Brief context banner */}
          {briefBanner && !briefBannerDismissed && suggestedSections && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0"
              style={{ borderColor: "rgba(0,230,118,0.15)", background: "rgba(0,230,118,0.04)" }}
            >
              <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>
                Sugestão para "{briefBanner.name}":
              </span>
              <div className="flex items-center gap-1 flex-1 overflow-hidden">
                {suggestedSections.map((s, i) => (
                  <span key={s} className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,230,118,0.1)", color: "rgba(0,230,118,0.8)", border: "1px solid rgba(0,230,118,0.2)", whiteSpace: "nowrap" }}>
                      {s}
                    </span>
                    {i < suggestedSections.length - 1 && (
                      <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>→</span>
                    )}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setBriefBannerDismissed(true)}
                className="shrink-0 text-[10px] px-2 py-1 rounded transition-all"
                style={{ color: "var(--text-subtle)", border: "1px solid var(--border)" }}
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-8" style={{ background: "#0a0d12" }}>
            <div
              style={{
                width: previewWidth,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "width 0.3s ease",
              }}
            >
              {previewMode === "iframe" && previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full rounded-xl border"
                  style={{ height: 800, borderColor: "var(--border)" }}
                  title="Preview"
                />
              ) : (
                /* Wireframe blocks */
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  {sections.map((sec, idx) => {
                    const type = SECTION_TYPES[sec.type];
                    const h = SECTION_HEIGHTS[sec.type] ?? 100;
                    const isSelected = selected === sec.id;
                    return (
                      <motion.div
                        key={sec.id}
                        layout
                        className="relative cursor-pointer group transition-all duration-200"
                        style={{
                          height: h,
                          background: isSelected ? `${type.color}10` : `${type.color}06`,
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          outline: isSelected ? `2px solid ${type.color}50` : "none",
                          outlineOffset: -2,
                        }}
                        onClick={() => setSelected(sec.id)}
                        onDoubleClick={() => addSection(idx)}
                        whileHover={{ backgroundColor: `${type.color}10` }}
                      >
                        {/* Section label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p
                              className="text-sm font-semibold mb-1"
                              style={{ color: isSelected ? type.color : `${type.color}80` }}
                            >
                              {sec.name}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className="text-[9px] px-2 py-0.5 rounded-full"
                                style={{ background: `${type.color}20`, color: type.color }}
                              >
                                {type.label}
                              </span>
                              {sec.effects.slice(0, 2).map(ef => (
                                <span key={ef} className="text-[8px] flex items-center gap-1" style={{ color: "rgba(0,230,118,0.5)" }}>
                                  <Zap size={8} />{ef}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Order badge */}
                        <div
                          className="absolute top-2 left-3 text-[10px] font-mono"
                          style={{ color: `${type.color}60` }}
                        >
                          {sec.order < 10 ? `0${sec.order}` : sec.order}
                        </div>

                        {/* Status */}
                        <div className="absolute top-2 right-3 flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: STATUS_DOT[sec.status] }}
                          />
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {sec.status === "done" ? "pronto" : sec.status === "in-progress" ? "em progresso" : "rascunho"}
                          </span>
                        </div>

                        {/* Generation status badge */}
                        {genStatus[sec.id] && genStatus[sec.id] !== "idle" && (
                          <div className="absolute bottom-2 right-3">
                            {genStatus[sec.id] === "pending" && (
                              <span className="text-[8px] flex items-center gap-1" style={{ color: "var(--text-subtle)" }}>
                                <Loader2 size={8} className="animate-spin" /> aguardando
                              </span>
                            )}
                            {genStatus[sec.id] === "generating" && (
                              <span className="text-[8px] flex items-center gap-1" style={{ color: "#FBBF24" }}>
                                <Loader2 size={8} className="animate-spin" style={{ color: "#FBBF24" }} /> gerando...
                              </span>
                            )}
                            {genStatus[sec.id] === "done" && (
                              <button
                                onClick={e => { e.stopPropagation(); setSelected(sec.id); setShowCode(true); }}
                                className="text-[8px] flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.3)", color: "var(--accent)" }}
                              >
                                <CheckCircle2 size={8} /> código
                              </button>
                            )}
                            {genStatus[sec.id] === "error" && (
                              <button
                                onClick={e => { e.stopPropagation(); generateSection(sec); }}
                                className="text-[8px] flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171" }}
                              >
                                <AlertCircle size={8} /> retry
                              </button>
                            )}
                          </div>
                        )}

                        {/* Add section hint on hover */}
                        <div
                          className="absolute bottom-0 left-0 right-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ height: 16 }}
                        >
                          <span className="text-[8px]" style={{ color: "rgba(0,230,118,0.4)" }}>
                            duplo clique para inserir seção abaixo
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Properties + Chat (320px) ── */}
        <div
          className="flex flex-col shrink-0 border-l"
          style={{ width: 320, borderColor: "var(--border)", background: "rgba(2,4,8,0.85)" }}
        >
          {/* Properties panel */}
          <div className="border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <Palette size={12} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Propriedades
              </span>
            </div>

            {selectedSection ? (
              <div className="p-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-subtle)" }}>
                    Nome
                  </label>
                  <input
                    value={selectedSection.name}
                    onChange={e => updateSection(selectedSection.id, { name: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--border-accent)"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                  />
                </div>

                {/* Type + Status row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-subtle)" }}>
                      Tipo
                    </label>
                    <select
                      value={selectedSection.type}
                      onChange={e => updateSection(selectedSection.id, { type: e.target.value as SectionType })}
                      className="w-full rounded-lg px-2 py-2 text-xs outline-none"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      {Object.entries(SECTION_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <StatusField
                    value={selectedSection.status}
                    onChange={v => updateSection(selectedSection.id, { status: v as SectionStatus })}
                  />
                </div>

                {/* Agent */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-subtle)" }}>
                    Agente responsável
                  </label>
                  <select
                    value={selectedSection.agent}
                    onChange={e => updateSection(selectedSection.id, { agent: e.target.value })}
                    className="w-full rounded-lg px-2 py-2 text-xs outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  >
                    {AGENTS_LIST.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Effects */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-2" style={{ color: "var(--text-subtle)" }}>
                    Efeitos de motion
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_EFFECTS.map(ef => {
                      const active = selectedSection.effects.includes(ef);
                      return (
                        <button
                          key={ef}
                          onClick={() => toggleEffect(selectedSection.id, ef)}
                          className="text-[9px] px-2 py-1 rounded-full transition-all"
                          style={active ? {
                            background: "rgba(0,230,118,0.15)",
                            border: "1px solid rgba(0,230,118,0.4)",
                            color: "var(--accent)",
                          } : {
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border)",
                            color: "var(--text-subtle)",
                          }}
                        >
                          {active && <span className="mr-1">✓</span>}{ef}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-subtle)" }}>
                    Notas
                  </label>
                  <textarea
                    value={selectedSection.notes}
                    onChange={e => updateSection(selectedSection.id, { notes: e.target.value })}
                    rows={2}
                    placeholder="Instruções para o agente..."
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--border-accent)"}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                  />
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeSection(selectedSection.id)}
                  className="flex items-center gap-2 text-xs transition-all"
                  style={{ color: "rgba(248,113,113,0.5)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F87171"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.5)"}
                >
                  <Trash2 size={11} /> Remover seção
                </button>
              </div>
            ) : (
              <div className="p-4 text-center py-8">
                <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                  Clique em uma seção para editar
                </p>
              </div>
            )}
          </div>

          {/* ── Generated Code Panel ── */}
          {selectedSection && (genResults[selectedSection.id] || genStatus[selectedSection.id] === "generating" || genStatus[selectedSection.id] === "error") && (
            <div className="border-b flex flex-col" style={{ borderColor: "var(--border)", maxHeight: showCode ? 240 : "auto" }}>
              <button
                onClick={() => setShowCode(v => !v)}
                className="flex items-center justify-between px-4 py-2.5 w-full text-left"
                style={{ borderBottom: showCode ? "1px solid var(--border)" : "none" }}
              >
                <div className="flex items-center gap-2">
                  <Code2 size={11} style={{ color: genStatus[selectedSection.id] === "done" ? "var(--accent)" : genStatus[selectedSection.id] === "error" ? "#F87171" : "#FBBF24" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                    Código Gerado
                  </span>
                  {genStatus[selectedSection.id] === "generating" && (
                    <Loader2 size={10} className="animate-spin" style={{ color: "#FBBF24" }} />
                  )}
                  {genStatus[selectedSection.id] === "done" && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,230,118,0.1)", color: "var(--accent)", border: "1px solid rgba(0,230,118,0.2)" }}>
                      pronto
                    </span>
                  )}
                </div>
                {genResults[selectedSection.id] && (
                  <button
                    onClick={e => { e.stopPropagation(); copySectionCode(selectedSection.id); }}
                    className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded transition-all"
                    style={{ border: "1px solid var(--border)", color: "var(--text-subtle)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,230,118,0.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                  >
                    <Copy size={8} /> Copiar
                  </button>
                )}
              </button>
              {showCode && (
                <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
                  {genResults[selectedSection.id] ? (
                    <>
                      <div className="px-3 py-1 shrink-0" style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid var(--border)" }}>
                        <span className="text-[8px] font-mono" style={{ color: "var(--text-subtle)" }}>
                          {selectedSection.name.replace(/\s/g, "")}Section.tsx
                        </span>
                      </div>
                      <pre className="text-[8px] leading-relaxed p-3 font-mono whitespace-pre-wrap break-words" style={{ color: "var(--text-secondary)" }}>
                        {genResults[selectedSection.id]}
                      </pre>
                    </>
                  ) : genStatus[selectedSection.id] === "generating" ? (
                    <div className="flex items-center gap-2 p-4">
                      <Loader2 size={12} className="animate-spin" style={{ color: "#FBBF24" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Gerando componente...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4">
                      <AlertCircle size={12} style={{ color: "#F87171" }} />
                      <button onClick={() => generateSection(selectedSection)} className="text-[10px]" style={{ color: "#F87171" }}>
                        Tentar novamente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── AI Chat ── */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <MessageSquare size={12} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Assistente
              </span>
              <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(0,230,118,0.5)" }}>
                web-designer
              </span>
            </div>

            {/* Pending AI actions */}
            <AnimatePresence>
              {pendingActions.map((action, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-3 mt-2"
                >
                  <div
                    className="flex items-center justify-between p-2 rounded-lg text-[11px]"
                    style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.2)" }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {action.type === "add-section" && `Adicionar: ${action.params.name}`}
                      {action.type === "update-section" && `Atualizar: seção ${action.params.order ?? action.params.name}`}
                      {action.type === "remove-section" && `Remover: seção ${action.params.order ?? action.params.name}`}
                    </span>
                    <button
                      onClick={() => applyAction(action)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold ml-2 shrink-0"
                      style={{ background: "var(--accent)", color: "#020408" }}
                    >
                      Aplicar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="text-center pt-4">
                  <p className="text-xs mb-3" style={{ color: "var(--text-subtle)" }}>
                    Pergunte sobre as seções ou peça modificações
                  </p>
                  {[
                    "Adiciona uma seção de autoridade depois da 2",
                    "Quais efeitos recomendar para o hero?",
                    "Muda o status da seção 3 para done",
                  ].map(hint => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="block w-full text-left text-[10px] px-3 py-2 rounded-lg mb-1.5 transition-all"
                      style={{ border: "1px solid var(--border)", color: "var(--text-subtle)", background: "var(--surface-1)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,230,118,0.3)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed"
                    style={msg.role === "user" ? {
                      background: "rgba(0,230,118,0.12)",
                      border: "1px solid rgba(0,230,118,0.2)",
                      color: "var(--text-primary)",
                    } : {
                      background: "var(--surface-1)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {/* Strip action tags from display */}
                    {msg.content.replace(/<(add|update|remove|reorder)-section[^/]*\/>/g, "").trim()}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                  >
                    <Loader2 size={11} className="animate-spin" style={{ color: "var(--accent)" }} />
                    <span className="text-[11px]" style={{ color: "var(--text-subtle)" }}>pensando...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="px-3 pb-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
              >
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Peça uma modificação... (Enter para enviar)"
                  rows={2}
                  className="flex-1 text-xs outline-none resize-none"
                  style={{
                    background: "transparent",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || chatLoading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  style={input.trim() && !chatLoading ? {
                    background: "var(--accent)",
                    color: "#020408",
                  } : {
                    background: "var(--surface-2)",
                    color: "var(--text-subtle)",
                  }}
                >
                  {chatLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
