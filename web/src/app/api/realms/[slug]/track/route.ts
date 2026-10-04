import { NextRequest, NextResponse } from "next/server";
import { recordRealmVisit } from "@/lib/realms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const { path = `/${slug}/story`, clientReferrer = null } = body;

    const headerReferer = req.headers.get("referer");
    const resolvedReferrer = clientReferrer || headerReferer || null;

    const userAgent = req.headers.get("user-agent") || null;
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

    await recordRealmVisit(slug, {
      path,
      referrer: resolvedReferrer,
      userAgent,
      ip: clientIp ? clientIp.split(",")[0].trim() : null,
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Error in realm track route:", error);
    return NextResponse.json({ recorded: false }, { status: 200 });
  }
}
