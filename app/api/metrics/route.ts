import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import { appendToKBFile, getExistingUrls } from "@/lib/knowledge";

export interface MetricResult {
  title: string;
  url: string;
  summary: string;
  category: string;
  publishedDate?: string;
}

export const METRIC_CATEGORIES: Record<string, { label: string; icon: string; queries: string[] }> = {
  seo: {
    label: "SEO",
    icon: "🔍",
    queries: [
      "Google SEO ranking factors most important 2025",
      "Core Web Vitals LCP CLS FID optimization guide 2025",
    ],
  },
  cro: {
    label: "Conversão",
    icon: "📈",
    queries: [
      "landing page conversion rate optimization best practices 2025 statistics",
      "website CTA button design conversion rate increase 2025",
    ],
  },
  design: {
    label: "Design & UX",
    icon: "🎨",
    queries: [
      "web design trends 2025 user engagement visual hierarchy",
      "UX design best practices website usability research 2025",
    ],
  },
  performance: {
    label: "Performance",
    icon: "⚡",
    queries: [
      "website performance optimization page speed score 100 2025",
      "next.js react performance optimization techniques 2025",
    ],
  },
  mobile: {
    label: "Mobile",
    icon: "📱",
    queries: [
      "mobile first design best practices conversion 2025",
      "mobile UX patterns website 2025 statistics",
    ],
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.EXA_API_KEY || process.env.EXA_API_KEY === "sua-chave-exa-aqui") {
    return NextResponse.json(
      { error: "EXA_API_KEY não configurada. Configure em .env.local (exa.ai)" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    categories?: string[];
    save?: boolean;
  };

  const requestedCategories = body.categories ?? Object.keys(METRIC_CATEGORIES);
  const save = body.save ?? false;
  const exa = new Exa(process.env.EXA_API_KEY);
  const seenUrls = new Set<string>();
  const results: MetricResult[] = [];

  await Promise.allSettled(
    requestedCategories.map(async (catKey) => {
      const cat = METRIC_CATEGORIES[catKey];
      if (!cat) return;

      for (const query of cat.queries) {
        try {
          const res = await exa.searchAndContents(query, {
            numResults: 3,
            useAutoprompt: true,
            summary: { query: "What is the most actionable takeaway for web designers and developers?" },
          });
          for (const item of res.results) {
            if (!item.url || seenUrls.has(item.url)) continue;
            seenUrls.add(item.url);
            results.push({
              title:         item.title ?? item.url,
              url:           item.url,
              summary:       (item.summary as string | undefined) ?? "",
              category:      catKey,
              publishedDate: item.publishedDate ?? undefined,
            });
          }
        } catch { /* skip failed queries */ }
      }
    })
  );

  if (results.length === 0) {
    return NextResponse.json(
      { error: "Nenhum resultado. Verifique a chave EXA e tente novamente." },
      { status: 404 }
    );
  }

  if (save) {
    const filename = "metrics-latest.md";
    const existingUrls = getExistingUrls(filename);
    const newResults = results.filter(r => !existingUrls.has(r.url));

    if (newResults.length > 0) {
      const date = new Date().toLocaleString("pt-BR");
      const existingSize = existingUrls.size;
      const block = [
        existingSize === 0
          ? `# Métricas & Tendências Web\n\n## Atualização: ${date}`
          : `\n\n---\n\n## Atualização: ${date}`,
        "",
        ...Object.entries(METRIC_CATEGORIES)
          .map(([key, cat]) => {
            const items = newResults.filter(r => r.category === key);
            if (!items.length) return null;
            return [
              `### ${cat.icon} ${cat.label}`,
              "",
              ...items.map(r =>
                `- **[${r.title}](${r.url})**\n  ${r.summary}`
              ),
            ].join("\n");
          })
          .filter(Boolean),
      ].join("\n");

      appendToKBFile(filename, block);
    }
  }

  return NextResponse.json({
    total:      results.length,
    results,
    categories: requestedCategories,
    saved:      save,
    updatedAt:  new Date().toISOString(),
  });
}
