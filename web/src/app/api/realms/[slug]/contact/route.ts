import { NextRequest, NextResponse } from "next/server";
import {
  saveRealmMessage,
  getRealmMeta,
  getRealmSmtp,
  getRealmPrivateAlbum,
  issueVisitorUnlockToken,
  sanitizeSlug,
  DEFAULT_REALM_SLUG,
  PrivateAlbumItem,
} from "@/lib/realms";
import {
  sendAlertToAjay,
  sendCustomRealmAlert,
} from "@/lib/mailer";
import sharp from "sharp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const realm = await getRealmMeta(slug);
    if (!realm) {
      return NextResponse.json({ success: false, error: "Realm not found." }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, contact, message, photo, photos, ref, turnstileToken } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Please enter your name." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!message || message.trim().length < 5) {
      return NextResponse.json({ success: false, error: "Please share a brief note or thought." }, { status: 400 });
    }

    // Optional turnstile check
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
      formData.append("response", turnstileToken);
      try {
        await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          body: formData,
        });
      } catch (err) {
        console.warn("Turnstile check warning:", err);
      }
    }

    // Extract photo(s) if provided
    const rawPhotos: string[] = [];
    if (photo && typeof photo === "string") {
      rawPhotos.push(photo);
    }
    if (Array.isArray(photos)) {
      rawPhotos.push(...photos.filter((p) => typeof p === "string" && p.trim().length > 0));
    }

    const optimizedPhotos: string[] = [];
    for (const raw of rawPhotos.slice(0, 3)) {
      const match = raw.match(/^data:image\/\w+;base64,(.+)$/);
      if (!match) continue;
      const buffer = Buffer.from(match[1], "base64");
      try {
        const compressed = await sharp(buffer)
          .rotate()
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
        optimizedPhotos.push(`data:image/jpeg;base64,${compressed.toString("base64")}`);
      } catch {
        if (raw.length < 500000) {
          optimizedPhotos.push(raw);
        }
      }
    }

    const hasPhotos = optimizedPhotos.length > 0;
    const userAgent = req.headers.get("user-agent") || undefined;

    // 1. Save to Realm in Redis
    const saved = await saveRealmMessage(slug, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact ? contact.trim() : undefined,
      message: message.trim(),
      referrer: ref || null,
      photos: hasPhotos ? optimizedPhotos : undefined,
      unlockedAlbum: hasPhotos ? true : undefined,
    });

    // 2. Dispatch email alerts
    if (slug === DEFAULT_REALM_SLUG) {
      sendAlertToAjay({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        contact: contact ? contact.trim() : undefined,
        message: message.trim(),
        ref: ref || `Realm: ${realm.slug}`,
        userAgent,
        photos: hasPhotos ? optimizedPhotos : undefined,
        unlockedAlbum: hasPhotos ? true : undefined,
      }).catch((err) => console.error("Error dispatching alert email:", err));
    } else {
      const realmSmtp = await getRealmSmtp(slug);
      if (realmSmtp && realmSmtp.enabled && realmSmtp.email && realmSmtp.appPassword) {
        sendCustomRealmAlert({
          smtp: realmSmtp,
          realmName: realm.name,
          slug: realm.slug,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          contact: contact ? contact.trim() : undefined,
          message: message.trim(),
          ref: ref || `Realm: ${realm.slug}`,
          userAgent,
          photos: hasPhotos ? optimizedPhotos : undefined,
          unlockedAlbum: hasPhotos ? true : undefined,
        }).catch((err) => console.error("Error dispatching custom realm alert:", err));
      }
    }

    // 3. If visitor attached a photo, issue unlock token & reveal private album
    let albumToReturn: PrivateAlbumItem[] = [];
    let unlockToken: string | undefined;
    if (hasPhotos) {
      unlockToken = await issueVisitorUnlockToken(slug, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });
      const album = await getRealmPrivateAlbum(slug);
      if (album && album.enabled && Array.isArray(album.photos)) {
        albumToReturn = album.photos;
      }
    }

    const response = NextResponse.json({
      success: true,
      message: `Your note has reached ${realm.name} directly.`,
      id: saved.id,
      unlocked: hasPhotos,
      unlockToken,
      album: hasPhotos ? albumToReturn : undefined,
    });

    if (unlockToken) {
      response.cookies.set(`unlocked_token_${sanitizeSlug(slug)}`, unlockToken, {
        path: "/",
        maxAge: 86400 * 30,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("Error in realm contact submission:", error);
    return NextResponse.json({ success: false, error: "Failed to send message." }, { status: 500 });
  }
}
