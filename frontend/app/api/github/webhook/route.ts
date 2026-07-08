import { NextResponse } from "next/server";
import crypto from "crypto";
import { formatUnits } from "viem";
import { settleReward } from "@/lib/server/settle";
import { comment, setPrStatus } from "@/lib/server/githubApp";
import {
  getRewardForIssue,
  setRewardForIssue,
  setInstallation,
} from "@/lib/server/store";
import { readReward, findRewardIdForIssue } from "@/lib/server/relayer";
import { USDC_DECIMALS } from "@/lib/contracts/addresses";

// Resolve the rewardId for a repo+issue: cache first, else scan on-chain + cache.
async function resolveRewardId(
  repo: string,
  issue: number
): Promise<`0x${string}` | null> {
  const cached = (await getRewardForIssue(repo, issue)) as `0x${string}` | null;
  if (cached) return cached;
  const found = await findRewardIdForIssue(repo, issue);
  if (found) await setRewardForIssue(repo, issue, found);
  return found;
}

export const runtime = "nodejs";

// Verify the HMAC-SHA256 signature GitHub sends (x-hub-signature-256).
function verifySignature(raw: string, sig: string | null, secret: string): boolean {
  if (!sig) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Pull the closed issue number from a PR body/title ("closes #123").
function closingIssue(text: string): number | null {
  const m = /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i.exec(text || "");
  return m ? Number(m[1]) : null;
}

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const raw = await req.text();

  if (!secret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
  }
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(raw);

  try {
    // --- Installation lifecycle: remember installation id per account owner ---
    if (event === "installation" || event === "installation_repositories") {
      const owner = payload.installation?.account?.login;
      const id = payload.installation?.id;
      if (owner && id) await setInstallation(owner, id);
      return NextResponse.json({ ok: true, handled: "installation" });
    }

    // --- Pull request events ---
    if (event === "pull_request") {
      const pr = payload.pull_request;
      const repo = payload.repository?.full_name as string;
      const action = payload.action as string;
      const issue = closingIssue(`${pr?.title}\n${pr?.body}`);
      if (!repo || !issue) {
        return NextResponse.json({ ok: true, note: "no linked issue" });
      }

      const rewardId = await resolveRewardId(repo, issue);
      if (!rewardId) {
        return NextResponse.json({ ok: true, note: "no reward for issue" });
      }

      // PR opened → announce the bounty + pending check.
      if (action === "opened" || action === "reopened") {
        const reward = await readReward(rewardId);
        const amt = Number(formatUnits(reward.amount, USDC_DECIMALS));
        await comment(
          repo,
          pr.number,
          `💰 This PR is linked to a **${amt} USDC** PullPay bounty on issue #${issue}. On merge, the reward settles automatically.`
        );
        await setPrStatus(repo, pr.head.sha, "pending", `Bounty: ${amt} USDC — pays on merge`);
        return NextResponse.json({ ok: true, handled: "pr.opened" });
      }

      // PR merged → settle + report.
      if (action === "closed" && pr.merged) {
        const result = await settleReward({
          rewardId,
          repo,
          pr: pr.number,
          issue,
          author: pr.user?.login,
        });
        if (result.body.ok) {
          const action2 = result.body.action;
          const msg =
            action2 === "settleInstant"
              ? `✅ Paid! USDC released to the contributor. tx: \`${result.body.txHash}\``
              : `🟣 Verifying via UMA — payout after the challenge window. tx: \`${result.body.txHash}\``;
          await comment(repo, pr.number, msg);
          await setPrStatus(
            repo,
            pr.head.sha,
            action2 === "settleInstant" ? "success" : "pending",
            action2 === "settleInstant" ? "Bounty paid" : "Bounty verifying"
          );
        } else {
          await comment(
            repo,
            pr.number,
            `⚠️ PullPay could not settle automatically: ${result.body.error}${
              result.body.hint ? ` (${result.body.hint})` : ""
            }`
          );
        }
        return NextResponse.json(result.body, { status: result.status });
      }
    }

    return NextResponse.json({ ok: true, ignored: event });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "webhook error" },
      { status: 500 }
    );
  }
}
