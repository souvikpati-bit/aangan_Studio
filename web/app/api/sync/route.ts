import { NextResponse } from "next/server";
import { syncPending } from "../../../lib/talk";

export const maxDuration = 60;

// Collects any calls that ended without their page staying open. Called by the dashboard in the background.
export async function POST() {
  try {
    return NextResponse.json(await syncPending());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
