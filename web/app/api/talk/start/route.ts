import { NextResponse } from "next/server";
import { startWebSession } from "../../../../lib/vaani";
import { registerRoom } from "../../../../lib/talk";

export const maxDuration = 30;

// Starts a browser call with the agent and remembers the call id so it can be collected afterwards.
export async function POST() {
  try {
    const s = await startWebSession();
    await registerRoom(s.room, "talk");
    return NextResponse.json(s);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
