import { NextResponse } from "next/server";
import { githubSessionIdFromRequest } from "@/lib/server/githubSession";
import { deleteGithubSession } from "@/lib/server/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sessionId = githubSessionIdFromRequest(req);
  if (sessionId) await deleteGithubSession(sessionId);

  const res = NextResponse.json({ ok: true });
  for (const name of ["pullpay_gh", "pullpay_gh_session"]) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: name === "pullpay_gh_session",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
