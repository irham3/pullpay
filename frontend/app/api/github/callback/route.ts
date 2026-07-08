import { NextResponse } from "next/server";

export const runtime = "nodejs";

// GitHub App user-authorization callback (PRD §30.5). Exchanges the code for the
// user's GitHub login and drops it in a cookie so the contributor's wallet link
// is bound to a *verified* GitHub identity (not just a typed username).
// Also supports the maintainer /create flow — `state` carries the return path.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  // Where to return after auth (carried via `state`); default the contributor view.
  const rawNext = url.searchParams.get("state") || "/contributor";
  const next = rawNext.startsWith("/") ? rawNext : "/contributor";

  if (!code) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}gh=unconfigured`, origin));
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) {
      return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}gh=error`, origin));
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "PullPay",
      },
    });
    const user = (await userRes.json()) as { login?: string };
    if (!user.login) {
      return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}gh=error`, origin));
    }

    // Append gh=<login> to the return URL so the page knows who connected.
    const returnUrl = `${next}${next.includes("?") ? "&" : "?"}gh=${encodeURIComponent(user.login)}`;
    const res = NextResponse.redirect(new URL(returnUrl, origin));
    // Non-httpOnly so the client can read the GitHub handle; short-lived.
    res.cookies.set("pullpay_gh", user.login, {
      path: "/",
      maxAge: 3600,
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}gh=error`, origin));
  }
}
