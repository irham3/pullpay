import { NextResponse } from "next/server";
import { settleReward } from "@/lib/server/settle";

// POST /api/settle — called by the GitHub App webhook after a PR merges (PRD §8.3, §32)
// and by the maintainer UI ("Settle from PR"). Triggering a settle is safe to
// leave open: the payout target is derived server-side from the real PR author's
// verified wallet mapping. Only callers presenting the shared secret are
// "trusted" and may override the contributor address.
export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const trusted = Boolean(
    secret && req.headers.get("x-pullpay-secret") === secret
  );

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
    // Ignored unless trusted — an open caller must never steer the payout.
    contributor: trusted ? (body.contributor as string | undefined) : undefined,
    trusted,
  });

  return NextResponse.json(result.body, { status: result.status });
}
