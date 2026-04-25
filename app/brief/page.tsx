"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Save, ChevronRight, ChevronLeft, Check, FileText, FolderOpen, Trash2, Clock, Info, Compass, Download, X } from "lucide-react";
import { addActivity } from "@/lib/activityFeed";
import { useToast } from "@/components/Toast";

/* ── Constantes ─────────────────────────────────────────────── */
const AESTHETICS = [
  "Dark & Premium", "Light & Clean", "Editorial/Magazine",
  "Tech/Futurista", "Orgânico/Natural", "Minimalista extremo",
  "Expressivo/Bold", "Elegante/Sutil", "Brutal/Raw", "Luxury/Alto Padrão",
];

const SITE_TYPES = [
  { value: "portfolio",     label: "Portfólio",      desc: "Showroom de projetos e serviços"      },
  { value: "landing-page",  label: "Landing Page",   desc: "Conversão focada em 1 objetivo"        },
  { value: "e-commerce",    label: "E-commerce",     desc: "Loja online com produtos"              },
  { value: "saas",          label: "SaaS",           desc: "Produto digital / aplicativo"          },
  { value: "institucional", label: "Institucional",  desc: "Empresa, marca ou serviço"             },
  { value: "blog",          label: "Blog/Editorial", desc: "Conteúdo e publicações"                },
];

const MOTION_SPEEDS = ["Lento (luxo)", "Médio (equilíbrio)", "Rápido (energia)"];

const EFFECTS_WITH_DESC = [
  { name: "Custom cursor",    desc: "Cursor personalizado: dot + ring com glow verde" },
  { name: "Scroll reveal",    desc: "Fade + translate nos elementos ao entrar na viewport" },
  { name: "Magnetic button",  desc: "CTA principal que segue o mouse magneticamente (±20px)" },
  { name: "Shader background",desc: "Background com shader GLSL animado via WebGL" },
  { name: "Noise texture",    desc: "Overlay de textura granulada sutil em todo o site" },
  { name: "Parallax",         desc: "Camadas com velocidades de scroll diferentes" },
  { name: "Horizontal scroll",desc: "Seção de projetos com scroll horizontal pinned" },
  { name: "Page transition",  desc: "Transição entre páginas com overlay ou wipe" },
  { name: "3D element",       desc: "Elemento Three.js ou Spline interativo" },
];

const INTEGRATIONS_LIST = [
  "WhatsApp / Click-to-chat",
  "Formulário de contato",
  "Cal.com / Calendly (agendamento)",
  "Stripe / pagamento online",
  "Hotmart / Kiwify",
  "Google Analytics / Tag Manager",
  "Meta Pixel / TikTok Pixel",
  "CRM (HubSpot, RD Station)",
  "Newsletter (Mailchimp, Brevo)",
  "Chat ao vivo (Tawk, Intercom)",
];

const BUDGET_OPTIONS = [
  "Até R$ 1.500",
  "R$ 1.500 – R$ 3.000",
  "R$ 3.000 – R$ 6.000",
  "R$ 6.000 – R$ 12.000",
  "Acima de R$ 12.000",
  "Não definido",
];

const HOSTING_OPTIONS = [
  { value: "vercel",   label: "Vercel",    desc: "Next.js nativo, CI/CD automático" },
  { value: "netlify",  label: "Netlify",   desc: "Suporte a sites estáticos"         },
  { value: "cpanel",   label: "cPanel",    desc: "Hospedagem tradicional"            },
  { value: "wordpress",label: "WordPress", desc: "CMS com editor visual"             },
  { value: "other",    label: "Outro",     desc: "Definir com o cliente"             },
];

const STEPS = ["Cliente", "Visual", "Motion", "Narrativa", "Entrega", "Revisão"];

const EMPTY_FORM = {
  // Aba 1 — Cliente
  clientName: "", niche: "", siteType: "",
  target: "", differentiator: "", tone: "", objective: "", cta: "",
  competitors: "", existingBrand: "",
  contentStatus: "" as "" | "tem-tudo" | "tem-parcial" | "nao-tem",

  // Aba 2 — Visual
  aesthetic: [] as string[],
  moodWords: "",
  ref1: "", ref2: "", ref3: "", ref4: "", ref5: "",
  bg: "#040404", text: "#f0f0f5", accent: "#00E676",
  headingFont: "", bodyFont: "",

  // Aba 3 — Motion
  motionSpeed: "", effects: [] as string[],

  // Aba 4 — Narrativa
  protagonist: "", problem: "", headline: "", tagline: "",
  successMetric: "",

  // Aba 5 — Entrega
  deadline: "", budget: "",
  integrations: [] as string[],
  hosting: "",
  pages: "" as "" | "onepage" | "multipage",
  observations: "",
};

