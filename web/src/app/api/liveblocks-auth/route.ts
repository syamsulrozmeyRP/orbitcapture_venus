import { NextResponse } from "next/server";

export async function POST() {
  return new NextResponse("Liveblocks integration is disabled", { status: 410 });
}
