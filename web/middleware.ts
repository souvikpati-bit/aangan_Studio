import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifySession } from "./lib/auth";

// Every page and API route needs a login, except the login itself and the Vaani webhook
// (the webhook is protected by its own secret instead).
const PUBLIC = ["/login", "/api/login", "/api/webhooks/vaani"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  const session = await verifySession(req.cookies.get(COOKIE)?.value).catch(() => null);
  if (session) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Interior photographs under /media are public (they appear on the sign-in page), so they skip the login check.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|media/).*)"] };
