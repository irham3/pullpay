import { NextResponse } from "next/server";
import { settleReward } from "@/lib/server/settle";

// POST /api/settle — called by pullpay.yml after a PR merges (PRD §8.3, §32).
// Thin wrapper over the shared settle logic (also used by the GitHub App webhook).
export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-pullpay-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const result = await settleReward({
    rewardId: body.rewardId as `0x${string}`,
    repo: String(body.repo || ""),
    pr: Number(body.pr),
    issue: Number(body.issue),
    author: body.author as string | undefined,
    contributor: body.contributor as string | undefined,
  });

  return NextResponse.json(result.body, { status: result.status });
}
