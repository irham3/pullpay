import { NextResponse } from "next/server";
import { verifyMessage, isAddress } from "viem";
import { setMapping, getMapping } from "@/lib/server/store";
import { githubSessionFromRequest } from "@/lib/server/githubSession";

// The exact message a contributor signs to prove wallet ownership (SIWE-style, §30.5).
export function linkMessage(handle: string, address: string) {
  return `PullPay: link GitHub @${handle} to wallet ${address}`;
}

// POST /api/link — { handle, address, signature }
// Two proofs are required, one per side of the mapping:
//  1. a GitHub OAuth session whose login matches the handle (proves the handle),
//  2. a wallet signature over the link message (proves the address).
// Without (1), anyone could map someone else's handle to their own wallet and
// silently receive that person's payouts.
export async function POST(req: Request) {
  try {
    const { handle, address, signature } = await req.json();
    if (!handle || !isAddress(address) || !signature) {
      return NextResponse.json(
        { error: "handle, address and signature are required" },
        { status: 400 }
      );
    }

    const session = await githubSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: "verify with GitHub first — connect GitHub, then link" },
        { status: 401 }
      );
    }
    if (session.login.toLowerCase() !== String(handle).toLowerCase()) {
      return NextResponse.json(
        { error: `signed in as @${session.login}, not @${handle}` },
        { status: 403 }
      );
    }

    const valid = await verifyMessage({
      address,
      message: linkMessage(handle, address),
      signature,
    });
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    await setMapping(handle, address);
    return NextResponse.json({ ok: true, handle, address });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "link failed" },
      { status: 400 }
    );
  }
}

// GET /api/link?handle=octocat — resolve a mapping.
export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle");
  if (!handle)
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  const address = await getMapping(handle);
  return NextResponse.json({ handle, address });
}
