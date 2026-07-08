import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Kick off GitHub App user authorization → returns to /api/github/callback.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/contributor?gh=unconfigured", origin));
  }
  const redirectUri = `${origin}/api/github/callback`;
  const authorize = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  return NextResponse.redirect(authorize);
}