interface SavedBrief { name: string; content: string }
interface BriefVersion { timestamp: string; snapshot: typeof EMPTY_FORM }

const MAX_VERSIONS = 5;

/* ── Progresso por aba ──────────────────────────────────────── */
function calcTabProgress(form: typeof EMPTY_FORM, tabIndex: number): { filled: number; total: number } {
  const checks: Record<number, (() => boolean)[]> = {
    0: [
      () => !!form.clientName, () => !!form.niche, () => !!form.siteType,
      () => !!form.target, () => !!form.differentiator, () => !!form.tone,
      () => !!form.objective, () => !!form.cta,
    ],
    1: [
      () => form.aesthetic.length > 0, () => !!form.moodWords,
      () => !!form.ref1, () => !!form.headingFont,
    ],
    2: [() => !!form.motionSpeed, () => form.effects.length > 0],
    3: [
      () => !!form.protagonist, () => !!form.problem,
      () => !!form.headline, () => !!form.tagline, () => !!form.successMetric,
    ],
    4: [() => !!form.deadline, () => !!form.budget, () => !!form.hosting],
    5: [],
  };
  const fns = checks[tabIndex] ?? [];
  return { filled: fns.filter(fn => fn()).length, total: fns.length };
}

function TabDot({ tabIndex, form }: { tabIndex: number; form: typeof EMPTY_FORM }) {
  if (tabIndex === 5) return null;
  const { filled, total } = calcTabProgress(form, tabIndex);
  if (total === 0 || filled === 0) return null;
  const color = filled === total ? "#00E676" : "#FBBF24";
  return (
    <span
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: color, boxShadow: filled === total ? "0 0 4px #00E676" : "none" }}
    />
  );
}

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

