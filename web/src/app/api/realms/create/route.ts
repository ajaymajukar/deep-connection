import { NextRequest, NextResponse } from "next/server";
import { createNewRealm } from "@/lib/realms";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, name, ownerEmail, password } = body;

    if (!slug || !name || !ownerEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide slug, name, email, and password." },
        { status: 400 }
      );
    }

    const result = await createNewRealm({
      slug,
      name,
      ownerEmail,
      password,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Realm '${result.realm?.slug}' created successfully!`,
      slug: result.realm?.slug,
    });
  } catch (error) {
    console.error("Error in realm creation route:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
