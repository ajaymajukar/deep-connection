import { NextRequest, NextResponse } from "next/server";
import { getRealmMeta, getRealmSmtp, saveRealmSmtp, DEFAULT_REALM_SLUG } from "@/lib/realms";

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

    if (slug === DEFAULT_REALM_SLUG) {
      return NextResponse.json({
        isMasterAjay: true,
        email: process.env.NOTIFICATION_TO || process.env.SMTP_USER || "",
        enabled: true,
        isConfigured: true,
      });
    }

    const smtp = await getRealmSmtp(slug);
    return NextResponse.json({
      isMasterAjay: false,
      email: smtp?.email || "",
      enabled: smtp?.enabled ?? false,
      isConfigured: Boolean(smtp?.appPassword),
    });
  } catch (error) {
    console.error("Error loading SMTP config:", error);
    return NextResponse.json({ error: "Failed to load SMTP settings" }, { status: 500 });
  }
}

export async function POST(
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

    if (slug === DEFAULT_REALM_SLUG) {
      return NextResponse.json(
        { error: "Ajay's realm uses master server environment variables." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email, appPassword, enabled } = body;

    const existing = await getRealmSmtp(slug);
    const finalPassword = appPassword ? appPassword.replace(/\s+/g, "") : existing?.appPassword || "";

    const success = await saveRealmSmtp(slug, {
      email: (email || meta.ownerEmail).trim().toLowerCase(),
      appPassword: finalPassword,
      enabled: Boolean(enabled),
    });

    if (!success) {
      return NextResponse.json({ error: "Failed to persist SMTP settings" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: (email || meta.ownerEmail).trim().toLowerCase(),
      enabled: Boolean(enabled),
      isConfigured: Boolean(finalPassword),
    });
  } catch (error) {
    console.error("Error saving SMTP config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