/* ── Componente principal ───────────────────────────────────── */
export default function BriefPage() {
  const toast = useToast();
  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [form, setForm]     = useState({ ...EMPTY_FORM });
  const [hoveredEffect, setHoveredEffect] = useState<string | null>(null);
  const [savedBriefs, setSavedBriefs]     = useState<SavedBrief[]>([]);
  const [panelOpen, setPanelOpen]         = useState(false);
  const [loadingBriefs, setLoadingBriefs] = useState(false);
  const [scoutRefs, setScoutRefs]         = useState<string[]>([]);
  const [scoutRefsImported, setScoutRefsImported] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions]       = useState<BriefVersion[]>([]);
  const [restoredToast, setRestoredToast] = useState(false);

  const loadBriefs = async () => {
    setLoadingBriefs(true);
    try {
      const res = await fetch("/api/brief");
      const data = await res.json();
      setSavedBriefs(data.briefs ?? []);
    } catch { /* ignore */ }
    setLoadingBriefs(false);
  };

  useEffect(() => { loadVersions(form.clientName); }, [form.clientName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadBriefs();
    try {
      const stored = localStorage.getItem("scoutReferences");
      if (stored) {
        const refs: string[] = JSON.parse(stored);
        if (refs.length > 0) setScoutRefs(refs);
      }
    } catch { /* ignore */ }
    try {
      const oldRefs = localStorage.getItem("aiox-scout-refs");
      if (oldRefs) {
        const refs: string[] = JSON.parse(oldRefs);
        setForm(p => ({ ...p, ref1: refs[0] ?? p.ref1, ref2: refs[1] ?? p.ref2, ref3: refs[2] ?? p.ref3 }));
        localStorage.removeItem("aiox-scout-refs");
        setStep(1);
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const importScoutRefs = () => {
    setForm(p => ({ ...p, ref1: scoutRefs[0] ?? p.ref1, ref2: scoutRefs[1] ?? p.ref2, ref3: scoutRefs[2] ?? p.ref3, ref4: scoutRefs[3] ?? p.ref4, ref5: scoutRefs[4] ?? p.ref5 }));
    setScoutRefsImported(true);
    try { localStorage.removeItem("scoutReferences"); } catch { /* ignore */ }
    setScoutRefs([]);
    setStep(1);
    toast.info("Referências importadas do Scout");
  };

  const set = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (k: "aesthetic" | "effects" | "integrations", v: string) =>
    set(k, (form[k] as string[]).includes(v) ? (form[k] as string[]).filter(x => x !== v) : [...(form[k] as string[]), v]);

  const versionsKey = (name: string) => `aiox-brief-versions-${(name || "novo-projeto").toLowerCase().replace(/\s+/g, "-")}`;
  const loadVersions = (name: string) => {
    try {
      const raw = localStorage.getItem(versionsKey(name));
      setVersions(raw ? (JSON.parse(raw) as BriefVersion[]) : []);
    } catch { setVersions([]); }
  };

  const saveVersion = (f: typeof EMPTY_FORM) => {
    const name = f.clientName || "novo-projeto";
    try {
      const key = versionsKey(name);
      const existing: BriefVersion[] = (() => { try { return JSON.parse(localStorage.getItem(key) ?? "[]") as BriefVersion[]; } catch { return []; } })();
      const updated = [{ timestamp: new Date().toISOString(), snapshot: { ...f } }, ...existing].slice(0, MAX_VERSIONS);
      localStorage.setItem(key, JSON.stringify(updated));
      setVersions(updated);
    } catch { /* quota */ }
  };

  const restoreVersion = (ver: BriefVersion) => {
    setForm({ ...ver.snapshot });
    setHistoryOpen(false);
    setRestoredToast(true);
    setTimeout(() => setRestoredToast(false), 2500);
  };

  const refs = [form.ref1, form.ref2, form.ref3, form.ref4, form.ref5].filter(Boolean);

  const exportMarkdown = () => {
    const siteTypeLabel = SITE_TYPES.find(s => s.value === form.siteType)?.label ?? form.siteType;
    const md = `# Brief — ${form.clientName || "Novo Projeto"}

## Cliente
- **Nome:** ${form.clientName}
- **Nicho:** ${form.niche}
- **Tipo de site:** ${siteTypeLabel}
- **Público-alvo:** ${form.target}
- **Diferencial:** ${form.differentiator}
- **Tom de voz:** ${form.tone}
- **Identidade existente:** ${form.existingBrand || "Não informado"}
- **Status do conteúdo:** ${form.contentStatus || "Não informado"}

## Objetivo
- **Objetivo:** ${form.objective}
- **CTA:** ${form.cta}
- **Concorrentes:** ${form.competitors || "—"}
- **Métrica de sucesso:** ${form.successMetric || "—"}

## Visual
- **Estética:** ${form.aesthetic.join(", ")}
- **Palavras-chave visuais:** ${form.moodWords}
- **Referências:** ${refs.join(", ")}
- **Background:** ${form.bg} | **Texto:** ${form.text} | **Accent:** ${form.accent}
- **Heading Font:** ${form.headingFont} | **Body Font:** ${form.bodyFont}

## Motion
- **Velocidade:** ${form.motionSpeed}
- **Efeitos:** ${form.effects.join(", ")}

## Narrativa
- **Protagonista:** ${form.protagonist}
- **Problema:** ${form.problem}
- **Headline:** ${form.headline}
- **Tagline:** ${form.tagline}

## Entrega
- **Prazo:** ${form.deadline || "—"}
- **Budget:** ${form.budget || "—"}
- **Páginas:** ${form.pages === "onepage" ? "One-page" : form.pages === "multipage" ? "Multi-page" : "—"}
- **Hospedagem:** ${HOSTING_OPTIONS.find(h => h.value === form.hosting)?.label ?? form.hosting}
- **Integrações:** ${form.integrations.join(", ") || "Nenhuma"}
- **Observações:** ${form.observations || "—"}
`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brief-${(form.clientName || "novo-projeto").toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const loadBrief = (brief: SavedBrief) => {
    const lines = brief.content.split("\n");
    const get = (label: string) => lines.find(l => l.includes(`**${label}:**`))?.split(":**")?.[1]?.trim() ?? "";
    const getList = (label: string) => get(label).split(",").map(s => s.trim()).filter(Boolean);
    setForm(p => ({
      ...p,
      clientName: get("Nome"), niche: get("Nicho"), target: get("Público"),
      differentiator: get("Diferencial"), tone: get("Tom"),
      objective: get("Objetivo"), cta: get("CTA"),
      headline: get("Headline"), tagline: get("Tagline"),
      motionSpeed: get("Velocidade"),
      aesthetic: getList("Estética"), effects: getList("Efeitos"),
    }));
    setStep(0); setPanelOpen(false);
  };

  const deleteBrief = async (name: string) => { setSavedBriefs(p => p.filter(b => b.name !== name)); };

  const buildContent = () => {
    const siteTypeLabel = SITE_TYPES.find(s => s.value === form.siteType)?.label ?? form.siteType;
    return `# Creative Brief — ${form.clientName || "Novo Projeto"}

## Cliente
- **Nome:** ${form.clientName}
- **Nicho:** ${form.niche}
- **Tipo de site:** ${siteTypeLabel}
- **Público:** ${form.target}
- **Diferencial:** ${form.differentiator}
- **Tom:** ${form.tone}
- **Identidade existente:** ${form.existingBrand || "Não informado"}
- **Status do conteúdo:** ${form.contentStatus || "Não informado"}

## Objetivo
- **Objetivo:** ${form.objective}
- **CTA:** ${form.cta}
- **Concorrentes:** ${form.competitors || "—"}
- **Sucesso:** ${form.successMetric || "—"}

## Direção Visual
- **Estética:** ${form.aesthetic.join(", ")}
- **Mood:** ${form.moodWords}
- **Referências:** ${refs.join(" | ")}
- **Background:** ${form.bg} | **Texto:** ${form.text} | **Accent:** ${form.accent}
- **Heading:** ${form.headingFont} | **Body:** ${form.bodyFont}

## Motion Language
- **Velocidade:** ${form.motionSpeed}
- **Efeitos:** ${form.effects.join(", ")}

## Narrativa
- **Protagonista:** ${form.protagonist}
- **Problema:** ${form.problem}
- **Headline:** ${form.headline}
- **Tagline:** ${form.tagline}

## Entrega
- **Prazo:** ${form.deadline || "—"}
- **Budget:** ${form.budget || "—"}
- **Páginas:** ${form.pages === "onepage" ? "One-page" : form.pages === "multipage" ? "Multi-page" : "—"}
- **Hospedagem:** ${HOSTING_OPTIONS.find(h => h.value === form.hosting)?.label ?? form.hosting}
- **Integrações:** ${form.integrations.join(", ") || "Nenhuma"}
- **Observações:** ${form.observations || "—"}
`;
  };

  const saveBrief = async () => {
    setSaving(true);
    saveVersion(form);
    const slug = form.clientName.toLowerCase().replace(/\s+/g, "-") || "novo-projeto";
    await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: slug, content: buildContent() }),
    });
    try {
      localStorage.setItem("activeBrief", JSON.stringify({
        name: form.clientName || slug, niche: form.niche,
        siteType: form.siteType, id: slug,
      }));
    } catch { /* quota */ }
    addActivity({ type: "brief_saved", message: `Brief salvo: ${form.clientName || slug}` }, slug);
    setSaving(false); setSaved(true);
    toast.success("Brief salvo com sucesso!");
    setTimeout(() => setSaved(false), 2500);
    loadBriefs();
  };

  /* ── Helpers de renderização ────────────────────────────── */
  const field = (label: string, key: keyof typeof form, placeholder?: string, hint?: string) => (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
        {hint && <span className="ml-1.5 text-[10px] opacity-50">{hint}</span>}
      </label>
      <input
        value={form[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--border-accent)"}
        onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
      />
    </div>
  );

  const textarea = (label: string, key: keyof typeof form, placeholder?: string, hint?: string) => (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
        {hint && <span className="ml-1.5 text-[10px] opacity-50">{hint}</span>}
      </label>
      <textarea
        value={form[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all resize-none"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--border-accent)"}
        onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
      />
    </div>
  );

  const reviewRows = [
    { k: "Projeto",   v: form.clientName,           empty: "Nenhum nome — volte ao passo 1" },
    { k: "Nicho",     v: form.niche,                empty: "Nicho não preenchido — passo 1" },
    { k: "Tipo",      v: SITE_TYPES.find(s => s.value === form.siteType)?.label ?? "", empty: "Tipo de site não definido — passo 1" },
    { k: "Público",   v: form.target,               empty: "Público-alvo não definido" },
    { k: "Objetivo",  v: form.objective,            empty: "Objetivo não preenchido" },
    { k: "Estética",  v: form.aesthetic.join(", "), empty: "Nenhuma estética — passo 2" },
    { k: "Mood",      v: form.moodWords,            empty: "Palavras-chave visuais não definidas — passo 2" },
    { k: "Accent",    v: form.accent,               empty: "" },
    { k: "Motion",    v: form.motionSpeed,          empty: "Velocidade não definida — passo 3" },
    { k: "Efeitos",   v: form.effects.join(", "),   empty: "Nenhum efeito — passo 3" },
    { k: "Headline",  v: form.headline,             empty: "Headline não criada — passo 4" },
    { k: "Sucesso",   v: form.successMetric,        empty: "Métrica de sucesso não definida — passo 4" },
    { k: "Prazo",     v: form.deadline,             empty: "Prazo não definido — passo 5" },
    { k: "Budget",    v: form.budget,               empty: "Budget não definido — passo 5" },
  ];

  const totalFilled = STEPS.slice(0, 5).reduce((acc, _, i) => {
    const { filled, total } = calcTabProgress(form, i);
    return acc + (total > 0 ? filled / total : 0);
  }, 0);
  const briefCompleteness = Math.round((totalFilled / 5) * 100);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto" style={{ marginLeft: "var(--sidebar-w)" }}>
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="flex items-start justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={13} style={{ color: "var(--text-subtle)" }} />
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>Passo 1</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Creative Brief</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Defina a direção criativa antes de começar o desenvolvimento
              </p>
              {briefCompleteness > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 w-24 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${briefCompleteness}%`, background: briefCompleteness === 100 ? "#00E676" : "#FBBF24" }} />
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: briefCompleteness === 100 ? "#00E676" : "#FBBF24" }}>
                    {briefCompleteness}% preenchido
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 shrink-0">
              <button
                onClick={() => setHistoryOpen(p => !p)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={{ border: "1px solid var(--border)", background: historyOpen ? "var(--surface-2)" : "var(--surface-1)", color: "var(--text-secondary)" }}
                title="Ver histórico de versões"
              >
                <Clock size={13} />
                <span className="text-xs">Histórico</span>
                {versions.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>
                    {versions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setPanelOpen(p => !p); if (!panelOpen) loadBriefs(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ border: "1px solid var(--border)", background: panelOpen ? "var(--surface-2)" : "var(--surface-1)", color: "var(--text-secondary)" }}
              >
                <FolderOpen size={13} />
                Briefs salvos
                {savedBriefs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                    {savedBriefs.length}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Restored toast */}
          <AnimatePresence>
            {restoredToast && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-center gap-2 p-3 rounded-xl border"
                style={{ borderColor: "rgba(0,230,118,0.25)", background: "rgba(0,230,118,0.07)" }}
              >
                <Check size={13} style={{ color: "var(--accent)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>Versão restaurada com sucesso</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scout references banner */}
          {(scoutRefs.length > 0 || scoutRefsImported) && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
              {scoutRefsImported ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "rgba(0,230,118,0.2)", background: "rgba(0,230,118,0.04)" }}>
                  <Check size={14} style={{ color: "var(--accent)" }} className="shrink-0" />
                  <p className="text-xs" style={{ color: "var(--accent)" }}>Referências do Scout importadas com sucesso na aba Visual</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}>
                  <Compass size={14} style={{ color: "#F59E0B" }} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                      Você tem {scoutRefs.length} referência{scoutRefs.length !== 1 ? "s" : ""} do Scout disponíve{scoutRefs.length !== 1 ? "is" : "l"}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-subtle)" }}>Clique em Importar para preencher os campos de referências visuais</p>
                  </div>
                  <button onClick={importScoutRefs} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: "#F59E0B", color: "#020408" }}>
                    Importar
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Saved briefs panel */}
          <AnimatePresence>
            {panelOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-accent)", background: "rgba(0,230,118,0.03)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--accent)", opacity: 0.7 }}>Briefs salvos</p>
                  {loadingBriefs ? (
                    <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-10 rounded-lg animate-skeleton" style={{ background: "var(--surface-1)" }} />)}</div>
                  ) : savedBriefs.length === 0 ? (
                    <div className="py-4 text-center">
                      <FileText size={20} style={{ color: "var(--text-subtle)" }} className="mx-auto mb-2" />
                      <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Nenhum brief salvo ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedBriefs.map(brief => (
                        <div key={brief.name} className="flex items-center gap-3 p-3 rounded-lg border group" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                          <FileText size={13} style={{ color: "var(--accent)", opacity: 0.7, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>{brief.name}</p>
                            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-subtle)" }}>
                              {brief.content.split("\n").find(l => l.includes("**Nicho:**"))?.split(":**")?.[1]?.trim() || "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => loadBrief(brief)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
                              <Clock size={10} /> Carregar
                            </button>
                            <button onClick={() => deleteBrief(brief.name)} className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ color: "rgba(239,68,68,0.6)" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8 flex-wrap">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => setStep(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={i === step ? {
                    background: "rgba(0,230,118,0.1)", color: "var(--accent)",
                    border: "1px solid rgba(0,230,118,0.3)", boxShadow: "0 0 8px rgba(0,230,118,0.15)",
                  } : i < step ? {
                    color: "var(--text-muted)", border: "1px solid transparent",
                  } : { color: "var(--text-subtle)", border: "1px solid transparent" }}
                >
                  {i < step && <Check size={10} style={{ color: "var(--accent)" }} />}
                  {s}
                  <TabDot tabIndex={i} form={form} />
                </button>
                {i < STEPS.length - 1 && <ChevronRight size={12} style={{ color: "var(--text-subtle)" }} />}
              </div>
            ))}
          </div>

          {/* ── Conteúdo das abas ── */}
          <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>

            {/* ─ Aba 0: Cliente ─ */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Informações do Cliente</h2>

                {field("Nome / Projeto", "clientName", "ex: João Silva Arquitetura")}
                {field("Nicho / Mercado", "niche", "ex: Arquitetura de interiores, Personal trainer, SaaS B2B")}

                {/* Tipo de site */}
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    Tipo de site <span className="ml-1 opacity-50 text-[10px]">define estrutura e agentes prioritários</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SITE_TYPES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => set("siteType", s.value)}
                        className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={form.siteType === s.value ? {
                          border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.08)", color: "var(--accent)",
                        } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        <span className="text-xs font-semibold">{s.label}</span>
                        <span className="text-[10px] opacity-60">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {field("Público-alvo", "target", "ex: Casais de 30-50 anos, classe A/B, São Paulo")}
                {textarea("Diferencial único", "differentiator", "O que torna este cliente único? O que ele entrega que os concorrentes não entregam?")}
                {field("Tom de voz", "tone", "ex: Sério e sofisticado · criativo e jovem · técnico e direto")}
                {field("Objetivo principal do site", "objective", "ex: Captar leads qualificados via WhatsApp · vender curso online")}
                {field("CTA principal", "cta", "ex: Agende sua consulta gratuita")}

                {/* Concorrentes */}
                {field("Concorrentes / referências de mercado", "competitors", "ex: awwwards.com/awards, behance.net/... (separe por vírgula)", "para benchmark de qualidade")}

                {/* Identidade e conteúdo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Tem identidade visual?</label>
                    <div className="flex gap-2">
                      {["Sim, completa", "Sim, parcial", "Não tem"].map(opt => (
                        <button key={opt} onClick={() => set("existingBrand", opt)}
                          className="flex-1 py-2 rounded-lg text-xs transition-all"
                          style={form.existingBrand === opt ? {
                            border: "1px solid rgba(0,230,118,0.4)", background: "rgba(0,230,118,0.08)", color: "var(--accent)",
                          } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Conteúdo disponível</label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { v: "tem-tudo",   l: "Tem tudo pronto" },
                        { v: "tem-parcial",l: "Tem parte" },
                        { v: "nao-tem",    l: "Não tem nada" },
                      ].map(({ v, l }) => (
                        <button key={v} onClick={() => set("contentStatus", v as typeof form.contentStatus)}
                          className="py-1.5 rounded-lg text-xs transition-all text-left px-3"
                          style={form.contentStatus === v ? {
                            border: "1px solid rgba(0,230,118,0.4)", background: "rgba(0,230,118,0.08)", color: "var(--accent)",
                          } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                        >{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─ Aba 1: Visual ─ */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Direção Visual</h2>

                {/* Estética */}
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Estética (selecione todas que se aplicam)</label>
                  <div className="flex flex-wrap gap-2">
                    {AESTHETICS.map(a => (
                      <button key={a} onClick={() => toggle("aesthetic", a)}
                        className="px-3 py-1.5 rounded-full text-xs transition-all"
                        style={form.aesthetic.includes(a) ? {
                          border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.1)", color: "var(--accent)",
                        } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >{a}</button>
                    ))}
                  </div>
                </div>

                {/* Mood words */}
                {field("3 palavras que definem o visual ideal", "moodWords", "ex: elegante · sombrio · intrigante", "resume o feeling em 3 palavras — lido pelos agentes antes de qualquer ação")}

                {/* Referências */}
                <div className="space-y-2">
                  <label className="block text-xs" style={{ color: "var(--text-muted)" }}>
                    Referências visuais (URLs) <span className="opacity-50 text-[10px]">até 5</span>
                  </label>
                  {(["ref1","ref2","ref3","ref4","ref5"] as const).map((k, i) => (
                    <input key={k} value={form[k]} onChange={e => set(k, e.target.value)}
                      placeholder={`Referência ${i + 1}${i >= 3 ? " (opcional)" : ""} — URL`}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                      onFocus={e => (e.target as HTMLElement).style.borderColor = "var(--border-accent)"}
                      onBlur={e => (e.target as HTMLElement).style.borderColor = "var(--border)"}
                    />
                  ))}
                </div>

                {/* Cores */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Background", key: "bg" as const },
                    { label: "Texto", key: "text" as const },
                    { label: "Accent", key: "accent" as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
                      <div className="flex items-center gap-2 rounded-lg px-2 py-2" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                        <input type="color" value={form[key]} onChange={e => set(key, e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{form[key]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fontes */}
                <div className="grid grid-cols-2 gap-3">
                  {field("Fonte heading", "headingFont", "ex: PP Mori, NOHEMI, Instrument Serif")}
                  {field("Fonte body", "bodyFont", "ex: Geist, Inter, DM Sans")}
                </div>
              </div>
            )}

            {/* ─ Aba 2: Motion ─ */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Motion Language</h2>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Velocidade geral das animações</label>
                  <div className="flex gap-2">
                    {MOTION_SPEEDS.map(s => (
                      <button key={s} onClick={() => set("motionSpeed", s)}
                        className="flex-1 px-3 py-2.5 rounded-lg text-xs transition-all"
                        style={form.motionSpeed === s ? {
                          border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.1)", color: "var(--accent)",
                        } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    Efeitos obrigatórios — passe o mouse para ver o que cada um faz
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EFFECTS_WITH_DESC.map(({ name, desc }) => (
                      <div key={name} className="relative">
                        <button
                          onClick={() => toggle("effects", name)}
                          onMouseEnter={() => setHoveredEffect(name)}
                          onMouseLeave={() => setHoveredEffect(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                          style={form.effects.includes(name) ? {
                            border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.1)", color: "var(--accent)",
                          } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                        >
                          {name}
                          <Info size={9} style={{ opacity: 0.4 }} />
                        </button>
                        <AnimatePresence>
                          {hoveredEffect === name && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                              className="absolute bottom-full left-0 mb-2 z-50 w-52 p-2.5 rounded-lg text-[11px] leading-relaxed pointer-events-none"
                              style={{ background: "rgba(10,14,20,0.97)", border: "1px solid rgba(0,230,118,0.2)", color: "var(--text-secondary)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
                            >{desc}</motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─ Aba 3: Narrativa ─ */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Narrativa (StoryBrand)</h2>
                {textarea("Protagonista — quem é o cliente ideal?", "protagonist",
                  "Ex: Empreendedoras de 28-40 anos que querem uma presença online que reflita o valor real do trabalho",
                  "seu cliente, não você")}
                {textarea("Problema — qual dor o site resolve?", "problem",
                  "Ex: Sites genéricos que não transmitem sofisticação e perdem clientes antes mesmo do contato")}
                {field("Headline principal", "headline", "Ex: Design que domina, conversão que prova")}
                {textarea("Tagline / subtítulo", "tagline",
                  "Ex: Criamos landing pages que convencem antes mesmo do primeiro scroll")}
                {field("Métrica de sucesso", "successMetric",
                  "ex: 20 leads/mês pelo WhatsApp · 10 vendas do curso · 500 visitas/dia",
                  "como medir se o site funcionou")}
              </div>
            )}

            {/* ─ Aba 4: Entrega ─ */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-muted)" }}>Entrega & Configurações</h2>

                <div className="grid grid-cols-2 gap-4">
                  {field("Prazo de entrega", "deadline", "ex: 15/02/2025 · 3 semanas · urgente")}

                  {/* Budget */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Budget</label>
                    <select
                      value={form.budget}
                      onChange={e => set("budget", e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: form.budget ? "var(--text-primary)" : "var(--text-subtle)" }}
                    >
                      <option value="">Selecione...</option>
                      {BUDGET_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {/* Páginas */}
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Estrutura de páginas</label>
                  <div className="flex gap-3">
                    {[
                      { v: "onepage",   l: "One-page",   d: "Tudo em scroll contínuo" },
                      { v: "multipage", l: "Multi-page",  d: "Múltiplas rotas/páginas" },
                    ].map(({ v, l, d }) => (
                      <button key={v} onClick={() => set("pages", v as typeof form.pages)}
                        className="flex-1 flex flex-col gap-0.5 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={form.pages === v ? {
                          border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.08)", color: "var(--accent)",
                        } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        <span className="text-xs font-semibold">{l}</span>
                        <span className="text-[10px] opacity-60">{d}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hospedagem */}
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Hospedagem</label>
                  <div className="grid grid-cols-3 gap-2">
                    {HOSTING_OPTIONS.map(h => (
                      <button key={h.value} onClick={() => set("hosting", h.value)}
                        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg text-left transition-all"
                        style={form.hosting === h.value ? {
                          border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.08)", color: "var(--accent)",
                        } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        <span className="text-xs font-semibold">{h.label}</span>
                        <span className="text-[10px] opacity-60">{h.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Integrações */}
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                    Integrações necessárias <span className="opacity-50 text-[10px]">selecione todas</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTEGRATIONS_LIST.map(integ => (
                      <button key={integ} onClick={() => toggle("integrations", integ)}
                        className="px-3 py-1.5 rounded-full text-xs transition-all"
                        style={form.integrations.includes(integ) ? {
                          border: "1px solid rgba(0,230,118,0.5)", background: "rgba(0,230,118,0.1)", color: "var(--accent)",
                        } : { border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >{integ}</button>
                    ))}
                  </div>
                </div>

                {textarea("Observações / informações extras", "observations",
                  "Ex: O cliente tem logo em SVG · prefere inglês nas seções · não quer depoimentos na home...")}
              </div>
            )}

            {/* ─ Aba 5: Revisão ─ */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Revisão do Brief</h2>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${briefCompleteness}%`, background: briefCompleteness === 100 ? "#00E676" : "#FBBF24" }} />
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: briefCompleteness === 100 ? "#00E676" : "#FBBF24" }}>
                    {briefCompleteness}% completo
                  </span>
                </div>
                <div className="space-y-2.5 p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                  {reviewRows.map(({ k, v, empty }) => (
                    <div key={k} className="flex gap-3 text-sm">
                      <span className="w-20 shrink-0 text-xs font-mono uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>{k}</span>
                      {v ? (
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{v}</span>
                      ) : (
                        <span className="text-xs italic" style={{ color: "rgba(251,191,36,0.5)" }}>{empty || "Não preenchido"}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg border text-xs" style={{ borderColor: "rgba(0,230,118,0.2)", background: "rgba(0,230,118,0.04)", color: "rgba(0,230,118,0.7)" }}>
                  O brief será salvo em{" "}
                  <code className="font-mono">briefs/{(form.clientName || "novo-projeto").toLowerCase().replace(/\s+/g, "-")}.md</code>{" "}
                  e ficará disponível para todos os agentes do squad.
                </div>
              </div>
            )}

          </motion.div>

          {/* Navegação */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-0"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm transition-all"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-hover)", color: "var(--text-secondary)" }}
              >
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportMarkdown}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                >
                  <Download size={14} /> Exportar Markdown
                </button>
                <button
                  onClick={saveBrief}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: "var(--accent)", color: "#020408", boxShadow: "0 0 20px rgba(0,230,118,0.4)" }}
                >
                  {saved ? <><Check size={14} /> Salvo!</> : saving ? "Salvando..." : <><Save size={14} /> Salvar Brief</>}
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── Drawer Histórico ── */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setHistoryOpen(false)} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 h-full z-50 flex flex-col"
              style={{ width: 340, background: "rgba(2,4,8,0.97)", borderLeft: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: "#FBBF24" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Histórico de Versões</span>
                </div>
                <button onClick={() => setHistoryOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ color: "var(--text-subtle)", border: "1px solid var(--border)" }}>
                  <X size={12} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {versions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <Clock size={28} style={{ color: "var(--text-subtle)", opacity: 0.4 }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Nenhuma versão salva</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                      O histórico é criado automaticamente ao salvar. Até {MAX_VERSIONS} versões mantidas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] mb-3" style={{ color: "var(--text-subtle)" }}>{versions.length} versão{versions.length !== 1 ? "ões" : ""} · máx. {MAX_VERSIONS}</p>
                    {versions.map((ver, i) => (
                      <motion.div key={ver.timestamp} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl border group" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>{ver.snapshot.clientName || "Sem nome"}</p>
                          <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-subtle)" }}>{formatTs(ver.timestamp)}</p>
                          {ver.snapshot.niche && <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-subtle)", opacity: 0.7 }}>{ver.snapshot.niche}</p>}
                        </div>
                        <button onClick={() => restoreVersion(ver)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FBBF24" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.15)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(251,191,36,0.08)"}
                        >Restaurar</button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
