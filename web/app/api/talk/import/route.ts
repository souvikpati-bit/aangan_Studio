import { NextResponse } from "next/server";
import { finalizeRoom, markFinished, registerRoom } from "../../../../lib/talk";

export const maxDuration = 60;

// For a call made inside Vaani's own dashboard: paste its Session ID (History page, copy button) to pull it in.
export async function POST(req: Request) {
  const { callId } = await req.json().catch(() => ({}));
  const id = typeof callId === "string" ? callId.trim() : "";
  if (!/^[\w-]{8,100}$/.test(id)) return NextResponse.json({ error: "That does not look like a Vaani call id" }, { status: 400 });
  await registerRoom(id, "import");
  await markFinished(id);
  return NextResponse.json(await finalizeRoom(id));
}
