import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Kick off GitHub App user authorization → returns to /api/github/callback.
// `?next=` is carried through `state` so we can return to /create or /contributor.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const next = url.searchParams.get("next") || "/contributor";
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/contributor?gh=unconfigured", origin));
  }
  const redirectUri = `${origin}/api/github/callback`;
  const authorize =
    `https://github.com/login/oauth/authorize?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(next)}`;
  return NextResponse.redirect(authorize);
}
