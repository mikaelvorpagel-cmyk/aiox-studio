import { NextRequest, NextResponse } from "next/server";
import { listKBFiles, saveKBFile, deleteKBFile } from "@/lib/knowledge";

export async function GET() {
  try {
    return NextResponse.json({ files: listKBFiles() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, content } = await req.json();
    if (!name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "name e content são obrigatórios" }, { status: 400 });
    }
    const saved = saveKBFile(name, content);
    return NextResponse.json({ ok: true, name: saved });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
    }
    deleteKBFile(name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = String(e);
    const status = msg.includes("não encontrado") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
