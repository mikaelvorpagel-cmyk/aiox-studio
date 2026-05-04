"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionRenderer } from "@/components/studio/SectionRenderer";
import type { PageSection } from "@/lib/page-model";

const SECTIONS: PageSection[] = [
  {
    id: "fs-1", order: 1, name: "Hero", type: "hero", status: "done",
    effects: ["fade-up", "magnetic-button"], notes: "", agent: "web-designer",
    styles: {
      layout: "contained", alignment: "center",
      backgroundColor: "#0D0D0D", textColor: "#F0F0EB",
      accentColor: "#F5E642", headingColor: "#ffffff",
      mutedColor: "rgba(255,255,255,0.5)",
      paddingY: "xl", gap: "md", columns: 3, theme: "dark",
    },
    content: {
      eyebrow: "BRANDING ESTRATÉGICO",
      heading: "Sua marca merece ser lembrada por razões certas",
      subheading: "Identidade visual que converte percepção em autoridade",
      body: "Transformamos marcas genéricas em ativos estratégicos de negócio. Design editorial premium para founders e empresas que não aceitam passar despercebidos.",
      primaryCta: { text: "Iniciar meu projeto", href: "#contato", variant: "primary" },
      secondaryCta: { text: "Ver nosso trabalho", href: "#servicos", variant: "outline" },
      stats: [
        { id: "s1", value: "140+", label: "Marcas criadas", description: "Projetos entregues para founders e empresas de alto crescimento" },
        { id: "s2", value: "98%", label: "Satisfação", description: "Clientes que indicam a Forma Studio após a entrega" },
        { id: "s3", value: "14 dias", label: "Prazo médio", description: "Da estratégia ao brand book finalizado" },
      ],
    },
  },
  {
    id: "fs-2", order: 2, name: "Serviços", type: "services", status: "done",
    effects: ["stagger", "scroll-reveal"], notes: "", agent: "ui-developer",
    styles: {
      layout: "contained", alignment: "center",
      backgroundColor: "#111111", textColor: "#F0F0EB",
      accentColor: "#F5E642", headingColor: "#ffffff",
      mutedColor: "rgba(255,255,255,0.5)",
      paddingY: "lg", gap: "md", columns: 2, theme: "dark",
    },
    content: {
      eyebrow: "O QUE FAZEMOS",
      heading: "Identidade que posiciona. Design que converte.",
      subheading: "Cada projeto é construído com intenção estratégica — do conceito à execução visual, sem concessões.",
      items: [
        { id: "i1", title: "Brand Identity", description: "Construímos marcas que comunicam valor antes mesmo de você falar uma palavra. Estratégia de posicionamento, naming, identidade visual completa e sistema de marca pronto para escalar.", icon: "◈" },
        { id: "i2", title: "Redesign Estratégico", description: "Para marcas que cresceram além da sua identidade atual. Diagnóstico profundo, reposicionamento e evolução visual que preserva equity e elimina o que limita.", icon: "⬡" },
        { id: "i3", title: "Brand System & Guidelines", description: "Um sistema vivo de marca: tipografia, cor, tom de voz, grid e regras de aplicação. Tudo que sua equipe e fornecedores precisam para manter consistência em qualquer touchpoint.", icon: "▣" },
        { id: "i4", title: "Direção de Arte Digital", description: "Da landing page ao feed — criamos a linguagem visual digital da sua marca com coerência editorial e impacto imediato. UI, motion guidelines e ativos prontos para produção.", icon: "✦" },
      ],
      primaryCta: { text: "Iniciar um projeto", href: "#contato", variant: "primary" },
    },
  },
  {
    id: "fs-3", order: 3, name: "Depoimentos", type: "testimonials", status: "done",
    effects: [], notes: "", agent: "copy-specialist",
    styles: {
      layout: "contained", alignment: "center",
      backgroundColor: "#0D0D0D", textColor: "#F0F0EB",
      accentColor: "#F5E642", headingColor: "#ffffff",
      mutedColor: "rgba(255,255,255,0.5)",
      paddingY: "lg", gap: "md", columns: 2, theme: "dark",
    },
    content: {
      eyebrow: "CLIENTES QUE TRANSFORMARAM SUAS MARCAS",
      heading: "Resultados que falam mais alto que qualquer promessa",
      subheading: "Founders e CMOs que apostaram em identidade visual estratégica — e viram o retorno.",
      testimonials: [
        { id: "t1", quote: "Antes da Forma Studio, nossa marca parecia mais uma startup genérica de tech. Depois do processo, entramos em reuniões com fundos e o pitch nem precisava de tanto esforço — a identidade já comunicava seriedade antes de abrirmos a boca. Fechamos uma rodada seed de R$2,4M três meses depois do rebranding.", author: "Rodrigo Cavalcanti", role: "CEO & Co-founder", company: "Nuvem Capital", rating: 5 },
        { id: "t2", quote: "A Forma Studio entendeu nosso problema sem que eu precisasse explicar muito. O processo foi cirúrgico: em duas semanas tínhamos uma identidade que finalmente refletia o posicionamento premium que a gente sempre quis ter. Nosso ticket médio subiu 40% no trimestre seguinte.", author: "Fernanda Lins", role: "CMO", company: "Atria Health", rating: 5 },
        { id: "t3", quote: "Já contratei três agências antes da Forma Studio. A diferença está na estratégia por trás de cada decisão visual — nada é decorativo, tudo tem intenção. Nossa taxa de conversão aumentou 67% após o redesign e paramos de competir por preço.", author: "Thiago Mendes", role: "Founder", company: "Solara Arquitetura", rating: 5 },
        { id: "t4", quote: "O briefing foi a etapa que mais me surpreendeu — a profundidade das perguntas mostrou que eles entendiam de negócio, não só de design. O resultado foi uma marca que meus sócios, clientes e equipe se orgulham de usar.", author: "Carolina Furtado", role: "Diretora Executiva", company: "Vértice Consultoria", rating: 5 },
      ],
    },
  },
  {
    id: "fs-4", order: 4, name: "FAQ", type: "faq", status: "done",
    effects: [], notes: "", agent: "copy-specialist",
    styles: {
      layout: "contained", alignment: "left",
      backgroundColor: "#111111", textColor: "#F0F0EB",
      accentColor: "#F5E642", headingColor: "#ffffff",
      mutedColor: "rgba(255,255,255,0.5)",
      paddingY: "lg", gap: "md", columns: 1 as never, theme: "dark",
    },
    content: {
      eyebrow: "PERGUNTAS FREQUENTES",
      heading: "Tudo que você precisa saber antes de começar",
      faqs: [
        { id: "f1", question: "Qual é o prazo real para entregar uma identidade visual completa?", answer: "O projeto completo — incluindo diagnóstico estratégico, conceito criativo, identidade visual e brandbook — é entregue em 14 dias corridos após aprovação do briefing. Trabalhamos com processo enxuto, sem etapas desnecessárias. Você recebe atualizações a cada etapa e tem acesso direto ao time durante todo o processo." },
        { id: "f2", question: "Quanto custa um projeto de branding na Forma Studio?", answer: "Nossos projetos partem de R$8.000 e podem chegar a R$15.000 dependendo do escopo. Esse investimento cobre diagnóstico de marca, identidade visual completa, brandbook e arquivos finais em todos os formatos. Não trabalhamos com pacotes genéricos: cada proposta é desenhada para o seu negócio." },
        { id: "f3", question: "Quantas rodadas de revisão estão incluídas?", answer: "Incluímos duas rodadas de revisão por etapa criativa. Na prática, isso raramente se torna problema porque nosso processo começa com diagnóstico estratégico profundo — o que significa que chegamos à etapa criativa com direção clara e aprovada. A maioria dos clientes aprova o conceito na primeira apresentação." },
        { id: "f4", question: "Vocês trabalham com empresas que já têm marca, mas querem reposicioná-la?", answer: "Sim, e esse é um dos cenários mais comuns aqui. Fazemos auditoria completa do que existe antes de propor qualquer mudança, garantindo que o novo branding preserve o que já funciona e corrija o que limita." },
        { id: "f5", question: "O que exatamente eu recebo ao final do projeto?", answer: "Brandbook completo em PDF, arquivos em formatos editáveis (AI, EPS) e de uso imediato (PNG, SVG, PDF), paleta de cores com HEX/RGB/CMYK, guia tipográfico, diretrizes de uso e resumo estratégico de posicionamento. Tudo organizado para você ou qualquer fornecedor aplicar a marca com consistência." },
        { id: "f6", question: "Como funciona o pagamento?", answer: "50% na assinatura do contrato, 50% na entrega final. Aceitamos PIX, transferência bancária e cartão em até 3x sem juros. O cronograma de 14 dias começa após confirmação do pagamento e briefing aprovado." },
      ],
    },
  },
  {
    id: "fs-5", order: 5, name: "CTA Final", type: "cta", status: "done",
    effects: ["magnetic-button"], notes: "", agent: "web-designer",
    styles: {
      layout: "contained", alignment: "center",
      backgroundColor: "#0D0D0D", textColor: "#F0F0EB",
      accentColor: "#F5E642", headingColor: "#ffffff",
      mutedColor: "rgba(255,255,255,0.5)",
      paddingY: "xl", gap: "md", columns: 3, theme: "dark",
    },
    content: {
      eyebrow: "VAGAS LIMITADAS EM JUNHO",
      heading: "Sua marca está pronta para ser levada a sério?",
      subheading: "Poucas vagas disponíveis por mês. Trabalhamos com exclusividade.",
      body: "Marcas que lideram mercados não acontecem por acaso — elas são construídas com intenção, estratégia e craft. Se você está pronto para parar de competir por preço e começar a ser reconhecido pelo valor que realmente entrega, este é o momento.",
      primaryCta: { text: "Iniciar meu projeto agora", href: "#contato", variant: "primary" },
      secondaryCta: { text: "Ver cases de sucesso", href: "#cases", variant: "outline" },
    },
  },
];

export default function FormaStudioPreview() {
  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: "rgba(13,13,13,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(245,230,66,0.15)" }}>
        <Link href="/studio" className="flex items-center gap-2 text-sm" style={{ color: "rgba(240,240,235,0.6)" }}>
          <ArrowLeft size={14} />
          Voltar ao Studio
        </Link>
        <span className="text-xs font-mono" style={{ color: "#F5E642" }}>
          FORMA STUDIO — Preview
        </span>
        <span className="text-xs" style={{ color: "rgba(240,240,235,0.4)" }}>
          Gerado por AIOX Studio
        </span>
      </div>

      {/* Sections */}
      <div className="pt-12">
        {SECTIONS.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            isSelected={false}
            isEditMode={false}
            onSelect={() => {}}
            onContentChange={() => {}}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-10" style={{ borderTop: "1px solid rgba(245,230,66,0.1)", color: "rgba(240,240,235,0.3)" }}>
        <p className="text-xs font-mono">Gerado por AIOX Studio · Squad Web Design</p>
      </div>
    </div>
  );
}
