"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, AlertCircle } from "lucide-react";
import type { Agent } from "@/lib/squad";
import { Markdown } from "@/components/Markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  "copy-specialist":         ["Escreva a copy do hero", "Crie o texto da seção sobre", "Escreva as perguntas do FAQ"],
  "ui-developer":            ["Construa o componente Hero", "Crie a seção de projetos", "Implemente o footer"],
  "motion-engineer":         ["Adicione scroll reveal nesta seção", "Crie um background animado", "Especifique o motion language"],
  "design-reviewer":         ["Revise a página completa", "Execute o premium gate", "Verifique a consistência visual"],
  "seo-specialist":          ["Gere as meta tags", "Audite a performance", "Verifique a semântica HTML"],
  "assets-manager":          ["Otimize as imagens", "Configure as fontes", "Prepare os assets 3D"],
  "deploy-agent":            ["Configure a Vercel", "Execute o deploy", "Verifique o status do deploy"],
  "ux-researcher":           ["Busque referências para o hero", "Analise o site de referência", "Encontre componentes no 21st.dev"],
  "storytelling-specialist": ["Crie o arco narrativo", "Escreva a história de origem", "Defina a voz de marca"],
  "web-designer":            ["Defina o sistema visual", "Especifique a tipografia", "Crie o sistema de cores"],
  "reference-scout":         ["Iniciar pesquisa para novo projeto", "Mostrar gaps na base atual", "Buscar referências por nicho"],
};

const STORAGE_KEY = (id: string) => `aiox-chat-${id}`;

export function ChatConsole({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY(agent.id));
      return saved ? (JSON.parse(saved) as Message[]) : [];
    } catch { return []; }
  });

  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [streaming, setStreaming]   = useState("");
  const [configError, setConfigError] = useState("");

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const quickPrompts = QUICK_PROMPTS[agent.id] ?? [];

  // Persist messages
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(agent.id), JSON.stringify(messages)); }
    catch { /* storage quota */ }
  }, [messages, agent.id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreaming("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, agent }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const errMsg = err.error ?? `Erro ${res.status}`;
        if (res.status === 503 || res.status === 401) setConfigError(errMsg);
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${errMsg}` }]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setStreaming(full);
      }

      setMessages(prev => [...prev, { role: "assistant", content: full }]);
      setStreaming("");
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Erro de conexão. Verifique se o servidor está rodando." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setMessages([]); setConfigError(""); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}28` }}
        >
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {agent.name}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${agent.color}15`, color: agent.color }}
            >
              {agent.title}
            </span>
          </div>
          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-subtle)" }}>
            {agent.focus}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Limpar conversa"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
              style={{ color: "var(--text-subtle)" }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#7DC52B", animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-subtle)" }}>online</span>
          </div>
        </div>
      </div>

      {/* Config error banner */}
      {configError && (
        <div
          className="flex items-start gap-2 mx-5 mt-3 px-3 py-2.5 rounded-lg border text-xs"
          style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", color: "rgba(252,165,165,0.9)" }}
        >
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{configError}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center gap-5 py-8"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${agent.color}12`, border: `1px solid ${agent.color}22` }}
            >
              {agent.icon}
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                {agent.name} está pronto
              </p>
              <p className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                {agent.identity}
              </p>
            </div>
            {quickPrompts.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-subtle)" }}>
                  Ações rápidas
                </p>
                {quickPrompts.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left px-4 py-2.5 rounded-lg border text-xs transition-all duration-150"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-1)",
                      color: "var(--text-muted)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Message list */}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                  style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}
                >
                  {agent.icon}
                </div>
              )}
              <div
                className="max-w-[82%] rounded-xl px-4 py-3 text-sm"
                style={msg.role === "user"
                  ? { background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }
                  : { background: "transparent", border: "1px solid var(--border)" }
                }
              >
                {msg.role === "assistant"
                  ? <Markdown content={msg.content} />
                  : <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                }
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {streaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
              style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}25` }}
            >
              {agent.icon}
            </div>
            <div
              className="max-w-[82%] rounded-xl px-4 py-3 text-sm"
              style={{ background: "transparent", border: "1px solid var(--border)" }}
            >
              <Markdown content={streaming} />
              <span
                className="inline-block w-0.5 h-3.5 ml-0.5 rounded-sm animate-pulse"
                style={{ background: "var(--accent)", opacity: 0.7, verticalAlign: "text-bottom" }}
              />
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {loading && !streaming && (
          <div className="flex gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
              style={{ background: `${agent.color}15` }}
            >
              {agent.icon}
            </div>
            <div
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl"
              style={{ border: "1px solid var(--border)" }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--text-subtle)",
                    animation: `typing 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-5 pt-3 shrink-0 border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex gap-2 items-end rounded-xl px-3 py-2.5 transition-colors duration-200"
          style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
          onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"}
          onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Mensagem para ${agent.name}...`}
            rows={1}
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-subtle)] resize-none outline-none leading-relaxed max-h-32"
            style={{ color: "var(--text-primary)", fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30"
            style={{
              background: input.trim() && !loading ? "var(--accent)" : "var(--surface-2)",
              color: input.trim() && !loading ? "#000" : "var(--text-subtle)",
            }}
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-subtle)" }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
