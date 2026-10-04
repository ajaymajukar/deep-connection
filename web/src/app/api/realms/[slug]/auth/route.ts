import { NextRequest, NextResponse } from "next/server";
import { getRealmMeta } from "@/lib/realms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { password } = await req.json();

    const realm = await getRealmMeta(slug);
    if (!realm) {
      return NextResponse.json({ success: false, error: "Realm does not exist." }, { status: 404 });
    }

    if (password === realm.password) {
      return NextResponse.json({
        success: true,
        token: `auth_${realm.slug}_${Buffer.from(realm.password).toString("base64")}`,
        slug: realm.slug,
        ownerName: realm.name,
      });
    }

    return NextResponse.json({ success: false, error: "Incorrect administrative password." }, { status: 401 });
  } catch (error) {
    console.error("Error in realm auth route:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
