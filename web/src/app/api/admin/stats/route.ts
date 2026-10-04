import { NextRequest, NextResponse } from "next/server";
import { getComprehensiveAnalytics, formatDataForLLM } from "@/lib/redis";

const ADMIN_KEY = process.env.ADMIN_SECRET || "admin2026";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const key = authHeader?.replace("Bearer ", "") || req.nextUrl.searchParams.get("key");

  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const analytics = await getComprehensiveAnalytics();
  const llmPrompt = formatDataForLLM(analytics);

  return NextResponse.json({
    ...analytics,
    llmPrompt,
  });
}
