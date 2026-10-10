import { NextResponse } from "next/server";
import { getLeads } from "../../../lib/leads";

export const dynamic = "force-dynamic";

// Used by the dashboard to pick up new calls without a page reload.
export async function GET() {
  try {
    return NextResponse.json(await getLeads(), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
