import { NextRequest, NextResponse } from "next/server";
import { recordRealmDwell } from "@/lib/realms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const { dwellSeconds = {}, viewedSections = [] } = body;

    if (Object.keys(dwellSeconds).length > 0 || viewedSections.length > 0) {
      await recordRealmDwell(slug, dwellSeconds, viewedSections);
    }

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Error in realm dwell route:", error);
    return NextResponse.json({ recorded: false }, { status: 200 });
  }
}
