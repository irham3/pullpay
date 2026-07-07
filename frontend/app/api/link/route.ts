import { NextResponse } from "next/server";
import { verifyMessage, isAddress } from "viem";
import { setMapping, getMapping } from "@/lib/server/store";

// The exact message a contributor signs to prove wallet ownership (SIWE-style, §30.5).
export function linkMessage(handle: string, address: string) {
  return `PullPay: link GitHub @${handle} to wallet ${address}`;
}

// POST /api/link — { handle, address, signature }
export async function POST(req: Request) {
  try {
    const { handle, address, signature } = await req.json();
    if (!handle || !isAddress(address) || !signature) {
      return NextResponse.json(
        { error: "handle, address and signature are required" },
        { status: 400 }
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
