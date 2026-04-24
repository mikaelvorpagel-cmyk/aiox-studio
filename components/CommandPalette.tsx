"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, FileText, FolderOpen,
  Compass, Users, Layers, CheckSquare, Rocket,
  Settings, X, ChevronRight,
} from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */
interface PaletteItem {
  id: string;
  group: "Navegação" | "Agentes" | "Briefs";
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  action: () => void;
}

interface AgentRaw { id: string; name: string; icon?: string; title?: string }
interface BriefRaw  { name: string; content: string }

/* ── Nav items (static) ─────────────────────────────────── */
const NAV_ITEMS: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "Dashboard",    href: "/",         icon: <LayoutDashboard size={14} /> },
  { label: "Criar Brief",  href: "/brief",    icon: <FileText size={14} /> },
  { label: "Projetos",     href: "/briefs",   icon: <FolderOpen size={14} /> },
  { label: "Scout",        href: "/scout",    icon: <Compass size={14} /> },
  { label: "Agentes",      href: "/agents",   icon: <Users size={14} /> },
  { label: "Studio",       href: "/studio",   icon: <Layers size={14} /> },
  { label: "Checklist",    href: "/checklist",icon: <CheckSquare size={14} /> },
  { label: "Deploy",       href: "/deploy",   icon: <Rocket size={14} /> },
  { label: "Configurações",href: "/settings", icon: <Settings size={14} /> },
];

/* ── CommandPalette component ───────────────────────────── */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems]   = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  /* Open/close */
  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActive(0);
  }, []);
  const closePalette = useCallback(() => setOpen(false), []);

  /* Keyboard shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
        if (!open) {
          setQuery("");
          setActive(0);
        }
      }
      if (e.key === "Escape") closePalette();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closePalette]);

  /* Focus input when opened */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  /* Load dynamic data */
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const nav: PaletteItem[] = NAV_ITEMS.map(n => ({
      id: `nav-${n.href}`,
      group: "Navegação" as const,
      label: n.label,
      icon: n.icon,
      action: () => { router.push(n.href); closePalette(); },
    }));

    Promise.all([
      fetch("/api/agents").then(r => r.json()).catch(() => ({ agents: [] })),
      fetch("/api/brief").then(r => r.json()).catch(() => ({ briefs: [] })),
    ]).then(([agentsData, briefData]) => {
      const agents: AgentRaw[] = agentsData.agents ?? [];
      const briefs: BriefRaw[] = briefData.briefs ?? [];

      const agentItems: PaletteItem[] = agents.map(a => ({
        id: `agent-${a.id}`,
        group: "Agentes" as const,
        label: a.name,
        sublabel: a.title,
        icon: <span className="text-base leading-none">{a.icon ?? "🤖"}</span>,
        action: () => { router.push(`/agents/${a.id}`); closePalette(); },
      }));

      const briefItems: PaletteItem[] = briefs.map(b => {
        const match = b.content.match(/\*\*Nicho:\*\*\s*(.+)/);
        return {
          id: `brief-${b.name}`,
          group: "Briefs" as const,
          label: b.name,
          sublabel: match?.[1]?.trim(),
          icon: <FileText size={14} />,
          action: () => {
            try {
              localStorage.setItem("activeBrief", JSON.stringify({ name: b.name, id: b.name }));
            } catch { /* ignore */ }
            router.push("/brief");
            closePalette();
          },
        };
      });

      setItems([...nav, ...agentItems, ...briefItems]);
      setLoading(false);
    });
  }, [open, router, closePalette]);

  /* Filter by query */
  const filtered = query.trim()
    ? items.filter(
        it =>
          it.label.toLowerCase().includes(query.toLowerCase()) ||
          it.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  /* Groups */
  const groups = (["Navegação", "Agentes", "Briefs"] as const).map(g => ({
    name: g,
    items: filtered.filter(i => i.group === g),
  })).filter(g => g.items.length > 0);

  /* Flat list for keyboard nav */
  const flat = groups.flatMap(g => g.items);

  /* Keyboard nav */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(p => Math.min(p + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(p => Math.max(p - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flat[active]?.action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, active]);

  /* Scroll active item into view */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${active}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  /* Reset active on query change */
  useEffect(() => { setActive(0); }, [query]);

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9990]"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={closePalette}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="fixed left-1/2 top-[20%] z-[9991] w-full max-w-lg -translate-x-1/2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(2,4,8,0.97)",
              border: "1px solid rgba(0,230,118,0.18)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,230,118,0.1)",
            }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 border-b"
              style={{ borderColor: "rgba(0,230,118,0.1)" }}
            >
              <Search size={15} style={{ color: "var(--text-subtle)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar páginas, agentes, projetos..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ color: "var(--text-subtle)" }}>
                  <X size={13} />
                </button>
              )}
              <kbd
                className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--text-subtle)",
                }}
              >
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="overflow-y-auto"
              style={{ maxHeight: "340px" }}
            >
              {loading ? (
                <div className="py-8 text-center text-sm" style={{ color: "var(--text-subtle)" }}>
                  Carregando...
                </div>
              ) : groups.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: "var(--text-subtle)" }}>
                  Nenhum resultado para &quot;{query}&quot;
                </div>
              ) : (
                <div className="py-1.5">
                  {groups.map(group => (
                    <div key={group.name}>
                      <p
                        className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--text-subtle)" }}
                      >
                        {group.name}
                      </p>
                      {group.items.map(item => {
                        const idx = globalIdx++;
                        const isActive = idx === active;
                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            onClick={item.action}
                            onMouseEnter={() => setActive(idx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                            style={{
                              background: isActive ? "rgba(0,230,118,0.08)" : "transparent",
                              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                            }}
                          >
                            <span
                              className="shrink-0 w-5 flex items-center justify-center"
                              style={{ color: isActive ? "var(--accent)" : "var(--text-subtle)" }}
                            >
                              {item.icon}
                            </span>
                            <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                            {item.sublabel && (
                              <span
                                className="text-[11px] truncate max-w-[140px]"
                                style={{ color: "var(--text-subtle)" }}
                              >
                                {item.sublabel}
                              </span>
                            )}
                            {isActive && (
                              <ChevronRight size={12} style={{ color: "var(--accent)", opacity: 0.6, flexShrink: 0 }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div
              className="px-4 py-2.5 border-t flex items-center gap-4"
              style={{ borderColor: "rgba(0,230,118,0.08)" }}
            >
              {[
                { keys: ["↑", "↓"], label: "navegar" },
                { keys: ["↵"], label: "selecionar" },
                { keys: ["Esc"], label: "fechar" },
              ].map(({ keys, label }) => (
                <div key={label} className="flex items-center gap-1">
                  {keys.map(k => (
                    <kbd
                      key={k}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "var(--text-subtle)",
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                  <span className="text-[10px]" style={{ color: "var(--text-subtle)" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
