import { NextRequest, NextResponse } from "next/server";
import { anthropic, buildSystemPrompt, MODEL, PROVIDER } from "@/lib/anthropic";
import { getProjectContext, getPlaybook, getBriefs } from "@/lib/squad";
import { getKBContext } from "@/lib/knowledge";

function getActiveBriefContext(): string {
  try {
    const briefs = getBriefs();
    if (briefs.length === 0) return "";
    // Use the most recently saved brief as active context
    const latest = briefs[briefs.length - 1];
    return `\n\n---\n## BRIEF DO PROJETO ATIVO\n\nArquivo: ${latest.name}.md\n\n${latest.content}\n\n---\n`;
  } catch { return ""; }
}

// Simple in-memory rate limiter — 20 requests/minute per IP
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto." }, { status: 429 });
  }

  const missingConfig = PROVIDER === "vertex"
    ? !process.env.GOOGLE_CLOUD_PROJECT_ID
    : (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "sua-chave-aqui");

  if (missingConfig) {
    const msg = PROVIDER === "vertex"
      ? "GOOGLE_CLOUD_PROJECT_ID não configurado no .env.local"
      : "ANTHROPIC_API_KEY não configurada. Adicione sua chave no .env.local e reinicie o servidor.";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  let body: { messages: unknown; agent: unknown; extraContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { messages, agent, extraContext } = body;
  if (!Array.isArray(messages) || !agent || typeof agent !== "object") {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  // Keep last 20 messages to control token usage
  const trimmedMessages = (messages as { role: "user" | "assistant"; content: string }[]).slice(-20);

  const agentObj = agent as Parameters<typeof buildSystemPrompt>[0] & { id?: string };

  // Reference Scout gets the full knowledge base as context
  const kbContext = agentObj.id === "reference-scout" ? getKBContext() : undefined;

  // All agents receive the active brief as context (project awareness)
  const briefContext = getActiveBriefContext();

  const systemPrompt = buildSystemPrompt(
    agentObj,
    getProjectContext(),
    getPlaybook(),
    [kbContext ?? extraContext ?? "", briefContext].filter(Boolean).join("\n") || undefined
  );

  try {
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: trimmedMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401") || msg.includes("authentication")) {
      return NextResponse.json({ error: "Chave da API inválida. Verifique as credenciais no .env.local" }, { status: 401 });
    }
    return NextResponse.json({ error: `Erro na API: ${msg}` }, { status: 500 });
  }
}
