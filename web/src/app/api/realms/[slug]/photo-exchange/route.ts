import { NextRequest, NextResponse } from "next/server";
import {
  getRealmMeta,
  getRealmPrivateAlbum,
  saveRealmMessage,
  getRealmSmtp,
  DEFAULT_REALM_SLUG,
} from "@/lib/realms";
import { sendAlertToAjay, sendCustomRealmAlert } from "@/lib/mailer";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const meta = await getRealmMeta(slug);
    if (!meta) {
      return NextResponse.json({ success: false, error: "Realm not found." }, { status: 404 });
    }

    const album = await getRealmPrivateAlbum(slug);

    // Check if requester has admin key to view full album
    const authHeader = req.headers.get("authorization");
    const keyParam = req.nextUrl.searchParams.get("key");
    const token = authHeader?.replace("Bearer ", "") || keyParam;
    const expectedToken = `auth_${meta.slug}_${Buffer.from(meta.password).toString("base64")}`;
    const legacyKey = process.env.ADMIN_SECRET || "admin2026";
    const isAdmin = token && (token === expectedToken || token === meta.password || token === legacyKey);

    if (isAdmin && album) {
      return NextResponse.json({
        success: true,
        album,
      });
    }

    // Public view: return only teaser metadata (no full-res photos)
    return NextResponse.json({
      success: true,
      enabled: album ? album.enabled : false,
      title: album?.title || "Private Album: Candid & Unfiltered Moments",
      subtitle:
        album?.subtitle ||
        "A quiet, reciprocal exchange. Share a picture of yourself to unlock and view these extra moments.",
      photoCount: album?.photos?.length || 0,
      categories: Array.from(new Set(album?.photos?.map((p) => p.category).filter(Boolean) as string[])),
    });
  } catch (error) {
    console.error("Error fetching private album metadata:", error);
    return NextResponse.json({ success: false, error: "Failed to load album metadata." }, { status: 500 });
  }
}

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
      return NextResponse.json({ success: false, error: "Please share your name or nickname." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address so I can reply." }, { status: 400 });
    }

    // Extract photo(s)
    const rawPhotos: string[] = [];
    if (photo && typeof photo === "string") {
      rawPhotos.push(photo);
    }
    if (Array.isArray(photos)) {
      rawPhotos.push(...photos.filter((p) => typeof p === "string" && p.trim().length > 0));
    }

    if (rawPhotos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please attach at least one photo of yourself for the mutual reveal." },
        { status: 400 }
      );
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

    // Optimize uploaded visitor photo(s) using sharp
    const optimizedPhotos: string[] = [];
    for (const raw of rawPhotos.slice(0, 3)) {
      const match = raw.match(/^data:image\/\w+;base64,(.+)$/);
      if (!match) continue;
      const buffer = Buffer.from(match[1], "base64");
      try {
        const compressed = await sharp(buffer)
          .rotate() // auto-orient based on EXIF
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
        optimizedPhotos.push(`data:image/jpeg;base64,${compressed.toString("base64")}`);
      } catch (e) {
        console.warn("Could not process image with sharp, keeping raw if small:", e);
        if (raw.length < 500000) {
          optimizedPhotos.push(raw);
        }
      }
    }

    if (optimizedPhotos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Unable to process the uploaded photo. Please try uploading a JPG or PNG." },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const finalMessage = message && message.trim().length > 0
      ? message.trim()
      : "[Shared photo via Mutual Photo Reveal to unlock private album]";

    // 1. Save to Realm in Redis
    const saved = await saveRealmMessage(slug, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact ? contact.trim() : undefined,
      message: finalMessage,
      referrer: ref || "Mutual Photo Reveal",
      photos: optimizedPhotos,
      unlockedAlbum: true,
    });

    // 2. Dispatch email alerts
    if (slug === DEFAULT_REALM_SLUG) {
      sendAlertToAjay({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        contact: contact ? contact.trim() : undefined,
        message: finalMessage,
        ref: ref || `Mutual Photo Reveal on /${realm.slug}`,
        userAgent,
        photos: optimizedPhotos,
        unlockedAlbum: true,
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
          message: finalMessage,
          ref: ref || `Mutual Photo Reveal on /${realm.slug}`,
          userAgent,
          photos: optimizedPhotos,
          unlockedAlbum: true,
        }).catch((err) => console.error("Error dispatching custom realm alert:", err));
      }
    }

    // 3. Return unlocked private album to the visitor
    const album = await getRealmPrivateAlbum(slug);
    const photosToReturn = album && album.enabled && Array.isArray(album.photos) ? album.photos : [];

    return NextResponse.json({
      success: true,
      unlocked: true,
      message: `Thank you, ${name.trim()}! Photo exchanged successfully.`,
      album: photosToReturn,
      id: saved.id,
    });
  } catch (error) {
    console.error("Error in photo exchange submission:", error);
    return NextResponse.json({ success: false, error: "Failed to exchange photo." }, { status: 500 });
  }
}
