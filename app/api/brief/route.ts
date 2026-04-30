import { NextRequest, NextResponse } from "next/server";
import { getBriefs, saveBrief, deleteBrief } from "@/lib/squad";

export async function GET() {
  try {
    return NextResponse.json({ briefs: getBriefs() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, content } = await req.json();
    saveBrief(name, content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
    deleteBrief(name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
