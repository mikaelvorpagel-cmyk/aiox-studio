"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Download, ExternalLink, Package, CheckCircle2, XCircle,
  Code2, Layers, ArrowRight, Settings, AlertCircle,
  Clock, FileCode2, Globe,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface StoredSection {
  id: string;
  order: number;
  name: string;
  type: string;
}

interface StatusData {
  provider: string;
  configs: { key: string; label: string; status: string }[];
  stats: { agentCount: number; briefCount: number; kbCount: number };
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^|\s|-|_)(\w)/g, (_, c: string) => c.toUpperCase()).replace(/\s/g, "");
}

function buildProjectFiles(
  sections: StoredSection[],
  genResults: Record<string, string>
): Record<string, string> {
  const generated = sections.filter(s => genResults[s.id]);
  const imports = generated.map(s => {
    const name = toPascalCase(s.name);
    return `import ${name}Section from "@/components/${name}Section";`;
  }).join("\n");
  const jsxSections = generated.map(s => `      <${toPascalCase(s.name)}Section />`).join("\n");

  const files: Record<string, string> = {
    "package.json": JSON.stringify({
      name: "aiox-studio-project", version: "0.1.0", private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: {
        "next": "15.3.0", "react": "^19.0.0", "react-dom": "^19.0.0",
        "framer-motion": "^12.0.0", "lucide-react": "^1.0.0",
      },
      devDependencies: {
        "@tailwindcss/postcss": "^4", "@types/node": "^20",
        "@types/react": "^19", "@types/react-dom": "^19",
        "tailwindcss": "^4", "typescript": "^5",
      },
    }, null, 2),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2017", lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true, skipLibCheck: true, strict: true, noEmit: true,
        esModuleInterop: true, module: "esnext", moduleResolution: "bundler",
        resolveJsonModule: true, isolatedModules: true, jsx: "preserve",
        incremental: true, paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    }, null, 2),
    "next.config.ts": `import type { NextConfig } from "next";\nconst nextConfig: NextConfig = {};\nexport default nextConfig;\n`,
    "app/layout.tsx": `import type { Metadata } from "next";\nimport "./globals.css";\n\nexport const metadata: Metadata = { title: "Projeto AIOX Studio", description: "Gerado pelo AIOX Studio" };\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="pt-BR">\n      <body>{children}</body>\n    </html>\n  );\n}\n`,
    "app/page.tsx": `import type { Metadata } from "next";\n${imports}\n\nexport const metadata: Metadata = { title: "Projeto AIOX Studio" };\n\nexport default function Home() {\n  return (\n    <main className="min-h-screen bg-black">\n${jsxSections || "      {/* Nenhuma seção gerada ainda */}"}\n    </main>\n  );\n}\n`,
    "app/globals.css": `@import "tailwindcss";\n\n:root {\n  --background: #000000;\n  --foreground: #f0f0f5;\n}\n\nbody {\n  background: var(--background);\n  color: var(--foreground);\n  font-family: var(--font-geist-sans, system-ui, sans-serif);\n}\n`,
  };
  generated.forEach(s => {
    files[`components/${toPascalCase(s.name)}Section.tsx`] = genResults[s.id];
  });
  return files;
}

