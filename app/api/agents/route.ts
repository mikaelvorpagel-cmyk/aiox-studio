import { NextResponse } from "next/server";
import { getAgents, getProjectContext, getBriefs, validateConfig } from "@/lib/squad";

export async function GET() {
  const config = validateConfig();
  if (!config.ok) {
    return NextResponse.json({ error: config.error, agents: [], context: "", briefs: [] }, { status: 503 });
  }
  try {
    const agents = getAgents();
    const context = getProjectContext();
    const briefs = getBriefs();
    return NextResponse.json({ agents, context, briefs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
