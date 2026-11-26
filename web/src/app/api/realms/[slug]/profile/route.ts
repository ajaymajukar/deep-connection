import { NextRequest, NextResponse } from "next/server";
import {
  getRealmProfile,
  saveRealmProfile,
  getRealmMeta,
  getRealmVoiceNote,
  resolveRealmAccess,
  isValidAdminToken,
  sanitizeSlug,
} from "@/lib/realms";
import { ProfileConfig } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = sanitizeSlug(slug);
    const [profile, voiceRecord, access] = await Promise.all([
      getRealmProfile(cleanSlug),
      getRealmVoiceNote(cleanSlug),
      resolveRealmAccess(cleanSlug, {
        token:
          req.headers.get("authorization")?.replace("Bearer ", "") ||
          req.nextUrl.searchParams.get("key") ||
          req.nextUrl.searchParams.get("token"),
        unlockToken:
          req.nextUrl.searchParams.get("unlockToken") ||
          req.cookies.get(`unlocked_token_${cleanSlug}`)?.value,
        inviteToken:
          req.nextUrl.searchParams.get("invite") ||
          req.cookies.get(`invite_token_${cleanSlug}`)?.value,
      }),
    ]);

    const enrichedVoiceNote = profile.voiceNote
      ? { ...profile.voiceNote, hasAudio: Boolean(voiceRecord), durationSec: voiceRecord?.durationSec ?? profile.voiceNote.durationSec }
      : voiceRecord
      ? { enabled: true, title: `A Quick Voice Intro from ${profile.name}`, hasAudio: true, durationSec: voiceRecord.durationSec }
      : undefined;

    // Mask social URLs server-side whenever social links should stay hidden
    const sanitizeSocials = (socials?: ProfileConfig["socials"]) => {
      if (!socials || access.canViewSocials) return socials;
      const masked: Record<string, string> = {};
      for (const [k, v] of Object.entries(socials)) {
        if (typeof v === "string" && v.trim().length > 0) {
          masked[k] = "__protected__";
        }
      }
      return masked as ProfileConfig["socials"];
    };

    // Physical server-side sanitization: NEVER leak raw unblurred photo data or paths to unauthorized visitors
    if (!access.canViewPhotos) {
      const sanitizedProfile: ProfileConfig = {
        ...profile,
        voiceNote: enrichedVoiceNote,
        socials: sanitizeSocials(profile.socials),
        images: {
          ...profile.images,
          hero: `/api/realms/${cleanSlug}/image?key=hero&mode=unrevealed`,
          friendsTrip: `/api/realms/${cleanSlug}/image?key=friendsTrip&mode=unrevealed`,
          casualOutdoor: `/api/realms/${cleanSlug}/image?key=casualOutdoor&mode=unrevealed`,
          formalWaistcoat: `/api/realms/${cleanSlug}/image?key=formalWaistcoat&mode=unrevealed`,
          craftDesk: profile.images.craftDesk
            ? `/api/realms/${cleanSlug}/image?key=craftDesk&mode=unrevealed`
            : `/images/hacker-desk.jpg`,
        },
        craft: {
          ...profile.craft,
          cards: (profile.craft?.cards || []).map((card, idx) => ({
            ...card,
            image: card.image
              ? `/api/realms/${cleanSlug}/image?section=craft&cardId=${encodeURIComponent(card.id || String(idx))}&mode=unrevealed`
              : undefined,
          })),
        },
        rhythm: {
          ...profile.rhythm,
          extraCards: (profile.rhythm?.extraCards || []).map((card, idx) => ({
            ...card,
            image: `/api/realms/${cleanSlug}/image?section=rhythm&cardId=${encodeURIComponent(card.id || String(idx))}&mode=unrevealed`,
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

    // Authorized access (Admin, mutual-reveal visitor, or authorized VIP invite)
    return NextResponse.json(
      {
        ...profile,
        voiceNote: enrichedVoiceNote,
        socials: sanitizeSocials(profile.socials),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Privacy-Protection": "Authorized",
        },
      }
    );
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
    const cleanSlug = sanitizeSlug(slug);
    const meta = await getRealmMeta(cleanSlug);
    if (!meta) {
      return NextResponse.json({ error: "Realm not found" }, { status: 404 });
    }

    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.nextUrl.searchParams.get("key");

    if (!isValidAdminToken(meta, token)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = (await req.json()) as ProfileConfig;
    if (!body || !body.name) {
      return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
    }

    const success = await saveRealmProfile(cleanSlug, body);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist realm profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: body });
  } catch (error) {
    console.error("Error saving realm profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