export default function ExportPage() {
  const [sections, setSections] = useState<StoredSection[]>([]);
  const [genResults, setGenResults] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<StatusData | null>(null);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(setStatus).catch(() => {});
    try {
      const savedSections = localStorage.getItem("aiox-gen-sections");
      const savedResults = localStorage.getItem("aiox-gen-results");
      if (savedSections) setSections(JSON.parse(savedSections) as StoredSection[]);
      if (savedResults) setGenResults(JSON.parse(savedResults) as Record<string, string>);
    } catch { /* ignore */ }
  }, []);

  const generatedSections = sections.filter(s => genResults[s.id]);
  const generatedCount = generatedSections.length;

  const exportZip = useCallback(async () => {
    if (generatedCount === 0) return;
    setExportError("");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const files = buildProjectFiles(sections, genResults);
      Object.entries(files).forEach(([path, content]) => zip.file(path, content));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "aiox-projeto.zip";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Erro ao gerar ZIP");
    }
  }, [sections, genResults, generatedCount]);

  const openStackBlitz = useCallback(() => {
    if (generatedCount === 0) return;
    const files = buildProjectFiles(sections, genResults);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://stackblitz.com/run";
    form.target = "_blank";
    const add = (name: string, value: string) => {
      const input = document.createElement("input");
      input.type = "hidden"; input.name = name; input.value = value;
      form.appendChild(input);
    };
    add("project[title]", "Projeto AIOX Studio");
    add("project[description]", "Gerado pelo AIOX Studio");
    add("project[template]", "nextjs");
    Object.entries(files).forEach(([path, content]) => add(`project[files][${path}]`, content));
    document.body.appendChild(form); form.submit(); document.body.removeChild(form);
  }, [sections, genResults, generatedCount]);

  const hasBrief = (status?.stats.briefCount ?? 0) > 0;

  const CHECKLIST = [
    { label: "Brief do projeto salvo",         done: hasBrief },
    { label: "Seções geradas no Studio",        done: generatedCount > 0 },
    { label: "Variáveis de ambiente OK",        done: status?.configs.every(c => c.status === "ok") ?? false },
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
              <Package size={13} style={{ color: "var(--text-subtle)" }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-subtle)" }}>
                Passo 5
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Exportar Projeto
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Baixe o código gerado ou abra direto no StackBlitz para preview
            </p>
          </motion.div>

          {/* Generated sections summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="mb-6 p-4 rounded-xl border"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-subtle)" }}>
                Seções geradas
              </p>
              {generatedCount === 0 && (
                <Link
                  href="/studio"
                  className="text-[10px] flex items-center gap-1 transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  Ir para o Studio <ArrowRight size={9} />
                </Link>
              )}
            </div>

            {generatedCount === 0 ? (
              <div className="flex items-center gap-3 py-4 justify-center">
                <Layers size={20} style={{ color: "var(--text-subtle)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Nenhuma seção gerada ainda
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
                    Gere as seções no Studio e volte aqui para exportar
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {generatedSections.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <FileCode2 size={11} style={{ color: "var(--accent)" }} />
                    <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>
                      {s.name}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "var(--text-subtle)" }}>
                      {toPascalCase(s.name)}Section.tsx
                    </span>
                    <CheckCircle2 size={10} style={{ color: "var(--accent)" }} />
                  </div>
                ))}
                <p className="text-[10px] pt-1 text-center" style={{ color: "var(--text-subtle)" }}>
                  {generatedCount} seção{generatedCount !== 1 ? "ões" : ""} prontas para exportar
                </p>
              </div>
            )}
          </motion.div>

          {/* Export actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-2 gap-4 mb-6"
          >
            <button
              onClick={exportZip}
              disabled={generatedCount === 0}
              className="flex flex-col gap-3 p-5 rounded-xl border transition-all text-left"
              style={generatedCount > 0 ? {
                borderColor: "rgba(125,197,43,0.3)",
                background: "rgba(125,197,43,0.06)",
                cursor: "pointer",
              } : {
                borderColor: "var(--border)",
                background: "var(--surface-1)",
                opacity: 0.5,
                cursor: "not-allowed",
              }}
              onMouseEnter={e => { if (generatedCount > 0) (e.currentTarget as HTMLElement).style.borderColor = "rgba(125,197,43,0.5)"; }}
              onMouseLeave={e => { if (generatedCount > 0) (e.currentTarget as HTMLElement).style.borderColor = "rgba(125,197,43,0.3)"; }}
            >
              <div className="flex items-center justify-between">
                <Download size={18} style={{ color: generatedCount > 0 ? "#7DC52B" : "var(--text-subtle)" }} />
                <Code2 size={12} style={{ color: "var(--text-subtle)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Baixar ZIP
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Projeto Next.js completo com todos os componentes
                </p>
              </div>
            </button>

            <button
              onClick={openStackBlitz}
              disabled={generatedCount === 0}
              className="flex flex-col gap-3 p-5 rounded-xl border transition-all text-left"
              style={generatedCount > 0 ? {
                borderColor: "rgba(96,165,250,0.3)",
                background: "rgba(96,165,250,0.06)",
                cursor: "pointer",
              } : {
                borderColor: "var(--border)",
                background: "var(--surface-1)",
                opacity: 0.5,
                cursor: "not-allowed",
              }}
              onMouseEnter={e => { if (generatedCount > 0) (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.5)"; }}
              onMouseLeave={e => { if (generatedCount > 0) (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.3)"; }}
            >
              <div className="flex items-center justify-between">
                <Globe size={18} style={{ color: generatedCount > 0 ? "#60A5FA" : "var(--text-subtle)" }} />
                <ExternalLink size={12} style={{ color: "var(--text-subtle)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Abrir no StackBlitz
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Preview imediato no browser sem instalar nada
                </p>
              </div>
            </button>
          </motion.div>

          {/* Export error */}
          {exportError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 flex items-center gap-2 p-3 rounded-lg"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}
            >
              <AlertCircle size={13} style={{ color: "#F87171" }} />
              <span className="text-xs" style={{ color: "#F87171" }}>{exportError}</span>
            </motion.div>
          )}

          {/* Studio shortcut */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-6"
          >
            <Link
              href="/studio"
              className="flex items-center justify-between p-4 rounded-xl border transition-all group"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
            >
              <div className="flex items-center gap-3">
                <Layers size={16} style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Studio</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Gerar ou regerar seções do projeto
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--text-muted)" }} />
            </Link>
          </motion.div>

          {/* Pre-export checklist */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-subtle)" }}>
              Checklist de exportação
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

          {/* Env vars status */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-subtle)" }}>
                Integrações
              </p>
              <div className="space-y-2 mb-3">
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
                      {!ok && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-400/60">Configurar</span>
                          <Settings size={10} className="text-amber-400/40" />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-subtle)" }}>
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
