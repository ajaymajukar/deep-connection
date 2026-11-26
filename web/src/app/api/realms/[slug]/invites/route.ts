import { NextRequest, NextResponse } from "next/server";
import {
  getRealmMeta,
  getRealmPrivateAlbum,
  createVipInvite,
  getVipInviteByToken,
  listVipInvites,
  revokeVipInvite,
  recordVipInviteOpen,
  issueVisitorUnlockToken,
  isValidAdminToken,
  sanitizeSlug,
  PrivateAlbumItem,
} from "@/lib/realms";

export const dynamic = "force-dynamic";

function extractAdminToken(req: NextRequest): string | null {
  return (
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.nextUrl.searchParams.get("key")
  );
}

/**
 * Validate a visitor's VIP invite token (?token=...) OR list all invites (admin ?key=...).
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
      return NextResponse.json({ success: false, error: "Realm not found" }, { status: 404 });
    }

    const inviteToken = req.nextUrl.searchParams.get("token");
    if (inviteToken) {
      const peek = req.nextUrl.searchParams.get("peek") === "true";
      const invite = peek
        ? await getVipInviteByToken(cleanSlug, inviteToken)
        : await recordVipInviteOpen(cleanSlug, inviteToken);

      if (!invite) {
        return NextResponse.json(
          { success: false, valid: false, error: "This invitation link is invalid, revoked, or expired." },
          { status: 404 }
        );
      }

      let unlockToken: string | undefined;
      let albumPhotos: PrivateAlbumItem[] = [];

      if (invite.unlockPhotos) {
        unlockToken = await issueVisitorUnlockToken(cleanSlug, {
          name: invite.guestName,
          inviteToken: invite.token,
          unlockSocials: invite.unlockSocials,
        });
        const album = await getRealmPrivateAlbum(cleanSlug);
        if (album && album.enabled && Array.isArray(album.photos)) {
          albumPhotos = album.photos;
        }
      }

      const response = NextResponse.json({
        success: true,
        valid: true,
        invite: {
          id: invite.id,
          guestName: invite.guestName,
          source: invite.source,
          personalNote: invite.personalNote,
          bypassTurnstile: invite.bypassTurnstile,
          unlockPhotos: invite.unlockPhotos,
          unlockSocials: invite.unlockSocials,
        },
        unlockToken,
        album: albumPhotos,
      });

      response.cookies.set(`invite_token_${cleanSlug}`, invite.token, {
        path: "/",
        maxAge: 86400 * 30,
        sameSite: "lax",
      });

      if (unlockToken) {
        response.cookies.set(`unlocked_token_${cleanSlug}`, unlockToken, {
          path: "/",
          maxAge: 86400 * 30,
          sameSite: "lax",
        });
      }

      return response;
    }

    // Admin listing flow
    if (!isValidAdminToken(meta, extractAdminToken(req))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const invites = await listVipInvites(cleanSlug);
    return NextResponse.json({ success: true, invites });
  } catch (error) {
    console.error("Error in invites GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Create a new VIP Realm Key invitation (Admin only).
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

    if (!isValidAdminToken(meta, extractAdminToken(req))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { guestName, source, personalNote, bypassTurnstile, unlockPhotos, unlockSocials, expiresInDays } = body;

    if (!guestName || typeof guestName !== "string" || !guestName.trim()) {
      return NextResponse.json({ error: "Guest name is required." }, { status: 400 });
    }

    const invite = await createVipInvite(cleanSlug, {
      guestName: guestName.trim(),
      source: typeof source === "string" ? source : "Direct",
      personalNote: typeof personalNote === "string" ? personalNote : undefined,
      bypassTurnstile: bypassTurnstile !== undefined ? Boolean(bypassTurnstile) : true,
      unlockPhotos: Boolean(unlockPhotos),
      unlockSocials: Boolean(unlockSocials),
      expiresInDays: typeof expiresInDays === "number" ? expiresInDays : null,
    });

    if (!invite) {
      return NextResponse.json({ error: "Failed to create invite key." }, { status: 500 });
    }

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Revoke or remove a VIP Invite link (Admin only).
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

    if (!isValidAdminToken(meta, extractAdminToken(req))) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const inviteToken = req.nextUrl.searchParams.get("inviteToken");
    const purge = req.nextUrl.searchParams.get("purge") === "true";

    if (!inviteToken) {
      return NextResponse.json({ error: "Missing inviteToken parameter" }, { status: 400 });
    }

    const ok = await revokeVipInvite(cleanSlug, inviteToken, purge);
    if (!ok) {
      return NextResponse.json({ error: "Invite not found or revoke failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
