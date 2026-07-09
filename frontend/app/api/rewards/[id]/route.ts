import { NextResponse } from "next/server";
import { getStoredReward } from "@/lib/server/store";

export const runtime = "nodejs";

// GET /api/rewards/:id — shared metadata + soft status for a single reward, so
// the detail page shows the right title/status to any visitor, not only the
// browser that created it.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  try {
    const reward = await getStoredReward(id);
    return NextResponse.json({ reward: reward ?? null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "read failed", reward: null },
      { status: 500 }
    );
  }
}
