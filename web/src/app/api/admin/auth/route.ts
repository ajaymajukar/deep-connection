import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "admin2026";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password === ADMIN_PASS) {
      return NextResponse.json({ success: true, token: ADMIN_PASS });
    }

    return NextResponse.json({ success: false, error: "Incorrect administrative password" }, { status: 401 });
  } catch (error) {
    console.error("Error in admin auth route:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
