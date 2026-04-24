"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { CheckSquare, Square, AlertTriangle, Star, RotateCcw, Terminal } from "lucide-react";
import { addActivity } from "@/lib/activityFeed";

const CRITICAL = [
  "Paleta de cor consistente em todas as seções",
  "Tipografia: máximo 2 famílias, hierarquia clara",
  "Contraste mínimo 4.5:1 em texto sobre fundo (WCAG AA)",
  "Nenhuma imagem distorcida ou com proporção errada",
  "Whitespace generoso — sem seção apertada",
  "Responsivo: testado em 375px, 768px, 1280px, 1440px",
  "Custom cursor funcionando (dot + ring + glow)",
  "Sem erros de console no navegador",
  "Sem layout shift visível no carregamento (CLS < 0.1)",
  "Fontes carregam sem FOUT (next/font ou equivalente)",
  "Imagens com alt text e carregamento otimizado",
  "prefers-reduced-motion implementado",
  "CTAs visíveis above the fold",
  "Links funcionando (sem 404)",
  "Meta title e description presentes",
];

const IMPORTANT = [
  "Scroll reveal animado por seção",
  "Transições de hover em botões e cards",
  "Magnetic effect no CTA principal",
  "Animação de entrada no hero",
  "Background animation no hero",
  "Noise texture overlay presente",
  "Animações com easing premium (não linear)",
  "Stagger em listas e grids",
  "Letter-spacing negativo em headings grandes",
  "Line-height comprimido em headings (0.95–1.1)",
  "Elemento tipográfico expressivo (glitch, shimmer, stroke)",
  "Badge/label com uppercase e letter-spacing",
  "Bordas ultra-sutis nos cards/seções",
  "Stats/números com counter animado",
  "Three.js/Spline com lazy loading",
  "Imagens em WebP ou AVIF",
  "LCP < 3s em 4G simulado",
];

const DIFFERENTIALS = [
  "Cursor com label flutuante em hover de projetos",
  "Page transition entre seções",
  "Elemento 3D (Three.js, Spline, WebGL)",
  "Horizontal scroll em seção de projetos",
  "Hover que revela informação oculta",
  "Animação de texto com nome/marca",
  "Scroll progress indicator no topo",
  "Easter egg ou detalhe surpresa",
];

const RED_FLAGS = [
  "Gradientes rainbow ou multi-cor sem motivo",
  "Mais de 3 fontes diferentes",
  "Animações acima de 1s sem propósito",
  "Bounce easing em elementos de conteúdo",
  "cursor: pointer em elementos não-clicáveis",
  "Texto em mais de 75 caracteres por linha",
  "Imagens stock genéricas (pessoas em escritório)",
  "Padding inconsistente entre seções",
  "CTA escondido ou pouco contrastante",
  "Footer sobrecarregado de links",
];

/* Agent command suggestions per checklist item */
const AGENT_HINTS: Record<string, string> = {
  "Scroll reveal animado por seção":          "@motion *add-scroll-animation",
  "Transições de hover em botões e cards":    "@dev *add-hover-effect",
  "Magnetic effect no CTA principal":         "@motion *add-magnetic-button",  /* sic */
  "Animação de entrada no hero":              "@motion *add-entrance-animation",
  "Background animation no hero":             "@motion *add-shader-bg",
  "Noise texture overlay presente":           "@motion *add-noise-texture",
  "Animações com easing premium (não linear)":"@dev *add-scroll-animation",
  "Stagger em listas e grids":                "@motion *add-scroll-animation",
  "Elemento tipográfico expressivo (glitch, shimmer, stroke)": "@dev *build-hero",
  "Stats/números com counter animado":        "@motion *add-scroll-animation",
  "Three.js/Spline com lazy loading":         "@motion *add-3d-element",
  "Cursor com label flutuante em hover de projetos": "@motion *add-hover-effect",
  "Page transition entre seções":             "@motion *add-page-transition",
  "Elemento 3D (Three.js, Spline, WebGL)":    "@motion *add-3d-element",
  "Horizontal scroll em seção de projetos":   "@dev *add-scroll-animation",
  "Custom cursor funcionando (dot + ring + glow)": "@dev *build-layout",
  "Responsivo: testado em 375px, 768px, 1280px, 1440px": "@dev *review-component",
  "Imagens em WebP ou AVIF":                  "@assets *optimize-images",
  "LCP < 3s em 4G simulado":                  "@dev *audit-performance",
  "Meta title e description presentes":       "@seo *optimize-meta",
};

