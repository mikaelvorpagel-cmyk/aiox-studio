import { NextResponse } from "next/server";
import { validateConfig, getAgents, getBriefs } from "@/lib/squad";
import { listKBFiles } from "@/lib/knowledge";
import { PROVIDER } from "@/lib/anthropic";

export interface ConfigItem {
  key: string;
  label: string;
  status: "ok" | "missing" | "unconfigured";
  value?: string;
  hint: string;
  url?: string;
}

export async function GET() {
  const squadConfig = validateConfig();

  const llm: ConfigItem = PROVIDER === "vertex"
    ? {
        key:    "GOOGLE_CLOUD_PROJECT_ID",
        label:  "Google Vertex AI",
        status: process.env.GOOGLE_CLOUD_PROJECT_ID ? "ok" : "missing",
        value:  process.env.GOOGLE_CLOUD_PROJECT_ID,
        hint:   "Projeto do Google Cloud com Vertex AI ativado",
        url:    "https://console.cloud.google.com",
      }
    : {
        key:    "ANTHROPIC_API_KEY",
        label:  "Anthropic API",
        status: !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "sua-chave-aqui"
          ? "missing"
          : "ok",
        hint: "Chave de API da Anthropic para o chat dos agentes",
        url:  "https://console.anthropic.com/keys",
      };

  const exa: ConfigItem = {
    key:    "EXA_API_KEY",
    label:  "Exa Search",
    status: !process.env.EXA_API_KEY || process.env.EXA_API_KEY === "sua-chave-exa-aqui"
      ? "missing"
      : "ok",
    hint: "Busca semântica na web para o Reference Scout",
    url:  "https://exa.ai/api",
  };

  const hasLocalSquad = !!(process.env.SQUAD_PATH);
  const squad: ConfigItem = {
    key:    "SQUAD_PATH",
    label:  "Squad Agents",
    status: "ok",
    value:  hasLocalSquad ? process.env.SQUAD_PATH : "bundled (11 agentes)",
    hint:   hasLocalSquad ? "Squad carregado do sistema de arquivos" : "11 agentes embutidos — sem necessidade de configuração",
  };

  let agentCount = 0;
  let briefCount = 0;
  let kbCount = 0;

  try { agentCount = getAgents().length; } catch { /* ignore */ }
  try { briefCount = getBriefs().length; } catch { /* ignore */ }
  try { kbCount = listKBFiles().length; } catch { /* ignore */ }

  return NextResponse.json({
    provider: PROVIDER,
    configs: [llm, exa, squad],
    stats: { agentCount, briefCount, kbCount },
  });
}
