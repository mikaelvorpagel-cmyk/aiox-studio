"use client";

import { motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { AlertCircle, Star, Zap, ArrowRight, CheckCircle2, Clock, Terminal } from "lucide-react";

const PRIORITY_1 = [
  {
    id: 1,
    title: "Output invisível",
    desc: "Não existe nenhuma área na interface que mostre o que os agentes estão gerando. Após salvar o brief, o usuário não sabe o que acontece.",
    fix: "Painel de log de atividade dos agentes em tempo real, file tree dos arquivos gerados e/ou iframe com preview do localhost do projeto.",
  },
  {
    id: 2,
    title: "Transição Brief → Agente opaca",
    desc: "A interface não explica como o brief alimenta os agentes. Não há indicação de que os agentes já têm contexto do projeto.",
    fix: "Badge 'brief ativo' no sidebar com nome do projeto e confirmação visual na página de agentes de que o contexto está carregado.",
  },
  {
    id: 3,
    title: "Ordem dos agentes errada",
    desc: "Os cards em /agents estão em ordem aleatória, sem indicação de sequência de uso.",
    fix: "Reorganizar na sequência correta: Vex → Reva → Saga → Copy → Dev → Motion → Assets → SEO → Review → Deploy. Adicionar numeração ou label de fase.",
  },
];

const PRIORITY_2 = [
  {
    id: 4,
    title: "Scout → Brief desconectados",
    desc: "Quando o Scout retorna referências de um nicho, o usuário precisa copiar manualmente para o Brief.",
    fix: "Botão 'Usar no Brief' que pré-preenche campos de referências visuais e estética com os dados do Scout.",
  },
  {
    id: 5,
    title: "Motion tab sem preview",
    desc: "Os efeitos (Shader background, Magnetic button, Noise texture) são checkboxes sem nenhuma visualização.",
    fix: "Tooltip ou preview visual/gif de cada efeito ao hover.",
  },
  {
    id: 6,
    title: "Métricas ao Vivo — estado vazio sem orientação",
    desc: "O tab abre vazio sem conectar ao aviso de integrações pendentes no dashboard.",
    fix: "CTA direto para /configurações quando API não está configurada, com mockup de como os dados aparecerão.",
  },
  {
    id: 7,
    title: "Histórico de briefs inacessível",
    desc: "O botão 'Briefs salvos' só existe dentro do Brief. Sem acesso rápido para trabalho com múltiplos clientes.",
    fix: "Acesso no sidebar e no dashboard com lista de projetos e navegação direta entre eles.",
  },
];

const PRIORITY_3 = [
  {
    id: 8,
    title: "Checklist estática",
    desc: "Os itens do checklist não têm conexão com os agentes.",
    fix: "Ao marcar um item, sugerir o comando do agente correspondente — ex: 'Scroll reveal animado' exibe sugestão @motion *add-scroll-animation.",
  },
  {
    id: 9,
    title: "Deploy sem tela própria",
    desc: "Deploy é apenas um card em /agents como qualquer outro, sem visibilidade de status ou staging.",
    fix: "Página /deploy dedicada com status, URL de staging, variáveis de ambiente e histórico de deploys.",
  },
  {
    id: 10,
    title: "Estado do projeto no sidebar",
    desc: "O sidebar só tem navegação, sem contexto do projeto ativo.",
    fix: "Indicador do projeto ativo abaixo do logo — nome do cliente, nicho e etapa atual do fluxo.",
  },
];

const UX = [
  "Vex tem 11 comandos e é o agente mais poderoso — dar destaque visual diferenciado (borda, badge ou tamanho maior no card)",
  "Brief tab 'Revisão' mostra traços (—) para campos vazios — substituir por estado vazio com instrução clara",
  "Dashboard com '0 briefs' sem CTA — adicionar botão primário 'Criar primeiro brief'",
  "Integrações pendentes no dashboard — adicionar descrição do impacto de cada integração ausente",
];

const PROMPT = `Você é um consultor sênior de produto e engenharia trabalhando no AIOX Studio —
uma aplicação web (Next.js + TypeScript) que serve como cockpit de direção criativa
para criação de sites sofisticados com agentes de IA especializados.

Analise toda a estrutura de arquivos do projeto. Execute todas as melhorias
de forma autônoma, na ordem de prioridade (1 → 2 → 3 → UX), sem pedir
confirmação em nenhuma etapa. Leia os arquivos antes de editar. Prefira
editar arquivos existentes a criar novos. Mantenha os padrões visuais
atuais (dark theme, accent verde #00E676, tipografia existente).
Após concluir todas as melhorias, gere um resumo do que foi alterado
com os arquivos modificados listados.`;

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

function PriorityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color, background: `${color}12` }}
    >
      {label}
    </span>
  );
}

