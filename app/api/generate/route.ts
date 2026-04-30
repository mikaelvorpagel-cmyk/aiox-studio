import { NextRequest, NextResponse } from "next/server";
import { generateText, getProvider } from "@/lib/ai";
import { getBriefs, getProjectContext } from "@/lib/squad";

/* Rate limiter: max 12 req/min (stays under 15 RPM Gemini free tier per key) */
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= 12) return false;
  entry.count++;
  return true;
}

function getActiveBrief(): string {
  try {
    const briefs = getBriefs();
    if (!briefs.length) return "Sem brief ativo.";
    const latest = briefs[briefs.length - 1];
    return latest.content;
  } catch { return "Sem brief disponível."; }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Limite de geração atingido. Aguarde 1 minuto." }, { status: 429 });
  }

  if (getProvider() === "none") {
    return NextResponse.json({ error: "Nenhuma API configurada. Adicione GEMINI_API_KEY ou ANTHROPIC_API_KEY." }, { status: 503 });
  }

  let body: {
    section: {
      order: number;
      name: string;
      type: string;
      agent: string;
      effects: string[];
      notes: string;
    };
    projectContext?: string;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body inválido" }, { status: 400 }); }

  const { section } = body;
  const brief = getActiveBrief();
  const projectCtx = getProjectContext() || body.projectContext || "";

  const system = `Você é um UI Developer especializado em Next.js + Tailwind CSS.
Gere componentes React/Next.js modernos, limpos e responsivos.
Sempre use TypeScript. Mobile-first. Dark mode via Tailwind.
Responda APENAS com o código do componente — sem explicações, sem markdown wrapping extra.
Comece direto com "import" ou "'use client'".`;

  const effectsList = section.effects.length > 0
    ? `Efeitos de motion solicitados: ${section.effects.join(", ")} (use Framer Motion)`
    : "Sem efeitos de motion específicos.";

  const notesBlock = section.notes
    ? `\nInstruções específicas do designer:\n${section.notes}`
    : "";

  const prompt = `Gere o componente React/Next.js completo para a seção: **${section.name}** (tipo: ${section.type}).

## Contexto do Projeto
${projectCtx || "Projeto de landing page premium."}

## Brief do Cliente
${brief}

## Especificações da Seção
- Nome: ${section.name}
- Tipo: ${section.type}
- Agente responsável: ${section.agent}
- Posição na página: ${section.order}ª seção
- ${effectsList}${notesBlock}

## Requisitos técnicos
- Next.js App Router + TypeScript
- Tailwind CSS (dark mode, mobile-first)
- ${section.effects.includes("fade-up") || section.effects.includes("fade-in") ? "Framer Motion para animações" : "Sem dependências extras além do necessário"}
- Sem dados hardcoded — use props ou constantes no topo do arquivo
- Componente exportado como default
- Nome do arquivo: ${toPascalCase(section.name)}Section.tsx

Gere o código completo agora:`;

  try {
    const code = await generateText(system, prompt, 4096);
    return NextResponse.json({
      section: section.name,
      type: section.type,
      order: section.order,
      code: cleanCode(code),
      agent: section.agent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro ao gerar seção "${section.name}": ${msg}` }, { status: 500 });
  }
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^|\s|-|_)(\w)/g, (_, c) => c.toUpperCase()).replace(/\s/g, "");
}

function cleanCode(raw: string): string {
  return raw
    .replace(/^```(?:tsx?|jsx?|typescript)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
}
