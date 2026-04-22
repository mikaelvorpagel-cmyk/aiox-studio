import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import { safeName } from "@/lib/utils";
import { appendToKBFile, getExistingUrls } from "@/lib/knowledge";

export const CATEGORY_LABELS: Record<string, string> = {
  visual:    "🎨 Inspiração Visual",
  animation: "✨ Animação / Motion",
  ui:        "⚙️ UI / Componentes",
  reference: "📊 Benchmark / Referência",
};

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  category: string;
  relevance: "alta" | "média" | "baixa";
}

function expandKeywords(keyword: string): Record<string, string[]> {
  const k = keyword.toLowerCase().trim();
  return {
    visual: [
      `${k} website design inspiration`,
      `${k} landing page design premium`,
    ],
    animation: [
      `${k} website animation interaction design`,
      `${k} web design motion effects`,
    ],
    ui: [
      `${k} UI design components modern`,
      `${k} website design 2024`,
    ],
    reference: [
      `best ${k} websites awwwards`,
      `top ${k} company website design`,
    ],
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.EXA_API_KEY || process.env.EXA_API_KEY === "sua-chave-exa-aqui") {
    return NextResponse.json(
      { error: "EXA_API_KEY não configurada. Adicione sua chave em .env.local (exa.ai — gratuito)" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.keyword?.trim()) {
    return NextResponse.json({ error: "keyword é obrigatório" }, { status: 400 });
  }

  const { keyword, save = true } = body as { keyword: string; save?: boolean };
  const exa = new Exa(process.env.EXA_API_KEY);
  const queries = expandKeywords(keyword);

  // Deduplicate by URL using a Set — O(1) lookup
  const seenUrls = new Set<string>();
  const results: SearchResult[] = [];

  await Promise.allSettled(
    Object.entries(queries).map(async ([category, queryList]) => {
      for (const query of queryList) {
        try {
          const res = await exa.searchAndContents(query, {
            numResults: 3,
            useAutoprompt: true,
            summary: { query: `Why is this a good ${keyword} website design reference?` },
          });
          for (const item of res.results) {
            if (!item.url || seenUrls.has(item.url)) continue;
            seenUrls.add(item.url);
            results.push({
              title:       item.title ?? item.url,
              url:         item.url,
              description: (item.summary as string | undefined) ?? "",
              category,
              relevance:   query.includes("awwwards") || query.includes("premium") ? "alta" : "média",
            });
          }
        } catch { /* skip failed individual queries */ }
      }
    })
  );

  if (results.length === 0) {
    return NextResponse.json(
      { error: "Nenhum resultado encontrado. Tente uma palavra-chave diferente." },
      { status: 404 }
    );
  }

  let filename: string | null = null;

  if (save) {
    filename = `refs-${safeName(keyword)}.md`;
    const existingUrls = getExistingUrls(filename);
    const newResults = results.filter(r => !existingUrls.has(r.url));

    if (newResults.length > 0) {
      const date = new Date().toLocaleDateString("pt-BR");
      const isNew = existingUrls.size === 0;

      const block = [
        isNew
          ? `# Referências — ${keyword}\n\n## Busca em ${date}`
          : `\n\n---\n\n## Busca em ${date}`,
        "",
        ...Object.entries(CATEGORY_LABELS)
          .map(([cat, label]) => {
            const items = newResults.filter(r => r.category === cat);
            if (!items.length) return null;
            return [
              `### ${label}`,
              "",
              ...items.map(r => `- **[${r.title}](${r.url})**\n  Relevância: ${r.relevance}\n  ${r.description}`),
            ].join("\n");
          })
          .filter(Boolean),
      ].join("\n");

      appendToKBFile(filename, block);
    }
  }

  return NextResponse.json({ keyword, total: results.length, results, saved: save, filename });
}
