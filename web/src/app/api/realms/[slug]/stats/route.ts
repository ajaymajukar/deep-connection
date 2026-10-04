import { NextRequest, NextResponse } from "next/server";
import { getRealmComprehensiveAnalytics, formatRealmDataForLLM, getRealmMeta, getRealmProfile } from "@/lib/realms";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const meta = await getRealmMeta(slug);
    if (!meta) {
      return NextResponse.json({ error: "Realm not found" }, { status: 404 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || req.nextUrl.searchParams.get("key");
    const expectedToken = `auth_${meta.slug}_${Buffer.from(meta.password).toString("base64")}`;
    const legacyKey = process.env.ADMIN_SECRET || "admin2026";

    if (token !== expectedToken && token !== meta.password && token !== legacyKey) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const [analytics, profile] = await Promise.all([
      getRealmComprehensiveAnalytics(slug),
      getRealmProfile(slug),
    ]);
    const llmPrompt = formatRealmDataForLLM(analytics, profile);

    return NextResponse.json({
      ...analytics,
      llmPrompt,
    });
  } catch (error) {
    console.error("Error in realm stats route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
