import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ActivityEntry {
  id: string;
  ts: string;
  type: string;
  message: string;
  meta?: Record<string, string>;
}

const DATA_DIR = process.env.SQUAD_PATH
  ? path.join(process.env.SQUAD_PATH, "activity")
  : path.join(process.cwd(), "data", "activity");
const GLOBAL_FILE = path.join(DATA_DIR, "global.json");
const MAX_ENTRIES = 200;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readEntries(filePath: string): ActivityEntry[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ActivityEntry[];
  } catch { return []; }
}

function writeEntries(filePath: string, entries: ActivityEntry[]) {
  fs.writeFileSync(filePath, JSON.stringify(entries.slice(0, MAX_ENTRIES), null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    ensureDir();
    const projectKey = req.nextUrl.searchParams.get("project");
    const filePath = projectKey
      ? path.join(DATA_DIR, `${projectKey.replace(/[^a-z0-9-_]/gi, "_")}.json`)
      : GLOBAL_FILE;
    return NextResponse.json({ entries: readEntries(filePath) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureDir();
    const body = await req.json() as { entry: Omit<ActivityEntry, "id" | "ts">; projectKey?: string };
    const { entry, projectKey } = body;

    const newEntry: ActivityEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
    };

    // Write to project-specific file
    if (projectKey) {
      const projFile = path.join(DATA_DIR, `${projectKey.replace(/[^a-z0-9-_]/gi, "_")}.json`);
      const existing = readEntries(projFile);
      writeEntries(projFile, [newEntry, ...existing]);
    }

    // Always write to global
    const global = readEntries(GLOBAL_FILE);
    writeEntries(GLOBAL_FILE, [newEntry, ...global]);

    return NextResponse.json({ ok: true, entry: newEntry });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
