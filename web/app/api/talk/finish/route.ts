import { NextResponse } from "next/server";
import { finalizeRoom, markFinished } from "../../../../lib/talk";
import { db } from "../../../../lib/db";

export const maxDuration = 60;

// Called when the call ends, then every few seconds until Vaani has finished processing the call.
export async function POST(req: Request) {
  const { room } = await req.json().catch(() => ({}));
  if (typeof room !== "string" || !/^[\w-]{6,100}$/.test(room)) return NextResponse.json({ error: "Bad call id" }, { status: 400 });
  const known = await db().query("select 1 from pending_calls where room_name = $1", [room]);
  if (!known.rows[0]) return NextResponse.json({ error: "Unknown call" }, { status: 404 });
  await markFinished(room);
  return NextResponse.json(await finalizeRoom(room));
}
