import { NextRequest, NextResponse } from "next/server";
import { recordSectionDwell } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { dwellSeconds = {}, viewedSections = [] } = body;

    if (Object.keys(dwellSeconds).length > 0 || viewedSections.length > 0) {
      await recordSectionDwell(dwellSeconds, viewedSections);
    }

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Error logging section dwell times:", error);
    return NextResponse.json({ recorded: false }, { status: 200 }); // Graceful
  }
}
