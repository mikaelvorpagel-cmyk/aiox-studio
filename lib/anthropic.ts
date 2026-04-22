import Anthropic from "@anthropic-ai/sdk";
import AnthropicVertex from "@anthropic-ai/vertex-sdk";

// Selects provider based on available env vars
// Priority: Vertex AI (Google Cloud) → Anthropic API
const useVertex = !!process.env.GOOGLE_CLOUD_PROJECT_ID;

export const anthropic = useVertex
  ? new AnthropicVertex({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      region: process.env.GOOGLE_CLOUD_REGION ?? "us-east5",
    })
  : new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

// Model IDs differ between providers
export const MODEL = useVertex
  ? (process.env.VERTEX_MODEL ?? "claude-sonnet-4-5@20251001")
  : (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6");

export const PROVIDER = useVertex ? "vertex" : "anthropic";

export function buildSystemPrompt(
  agent: { name: string; title: string; role: string; identity: string; focus: string; style: string; systemPrompt?: string },
  projectContext: string,
  playbook: string,
  extraContext?: string
): string {
  // Agent defines its own full system prompt — inject context on top
  if (agent.systemPrompt) {
    return `${agent.systemPrompt}

## Contexto do Projeto Atual
${projectContext}

${extraContext ? `## Arquivos da Base de Conhecimento\n${extraContext}` : ""}

## Instrução global
- Responda SEMPRE em português brasileiro
- Nunca invente links ou dados que não estejam nos arquivos fornecidos`;
  }

  return `Você é ${agent.name}, ${agent.title} do Squad Web Design.

## Sua Persona
- **Role:** ${agent.role}
- **Style:** ${agent.style}
- **Identity:** ${agent.identity}
- **Focus:** ${agent.focus}

## Contexto do Projeto Atual
${projectContext}

## Premium Web Playbook (seu guia de qualidade)
${playbook.slice(0, 3000)}

${extraContext ? `## Contexto adicional\n${extraContext}` : ""}

## Instruções de comportamento
- Responda SEMPRE em português brasileiro
- Seja específico e direto — entregue valor real, não respostas genéricas
- Quando precisar de informação para tomar uma decisão de qualidade, PERGUNTE antes de prosseguir
- Suas perguntas devem ser objetivas e numeradas para facilitar resposta
- Quando entregar um resultado (copy, spec, código), formate claramente com markdown
- Mantenha o tom da sua persona: ${agent.style}
- Se houver algo no brief ou contexto que contradiz boas práticas, sinalize antes de executar`;
}