function CheckGroup({
  title, items, checked, onToggle, icon, color, flagMode = false,
}: {
  title: string; items: string[]; checked: Record<string, boolean>;
  onToggle: (k: string) => void; icon: React.ReactNode; color: string;
  flagMode?: boolean;
}) {
  const count = items.filter(i => !!checked[i] !== flagMode).length;
  const total = items.length;

  return (
    <div className="rounded-xl border border-white/6 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5" style={{ background: `${color}08` }}>
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-sm font-semibold text-white/80">{title}</span>
        </div>
        <span className="text-xs font-mono" style={{ color }}>
          {flagMode ? `${total - count}/${total} ok` : `${count}/${total}`}
        </span>
      </div>
      <div className="divide-y divide-white/4">
        {items.map(item => {
          const isChecked = !!checked[item];
          const ok = flagMode ? !isChecked : isChecked;
          const hint = AGENT_HINTS[item];
          const showHint = hint && !isChecked;
          return (
            <div key={item}>
              <button
                onClick={() => onToggle(item)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/2 transition-colors"
              >
                <span className={`mt-0.5 shrink-0 transition-colors ${ok ? "" : "text-white/20"}`} style={ok ? { color } : {}}>
                  {ok ? <CheckSquare size={14} /> : <Square size={14} />}
                </span>
                <span className={`text-xs leading-relaxed transition-colors flex-1 ${ok ? "text-white/65" : "text-white/30"}`}>
                  {item}
                </span>
              </button>
              {/* Agent hint — exibido permanentemente quando item não está marcado */}
              {showHint && (
                <div className="flex items-center gap-1.5 pb-2 ml-6 px-4">
                  <Terminal size={9} style={{ color: "rgba(0,230,118,0.5)", flexShrink: 0 }} />
                  <code
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: "rgba(0,230,118,0.5)",
                      lineHeight: 1.4,
                    }}
                  >
                    → {hint}
                  </code>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STORAGE_KEY = "aiox-checklist-v1";

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const toggle = (k: string) =>
    setChecked(prev => {
      const next = { ...prev, [k]: !prev[k] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
      // Registra no feed de atividade ao marcar (não ao desmarcar)
      if (!prev[k]) {
        addActivity({ type: "checklist_item", message: `Item marcado: ${k}` });
      }
      return next;
    });

  const resetAll = () => {
    setChecked({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* quota */ }
  };

  const critDone  = CRITICAL.filter(i => !!checked[i]).length;
  const impDone   = IMPORTANT.filter(i => !!checked[i]).length;
  const diffDone  = DIFFERENTIALS.filter(i => !!checked[i]).length;
  const flagCount = RED_FLAGS.filter(i => !!checked[i]).length;

  const critPct = Math.round((critDone / CRITICAL.length) * 100);
  const impPct  = Math.round((impDone / IMPORTANT.length) * 100);

  const status = flagCount > 0 ? "REPROVADO" : critPct < 100 ? "PENDENTE" : impPct >= 80 ? "APROVADO" : "APROVADO C/ RESSALVAS";
  const statusColor = flagCount > 0 ? "#F87171" : critPct < 100 ? "#FBBF24" : impPct >= 80 ? "#7DC52B" : "#60A5FA";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-8 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)" }}
      >
        <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare size={13} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Passo 4
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Premium Gate
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Checklist de qualidade antes do deploy — passe o mouse nos itens para ver o agente responsável
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button
              onClick={resetAll}
              title="Reiniciar checklist"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ color: "var(--text-subtle)", border: "1px solid var(--border)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-subtle)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              <RotateCcw size={11} /> Reset
            </button>
            <motion.div
              key={status}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-4 py-2 rounded-full text-xs font-bold border"
              style={{
                color: statusColor,
                borderColor: `${statusColor}40`,
                background: `${statusColor}10`,
                boxShadow: `0 0 12px ${statusColor}20`,
              }}
            >
              {status}
            </motion.div>
          </div>
        </motion.div>

        {/* Score */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Críticos",     val: critPct, color: critPct === 100 ? "#7DC52B" : "#FBBF24", target: "100%" },
            { label: "Importantes",  val: impPct,  color: impPct >= 80 ? "#7DC52B" : "#FBBF24",   target: "≥ 80%" },
            { label: "Diferenciais", val: Math.round((diffDone / DIFFERENTIALS.length) * 100), color: "#A78BFA", target: "+" },
          ].map(({ label, val, color, target }) => (
            <div key={label} className="p-4 rounded-xl border border-white/6 bg-white/[0.02]">
              <p className="text-xs text-white/30 mb-2">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{val}%</p>
              <p className="text-[10px] text-white/20 mt-1">meta: {target}</p>
              <div className="h-1 bg-white/6 rounded-full mt-2 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: color }}
                  initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <CheckGroup title="Críticos — 100% obrigatório" items={CRITICAL}
            checked={checked} onToggle={toggle}
            icon={<CheckSquare size={14} />} color="#7DC52B" />
          <CheckGroup title="Importantes — meta 80%" items={IMPORTANT}
            checked={checked} onToggle={toggle}
            icon={<Star size={14} />} color="#A78BFA" />
          <CheckGroup title="Diferenciais — quanto mais, melhor" items={DIFFERENTIALS}
            checked={checked} onToggle={toggle}
            icon={<Star size={14} />} color="#60A5FA" />
          <CheckGroup title="Red Flags — nenhum tolerado" items={RED_FLAGS}
            checked={checked} onToggle={toggle}
            icon={<AlertTriangle size={14} />} color="#F87171" flagMode />
        </div>
        </div>
      </main>
    </div>
  );
}
