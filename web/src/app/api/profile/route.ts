import { NextRequest, NextResponse } from "next/server";
import { getActiveProfile, saveActiveProfile, ProfileConfig } from "@/lib/profile";

const ADMIN_KEY = process.env.ADMIN_SECRET || "admin2026";

export async function GET() {
  try {
    const profile = await getActiveProfile();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || req.nextUrl.searchParams.get("key");

    if (token !== ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = (await req.json()) as ProfileConfig;

    if (!body || !body.name) {
      return NextResponse.json({ error: "Invalid profile data payload" }, { status: 400 });
    }

    const success = await saveActiveProfile(body);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Profile saved successfully", profile: body });
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