function IssueCard({
  item,
  priority,
  accent,
  index,
}: {
  item: { id: number; title: string; desc: string; fix: string };
  priority: string;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      variants={fade}
      initial="hidden"
      animate="show"
      custom={index}
      className="rounded-xl border p-5 flex flex-col gap-3"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: `${accent}20`, color: accent }}
          >
            {item.id}
          </span>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </h3>
        </div>
        <PriorityBadge label={priority} color={accent} />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {item.desc}
      </p>
      <div
        className="flex items-start gap-2 rounded-lg px-3 py-2.5"
        style={{ background: `${accent}08`, borderLeft: `2px solid ${accent}` }}
      >
        <ArrowRight size={11} className="shrink-0 mt-0.5" style={{ color: accent }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {item.fix}
        </p>
      </div>
    </motion.div>
  );
}

export default function RoadmapPage() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: "var(--sidebar-w)", padding: "2.5rem 2rem" }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--accent)", opacity: 0.7 }}>
                Análise de produto
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Roadmap de Melhorias
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              10 problemas identificados · 4 melhorias de UX · ordenados por impacto
            </p>
          </motion.div>

          {/* Priority 1 */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={14} style={{ color: "#F87171" }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#F87171" }}>
                Prioridade 1 — Críticos
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {PRIORITY_1.map((item, i) => (
                <IssueCard key={item.id} item={item} priority="P1" accent="#F87171" index={i} />
              ))}
            </div>
          </section>

          {/* Priority 2 */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} style={{ color: "#F59E0B" }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#F59E0B" }}>
                Prioridade 2 — Importantes
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {PRIORITY_2.map((item, i) => (
                <IssueCard key={item.id} item={item} priority="P2" accent="#F59E0B" index={i + 3} />
              ))}
            </div>
          </section>

          {/* Priority 3 */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} style={{ color: "#60A5FA" }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#60A5FA" }}>
                Prioridade 3 — Melhorias
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {PRIORITY_3.map((item, i) => (
                <IssueCard key={item.id} item={item} priority="P3" accent="#60A5FA" index={i + 7} />
              ))}
            </div>
          </section>

          {/* UX */}
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} style={{ color: "#A78BFA" }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A78BFA" }}>
                Melhorias de UX
              </h2>
            </div>
            <div
              className="rounded-xl border p-5 flex flex-col gap-3"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {UX.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fade}
                  initial="hidden"
                  animate="show"
                  custom={i + 10}
                  className="flex items-start gap-2.5"
                >
                  <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: "#A78BFA" }} />
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Prompt */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Terminal size={14} style={{ color: "var(--accent)" }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                Prompt para execução autônoma
              </h2>
            </div>
            <div
              className="rounded-xl border p-5"
              style={{
                background: "rgba(0,230,118,0.03)",
                borderColor: "rgba(0,230,118,0.15)",
              }}
            >
              <pre
                className="text-xs leading-relaxed whitespace-pre-wrap font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {PROMPT}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(PROMPT)}
                className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  color: "var(--accent)",
                  borderColor: "rgba(0,230,118,0.2)",
                  background: "rgba(0,230,118,0.05)",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,230,118,0.1)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,230,118,0.05)"}
              >
                <Terminal size={10} />
                Copiar prompt
              </button>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
