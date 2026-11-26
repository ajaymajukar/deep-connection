import { NextRequest, NextResponse } from "next/server";
import {
  getRealmMeta,
  getRealmProfile,
  saveRealmProfile,
  getRealmVoiceNote,
  saveRealmVoiceNote,
  deleteRealmVoiceNote,
  isValidAdminToken,
  resolveRealmAccess,
  sanitizeSlug,
} from "@/lib/realms";

export const dynamic = "force-dynamic";

function extractToken(req: NextRequest): string | null {
  return (
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key") ||
    req.nextUrl.searchParams.get("token")
  );
}

/**
 * Stream the realm's voice note audio with full HTTP Range support for mobile Safari/Chrome.
 */
export async function GET(
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

    const profile = await getRealmProfile(cleanSlug);
    if (profile.voiceNote?.enabled === false) {
      return NextResponse.json({ error: "Voice intro disabled" }, { status: 403 });
    }

    if (profile.voiceNote?.requireUnlock) {
      const access = await resolveRealmAccess(cleanSlug, {
        token: extractToken(req),
        unlockToken:
          req.nextUrl.searchParams.get("unlockToken") ||
          req.cookies.get(`unlocked_token_${cleanSlug}`)?.value,
        inviteToken:
          req.nextUrl.searchParams.get("invite") ||
          req.cookies.get(`invite_token_${cleanSlug}`)?.value,
      });

      if (!access.canViewPhotos) {
        return NextResponse.json({ error: "Complete mutual reveal to listen" }, { status: 403 });
      }
    }

    const record = await getRealmVoiceNote(cleanSlug);
    if (!record || !record.dataUrl) {
      return NextResponse.json({ error: "No voice note recorded yet" }, { status: 404 });
    }

    const match = record.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid audio format" }, { status: 500 });
    }

    const mimeType = record.mimeType || match[1] || "audio/webm";
    const audioBuffer = Buffer.from(match[2], "base64");
    const total = audioBuffer.length;
    const rangeHeader = req.headers.get("range");

    // Support byte-range requests (critical for iOS Safari <audio> playback & scrubbing)
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? Math.min(parseInt(parts[1], 10), total - 1) : total - 1;

      if (start >= total || end < start) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }

      const chunk = audioBuffer.subarray(start, end + 1);
      return new NextResponse(chunk as unknown as BodyInit, {
        status: 206,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(chunk.length),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(total),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Failed to stream voice note:", error);
    return NextResponse.json({ error: "Failed to load audio" }, { status: 500 });
  }
}

/**
 * Save uploaded or browser-recorded audio note + metadata (Admin only).
 */
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

    if (!isValidAdminToken(meta, extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { dataUrl, mimeType, durationSec, title, subtitle, transcript, requireUnlock, enabled } = body;

    if (dataUrl) {
      if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:audio/") && !dataUrl.startsWith("data:video/webm")) {
        return NextResponse.json({ error: "Invalid audio payload format." }, { status: 400 });
      }
      if (dataUrl.length > 4_000_000) {
        return NextResponse.json(
          { error: "Audio recording exceeds 3MB limit. Keep voice intro concise (under 60s)." },
          { status: 413 }
        );
      }

      const savedAudio = await saveRealmVoiceNote(cleanSlug, {
        dataUrl,
        mimeType: mimeType || "audio/webm",
        durationSec: typeof durationSec === "number" ? Math.round(durationSec) : undefined,
        updatedAt: new Date().toISOString(),
      });

      if (!savedAudio) {
        return NextResponse.json({ error: "Failed to store audio note." }, { status: 500 });
      }
    }

    const profile = await getRealmProfile(cleanSlug);
    const existingVoice = await getRealmVoiceNote(cleanSlug);

    profile.voiceNote = {
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      title: typeof title === "string" && title.trim() ? title.trim() : profile.voiceNote?.title || `A Quick Voice Intro from ${profile.name}`,
      subtitle: typeof subtitle === "string" ? subtitle.trim() : profile.voiceNote?.subtitle,
      durationSec: typeof durationSec === "number" ? Math.round(durationSec) : existingVoice?.durationSec ?? profile.voiceNote?.durationSec,
      transcript: typeof transcript === "string" ? transcript.trim() : profile.voiceNote?.transcript,
      requireUnlock: requireUnlock !== undefined ? Boolean(requireUnlock) : Boolean(profile.voiceNote?.requireUnlock),
      hasAudio: Boolean(existingVoice),
    };

    await saveRealmProfile(cleanSlug, profile);

    return NextResponse.json({
      success: true,
      voiceNote: profile.voiceNote,
    });
  } catch (error) {
    console.error("Failed to save voice note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Delete the realm's voice note (Admin only).
 */
export async function DELETE(
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

    if (!isValidAdminToken(meta, extractToken(req))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await deleteRealmVoiceNote(cleanSlug);
    const profile = await getRealmProfile(cleanSlug);
    if (profile.voiceNote) {
      profile.voiceNote = { ...profile.voiceNote, hasAudio: false, durationSec: undefined };
      await saveRealmProfile(cleanSlug, profile);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete voice note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
