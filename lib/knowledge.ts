import fs from "fs";
import path from "path";
import { safeName } from "@/lib/utils";

function kbDir(): string {
  return path.join(process.env.SQUAD_PATH ?? "", "knowledge-base");
}

export interface KBFile {
  name: string;
  size: number;
  modified: string;
  preview: string;
}

export function listKBFiles(): KBFile[] {
  const dir = kbDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => !f.startsWith("."))
    .map(f => {
      const filePath = path.join(dir, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        preview: readPreview(filePath),
      };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

export function saveKBFile(name: string, content: string): string {
  const dir = kbDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safe = safeName(name);
  if (!safe) throw new Error("Nome de arquivo inválido");
  fs.writeFileSync(path.join(dir, safe), content, "utf-8");
  return safe;
}

export function deleteKBFile(name: string): void {
  const filePath = path.join(kbDir(), safeName(name));
  if (!fs.existsSync(filePath)) throw new Error("Arquivo não encontrado");
  fs.unlinkSync(filePath);
}

export function appendToKBFile(name: string, content: string): void {
  const dir = kbDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, safeName(name));
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
  fs.writeFileSync(filePath, existing + content, "utf-8");
}

export function getExistingUrls(filename: string): Set<string> {
  const filePath = path.join(kbDir(), safeName(filename));
  if (!fs.existsSync(filePath)) return new Set();
  const content = fs.readFileSync(filePath, "utf-8");
  return new Set([...content.matchAll(/https?:\/\/[^\s)]+/g)].map(m => m[0]));
}

// Returns all KB files concatenated for LLM context injection
export function getKBContext(maxBytesPerFile = 4000): string {
  const dir = kbDir();
  if (!fs.existsSync(dir)) return "";
  return fs.readdirSync(dir)
    .filter(f => !f.startsWith("."))
    .map(f => {
      const content = fs.readFileSync(path.join(dir, f), "utf-8");
      return `### Arquivo: ${f}\n${content.slice(0, maxBytesPerFile)}`;
    })
    .join("\n\n---\n\n");
}

function readPreview(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const preview = content.slice(0, 200).replace(/\n/g, " ").trim();
    return content.length > 200 ? `${preview}…` : preview;
  } catch {
    return "";
  }
}
