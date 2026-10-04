import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path = "/story", clientReferrer = null } = body;

    // Detect referrer from client JS document.referrer OR HTTP Referer header
    const headerReferer = req.headers.get("referer");
    const resolvedReferrer = clientReferrer || headerReferer || null;

    const userAgent = req.headers.get("user-agent") || null;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

    await recordVisit({
      path,
      referrer: resolvedReferrer,
      userAgent,
      ip: clientIp ? clientIp.split(",")[0].trim() : null,
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Error in tracking route:", error);
    return NextResponse.json({ recorded: false }, { status: 200 }); // Never crash client
  }
}
