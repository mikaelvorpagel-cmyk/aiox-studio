import { GoogleGenerativeAI } from "@google/generative-ai";
import { anthropic, MODEL } from "@/lib/anthropic";

/* ── Provider priority: Gemini (free) → Anthropic ──────────────────────
   Gemini Flash: GEMINI_API_KEY (+ GEMINI_API_KEY_2, GEMINI_API_KEY_3 for rotation)
   Anthropic/Vertex: uses lib/anthropic.ts (already configured)
──────────────────────────────────────────────────────────────────────── */
export type Provider = "gemini" | "anthropic" | "none";

export function getProvider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  const hasAnthropic = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sua-chave-aqui";
  const hasVertex = !!process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (hasAnthropic || hasVertex) return "anthropic";
  return "none";
}

/* ── Gemini key rotation ─────────────────────────────────────────────
   Reads GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3...
   Round-robin: 3 keys = 45 RPM total on the free tier.
──────────────────────────────────────────────────────────────────────── */
let _keyIndex = 0;

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  let i = 2;
  while (process.env[`GEMINI_API_KEY_${i}`]) {
    keys.push(process.env[`GEMINI_API_KEY_${i}`]!);
    i++;
  }
  return keys;
}

function nextGeminiKey(): string {
  const keys = getGeminiKeys();
  if (keys.length === 0) throw new Error("Nenhuma GEMINI_API_KEY configurada.");
  const key = keys[_keyIndex % keys.length];
  _keyIndex++;
  return key;
}

/* ── generateText — single non-streaming call (for section generation) ─
   On 429 rate limit, retries with the next Gemini key automatically.
──────────────────────────────────────────────────────────────────────── */
export async function generateText(
  system: string,
  prompt: string,
  maxTokens = 6000
): Promise<string> {
  const provider = getProvider();

  if (provider === "gemini") {
    const keys = getGeminiKeys();
    let lastError: unknown;

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const key = nextGeminiKey();
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
          systemInstruction: system,
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("429") && !msg.toLowerCase().includes("rate")) throw err;
      }
    }
    throw lastError;
  }

  if (provider === "anthropic") {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    return msg.content[0].type === "text" ? msg.content[0].text : "";
  }

  return "❌ Nenhuma API configurada. Adicione GEMINI_API_KEY ou ANTHROPIC_API_KEY.";
}
