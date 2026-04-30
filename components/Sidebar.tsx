"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, FileText, CheckSquare,
  Compass, Settings, ChevronRight, Terminal,
  Rocket, FolderOpen, Layers, Map, Activity, Menu, X,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const PRIMARY: NavItem = {
  href: "/", icon: LayoutDashboard, label: "Dashboard",
};

const PROJETO: NavItem[] = [
  { href: "/brief",    icon: FileText,    label: "Brief"      },
  { href: "/briefs",   icon: FolderOpen,  label: "Projetos"   },
  { href: "/scout",    icon: Compass,     label: "Scout"      },
  { href: "/activity", icon: Activity,    label: "Atividade"  },
];

const AGENTES: NavItem[] = [
  { href: "/agents",   icon: Users,       label: "Agentes"  },
  { href: "/studio",   icon: Layers,      label: "Studio"   },
];

const QUALIDADE: NavItem[] = [
  { href: "/checklist", icon: CheckSquare, label: "Checklist" },
  { href: "/deploy",    icon: Rocket,      label: "Exportar"  },
];

interface ActiveBrief { name: string; niche?: string }

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 relative"
      style={active ? {
        background: "rgba(0, 230, 118, 0.08)",
        color: "var(--accent)",
        boxShadow: "inset 0 0 16px rgba(0, 230, 118, 0.06), 0 0 0 1px rgba(0, 230, 118, 0.15)",
      } : {
        color: "var(--text-muted)",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
        />
      )}
      <Icon size={14} className="shrink-0" style={active ? { filter: "drop-shadow(0 0 4px var(--accent))" } : {}} />
      <span className="text-sm font-medium leading-none tracking-wide">{item.label}</span>
      {active && (
        <ChevronRight size={10} className="ml-auto opacity-40" />
      )}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.15em]"
      style={{ color: "var(--text-subtle)" }}
    >
      {label}
    </p>
  );
}

function SidebarContent({ isActive, onNavClick }: { isActive: (href: string) => boolean; onNavClick?: () => void }) {
  const [activeBrief, setActiveBrief] = useState<ActiveBrief | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("activeBrief");
      if (stored) {
        setActiveBrief(JSON.parse(stored) as ActiveBrief);
        return;
      }
    } catch { /* ignore */ }

    fetch("/api/brief")
      .then(r => r.json())
      .then(data => {
        const briefs: { name: string; content: string }[] = data.briefs ?? [];
        if (briefs.length === 0) return;
        const latest = briefs[briefs.length - 1];
        const nicheMatch = latest.content.match(/\*\*Nicho:\*\*\s*(.+)/);
        setActiveBrief({ name: latest.name, niche: nicheMatch?.[1]?.trim() });
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #00E676, #00C853)", boxShadow: "0 0 14px rgba(0, 230, 118, 0.5)" }}
        >
          <Terminal size={13} style={{ color: "#020408", strokeWidth: 2.5 }} />
        </div>
        <div>
          <p className="text-sm font-bold leading-none tracking-wide" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>
            AIOX Studio
          </p>
          <p className="text-[9px] mt-0.5 font-mono uppercase tracking-widest" style={{ color: "var(--accent)", opacity: 0.6 }}>
            Web Design Squad
          </p>
        </div>
      </div>

      {/* Active project indicator */}
      <div className="mx-2 mt-2">
        {activeBrief ? (
          <Link
            href="/brief"
            onClick={onNavClick}
            className="block px-3 py-2 rounded-lg border transition-all"
            style={{ borderColor: "rgba(0,230,118,0.18)", background: "rgba(0,230,118,0.04)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,230,118,0.07)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,230,118,0.04)"}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)", boxShadow: "0 0 5px var(--accent)" }} />
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--accent)", opacity: 0.7 }}>Brief ativo</span>
            </div>
            <p className="text-xs font-semibold truncate" style={{ color: "var(--accent)" }}>{activeBrief.name}</p>
            {activeBrief.niche && (
              <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--accent)", opacity: 0.6 }}>{activeBrief.niche}</p>
            )}
          </Link>
        ) : (
          <Link
            href="/brief"
            onClick={onNavClick}
            className="block px-3 py-2 rounded-lg border transition-all"
            style={{ borderColor: "var(--border)", background: "transparent" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--text-subtle)" }} />
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>Brief ativo</span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-subtle)" }}>Nenhum brief ativo</p>
          </Link>
        )}
      </div>

      {/* Current flow step indicator */}
      {activeBrief && (
        <div className="mx-2 mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,230,118,0.025)" }}>
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-subtle)" }}>Etapa atual</p>
          <div className="flex flex-wrap gap-0.5">
            {[
              { href: "/brief",     label: "Brief"   },
              { href: "/scout",     label: "Scout"   },
              { href: "/agents",    label: "Agentes" },
              { href: "/checklist", label: "QA"      },
              { href: "/deploy",    label: "Exportar" },
            ].map(step => {
              const active = isActive(step.href);
              return (
                <span
                  key={step.href}
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={active ? {
                    background: "rgba(0,230,118,0.15)",
                    color: "var(--accent)",
                    border: "1px solid rgba(0,230,118,0.3)",
                  } : {
                    color: "var(--text-subtle)",
                    border: "1px solid transparent",
                  }}
                >
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <NavLink item={PRIMARY} active={isActive(PRIMARY.href)} onClick={onNavClick} />
        <SectionLabel label="Projeto" />
        {PROJETO.map(item => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavClick} />)}
        <SectionLabel label="Agentes" />
        {AGENTES.map(item => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavClick} />)}
        <SectionLabel label="Qualidade" />
        {QUALIDADE.map(item => <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onNavClick} />)}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/settings"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
          style={isActive("/settings") ? {
            background: "rgba(0, 230, 118, 0.08)",
            color: "var(--accent)",
            boxShadow: "inset 0 0 16px rgba(0, 230, 118, 0.06)",
          } : { color: "var(--text-muted)" }}
          onMouseEnter={e => {
            if (!isActive("/settings")) {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
            }
          }}
          onMouseLeave={e => {
            if (!isActive("/settings")) {
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }
          }}
        >
          <Settings size={14} className="shrink-0" />
          <span className="font-medium">Configurações</span>
        </Link>

        {/* System status + ⌘K hint */}
        <div className="flex items-center justify-between px-3 pt-3 mt-1 border-t" style={{ borderColor: "rgba(0,230,118,0.06)" }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>sistema online</span>
          </div>
          <kbd
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-subtle)" }}
          >
            ⌘K
          </kbd>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{ background: "rgba(2,4,8,0.9)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <Menu size={16} />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
                onClick={() => setMobileOpen(false)}
              />

              {/* Drawer */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="fixed left-0 top-0 h-full z-50 flex flex-col overflow-hidden"
                style={{
                  width: "var(--sidebar-w)",
                  background: "rgba(2, 4, 8, 0.98)",
                  borderRight: "1px solid var(--border)",
                }}
              >
                {/* Close button */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: "var(--text-subtle)", background: "rgba(255,255,255,0.04)" }}
                >
                  <X size={13} />
                </button>
                <SidebarContent isActive={isActive} onNavClick={() => setMobileOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full z-50 flex flex-col"
      style={{
        width: "var(--sidebar-w)",
        background: "rgba(2, 4, 8, 0.96)",
        borderRight: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <SidebarContent isActive={isActive} />
    </aside>
  );
}
