import { NextRequest, NextResponse } from "next/server";
import { getRealmMeta, deleteRealm } from "@/lib/realms";

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

    // Allow deleting if authenticated via token, password, or master key
    if (token !== expectedToken && token !== meta.password && token !== legacyKey) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const success = await deleteRealm(slug);
    if (!success) {
      return NextResponse.json({ error: "Failed to erase realm from database" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Realm '/${slug}' and all associated data have been permanently erased.`,
    });
  } catch (error) {
    console.error("Error deleting realm:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
