import { NextRequest, NextResponse } from "next/server";
import { getBriefs, saveBrief } from "@/lib/squad";

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
