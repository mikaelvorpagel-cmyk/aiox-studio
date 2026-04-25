import fs from "fs";
import path from "path";
import { safeName } from "@/lib/utils";
import { BUNDLED_AGENTS, BUNDLED_PLAYBOOK, BUNDLED_PROJECT_CONTEXT, BUNDLED_CHECKLIST, DEMO_BRIEF } from "@/lib/squad-data";

const SQUAD_PATH = process.env.SQUAD_PATH ?? "";

// In-memory cache — invalidated on server restart only (fine for a local dev tool)
const fileCache = new Map<string, string>();

function readCached(filePath: string): string {
  if (fileCache.has(filePath)) return fileCache.get(filePath)!;
  if (!fs.existsSync(filePath)) return "";
  const content = fs.readFileSync(filePath, "utf-8");
  fileCache.set(filePath, content);
  return content;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  icon: string;
  role: string;
  style: string;
  identity: string;
  focus: string;
  commands: { name: string; description: string }[];
  color: string;
  systemPrompt?: string;
}

const AGENT_COLORS: Record<string, string> = {
  "copy-specialist":        "#A78BFA",
  "ui-developer":           "#60A5FA",
  "motion-engineer":        "#F472B6",
  "design-reviewer":        "#FB923C",
  "seo-specialist":         "#34D399",
  "assets-manager":         "#FBBF24",
  "deploy-agent":           "#7DC52B",
  "ux-researcher":          "#22D3EE",
  "storytelling-specialist":"#E879F9",
  "web-designer":           "#F87171",
  "reference-scout":        "#F59E0B",
};

function parseAgentMd(content: string, id: string): Agent {
  const get = (key: string): string => {
    const m = content.match(new RegExp(`${key}:\\s*'?([^'\\n]+)'?`));
    return m ? m[1].trim() : "";
  };

  const commands: { name: string; description: string }[] = [];
  for (const [, name, desc] of content.matchAll(/- name: (\S+)\n\s+description: '([^']+)'/g)) {
    commands.push({ name, description: desc });
  }

  const spMatch = content.match(/system_prompt:\s*\|\n([\s\S]*?)(?=\n\w|\n---)/);
  const systemPrompt = spMatch ? spMatch[1].replace(/^ {2}/gm, "").trim() : undefined;

  return {
    id,
    name:     get("name"),
    title:    get("title"),
    icon:     get("icon"),
    role:     get("role"),
    style:    get("style"),
    identity: get("identity"),
    focus:    get("focus"),
    commands,
    color:    AGENT_COLORS[id] ?? "#7DC52B",
    systemPrompt,
  };
}

export function validateConfig(): { ok: boolean; error?: string } {
  // Bundled agents are always available as fallback
  if (!SQUAD_PATH) return { ok: true, error: undefined };
  if (!fs.existsSync(SQUAD_PATH)) return { ok: true, error: undefined }; // fallback to bundled
  if (!fs.existsSync(path.join(SQUAD_PATH, "agents"))) return { ok: true, error: undefined }; // fallback
  return { ok: true };
}

export function getAgents(): Agent[] {
  if (SQUAD_PATH && fs.existsSync(path.join(SQUAD_PATH, "agents"))) {
    try {
      const agentsDir = path.join(SQUAD_PATH, "agents");
      return fs.readdirSync(agentsDir)
        .filter(f => f.endsWith(".md"))
        .map(f => {
          const id = f.replace(".md", "");
          return parseAgentMd(readCached(path.join(agentsDir, f)), id);
        });
    } catch { /* fall through to bundled */ }
  }
  return BUNDLED_AGENTS;
}

export function getDataFile(filename: string): string {
  if (!SQUAD_PATH) return "";
  return readCached(path.join(SQUAD_PATH, "data", safeName(filename)));
}

export function getPlaybook(): string {
  if (SQUAD_PATH && fs.existsSync(path.join(SQUAD_PATH, "data", "premium-web-playbook.md"))) {
    return getDataFile("premium-web-playbook.md");
  }
  return BUNDLED_PLAYBOOK;
}

export function getProjectContext(): string {
  if (SQUAD_PATH && fs.existsSync(path.join(SQUAD_PATH, "data", "project-context.md"))) {
    return getDataFile("project-context.md");
  }
  return BUNDLED_PROJECT_CONTEXT;
}

export function getChecklist(): string {
  if (SQUAD_PATH && fs.existsSync(path.join(SQUAD_PATH, "checklists", "premium-site-checklist.md"))) {
    return readCached(path.join(SQUAD_PATH, "checklists", "premium-site-checklist.md"));
  }
  return BUNDLED_CHECKLIST;
}

export function getBriefs(): { name: string; content: string; previewPath?: string }[] {
  let briefs: { name: string; content: string; previewPath?: string }[] = [];

  if (SQUAD_PATH) {
    const briefsDir = path.join(SQUAD_PATH, "briefs");
    if (fs.existsSync(briefsDir)) {
      try {
        briefs = fs.readdirSync(briefsDir)
          .filter(f => f.endsWith(".md"))
          .map(f => ({
            name: f.replace(".md", ""),
            content: fs.readFileSync(path.join(briefsDir, f), "utf-8"),
          }));
      } catch { /* ignore */ }
    }
  }

  // Always include the demo brief so Vercel deployment works
  if (!briefs.find(b => b.name === DEMO_BRIEF.name)) {
    briefs = [{ name: DEMO_BRIEF.name, content: DEMO_BRIEF.content, previewPath: DEMO_BRIEF.previewPath }, ...briefs];
  }

  return briefs;
}

export function saveBrief(name: string, content: string): void {
  if (!SQUAD_PATH) throw new Error("SQUAD_PATH não configurado");
  const briefsDir = path.join(SQUAD_PATH, "briefs");
  if (!fs.existsSync(briefsDir)) fs.mkdirSync(briefsDir, { recursive: true });
  const safe = safeName(name);
  if (!safe) throw new Error("Nome de brief inválido");
  fs.writeFileSync(path.join(briefsDir, `${safe}.md`), content, "utf-8");
}
