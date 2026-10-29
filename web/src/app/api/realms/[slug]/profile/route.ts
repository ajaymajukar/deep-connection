import { NextRequest, NextResponse } from "next/server";
import { getRealmProfile, saveRealmProfile, getRealmMeta } from "@/lib/realms";
import { ProfileConfig } from "@/lib/profile";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const profile = await getRealmProfile(slug);
    const meta = await getRealmMeta(slug);

    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.nextUrl.searchParams.get("key") ||
      req.nextUrl.searchParams.get("unlockToken") ||
      req.cookies.get(`unlocked_token_${slug}`)?.value;

    let isAuthorized = false;
    if (meta && token) {
      const expectedAdminToken = `auth_${meta.slug}_${Buffer.from(meta.password).toString("base64")}`;
      const legacyKey = process.env.ADMIN_SECRET || "admin2026";

      if (token === expectedAdminToken || token === meta.password || token === legacyKey) {
        isAuthorized = true;
      } else {
        const unlockRecord = await redis.get(`realm:${slug}:unlocked:${token}`);
        if (unlockRecord) {
          isAuthorized = true;
        }
      }
    }

    // Physical server-side sanitization: NEVER leak raw unblurred photo data or paths to unauthorized visitors
    if (!isAuthorized) {
      const sanitizedProfile: ProfileConfig = {
        ...profile,
        images: {
          ...profile.images,
          hero: `/api/realms/${slug}/image?key=hero&mode=unrevealed`,
          friendsTrip: `/api/realms/${slug}/image?key=friendsTrip&mode=unrevealed`,
          casualOutdoor: `/api/realms/${slug}/image?key=casualOutdoor&mode=unrevealed`,
          formalWaistcoat: `/api/realms/${slug}/image?key=formalWaistcoat&mode=unrevealed`,
          craftDesk: profile.images.craftDesk
            ? `/api/realms/${slug}/image?key=craftDesk&mode=unrevealed`
            : `/images/hacker-desk.jpg`,
        },
        craft: {
          ...profile.craft,
          cards: (profile.craft?.cards || []).map((card, idx) => ({
            ...card,
            image: card.image
              ? `/api/realms/${slug}/image?section=craft&cardId=${encodeURIComponent(card.id || String(idx))}&mode=unrevealed`
              : undefined,
          })),
        },
        rhythm: {
          ...profile.rhythm,
          extraCards: (profile.rhythm?.extraCards || []).map((card, idx) => ({
            ...card,
            image: `/api/realms/${slug}/image?section=rhythm&cardId=${encodeURIComponent(card.id || String(idx))}&mode=unrevealed`,
          })),
        },
      };

      return NextResponse.json(sanitizedProfile, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Privacy-Protection": "Server-Side Sanitized",
        },
      });
    }

    // Authorized access (Admin or visitor with verified reciprocal unlock token)
    return NextResponse.json(profile, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Privacy-Protection": "Authorized",
      },
    });
  } catch (error) {
    console.error("Error fetching realm profile:", error);
    return NextResponse.json({ error: "Failed to fetch realm profile" }, { status: 500 });
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

    const body = (await req.json()) as ProfileConfig;
    if (!body || !body.name) {
      return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
    }

    const success = await saveRealmProfile(slug, body);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist realm profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: body });
  } catch (error) {
    console.error("Error saving realm profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
