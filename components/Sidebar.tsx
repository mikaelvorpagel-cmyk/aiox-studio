"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Users, FileText, CheckSquare,
  Compass, Settings, ChevronRight, Terminal,
  Rocket, FolderOpen, Layers, Map,
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
  { href: "/brief",    icon: FileText,    label: "Brief"    },
  { href: "/briefs",   icon: FolderOpen,  label: "Projetos" },
  { href: "/scout",    icon: Compass,     label: "Scout"    },
];

const AGENTES: NavItem[] = [
  { href: "/agents",   icon: Users,       label: "Agentes"  },
  { href: "/studio",   icon: Layers,      label: "Studio"   },
];

const QUALIDADE: NavItem[] = [
  { href: "/checklist", icon: CheckSquare, label: "Checklist" },
  { href: "/deploy",    icon: Rocket,      label: "Deploy"    },
  { href: "/roadmap",   icon: Map,         label: "Roadmap"   },
];

interface ActiveBrief { name: string; niche?: string }

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
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

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const [activeBrief, setActiveBrief] = useState<ActiveBrief | null>(null);

  useEffect(() => {
    fetch("/api/brief")
      .then(r => r.json())
      .then(data => {
        const briefs: { name: string; content: string }[] = data.briefs ?? [];
        if (briefs.length === 0) return;
        const latest = briefs[briefs.length - 1];
        const nicheMatch = latest.content.match(/\*\*Nicho:\*\*\s*(.+)/);
        setActiveBrief({
          name: latest.name,
          niche: nicheMatch?.[1]?.trim(),
        });
      })
      .catch(() => {});
  }, [pathname]);

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
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #00E676, #00C853)",
            boxShadow: "0 0 14px rgba(0, 230, 118, 0.5)",
          }}
        >
          <Terminal size={13} style={{ color: "#020408", strokeWidth: 2.5 }} />
        </div>
        <div>
          <p
            className="text-sm font-bold leading-none tracking-wide"
            style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
          >
            AIOX Studio
          </p>
          <p
            className="text-[9px] mt-0.5 font-mono uppercase tracking-widest"
            style={{ color: "var(--accent)", opacity: 0.6 }}
          >
            Web Design Squad
          </p>
        </div>
      </div>

      {/* Active project indicator */}
      {activeBrief && (
        <Link
          href="/brief"
          className="mx-2 mt-2 px-3 py-2 rounded-lg border transition-all"
          style={{
            borderColor: "rgba(0,230,118,0.18)",
            background: "rgba(0,230,118,0.04)",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,230,118,0.07)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,230,118,0.04)"}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--accent)", boxShadow: "0 0 5px var(--accent)" }}
            />
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--accent)", opacity: 0.7 }}>
              Brief ativo
            </span>
          </div>
          <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
            {activeBrief.name}
          </p>
          {activeBrief.niche && (
            <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-subtle)" }}>
              {activeBrief.niche}
            </p>
          )}
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <NavLink item={PRIMARY} active={isActive(PRIMARY.href)} />

        <SectionLabel label="Projeto" />
        {PROJETO.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <SectionLabel label="Agentes" />
        {AGENTES.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <SectionLabel label="Qualidade" />
        {QUALIDADE.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
          style={isActive("/settings") ? {
            background: "rgba(0, 230, 118, 0.08)",
            color: "var(--accent)",
            boxShadow: "inset 0 0 16px rgba(0, 230, 118, 0.06)",
          } : {
            color: "var(--text-muted)",
          }}
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

        {/* System status */}
        <div className="flex items-center gap-2 px-3 pt-3 mt-1 border-t" style={{ borderColor: "rgba(0,230,118,0.06)" }}>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--accent)", animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: "var(--text-subtle)" }}
          >
            sistema online
          </span>
        </div>
      </div>
    </aside>
  );
}
