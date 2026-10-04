import { NextRequest, NextResponse } from "next/server";
import { saveRealmMessage, getRealmMeta, getRealmSmtp, DEFAULT_REALM_SLUG } from "@/lib/realms";
import {
  sendAlertToAjay,
  sendConfirmationToVisitor,
  sendCustomRealmAlert,
  sendCustomConfirmationToVisitor,
} from "@/lib/mailer";

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
    const { name, email, contact, message, ref, turnstileToken } = body;

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

    const userAgent = req.headers.get("user-agent") || undefined;

    // 1. Save to Realm in Redis
    const saved = await saveRealmMessage(slug, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact ? contact.trim() : undefined,
      message: message.trim(),
      referrer: ref || null,
    });

    // 2. Dispatch email alerts
    if (slug === DEFAULT_REALM_SLUG) {
      // Ajay's personal realm uses master server environment variables
      sendAlertToAjay({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        contact: contact ? contact.trim() : undefined,
        message: message.trim(),
        ref: ref || `Realm: ${realm.slug}`,
        userAgent,
      }).catch((err) => console.error("Error dispatching alert email:", err));

      sendConfirmationToVisitor(email.trim().toLowerCase(), name.trim(), realm.name).catch((err) =>
        console.error("Error dispatching confirmation email:", err)
      );
    } else {
      // For third-party realms: NEVER use Ajay's email!
      // Check if this realm configured its own personal Gmail App Password
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
        }).catch((err) => console.error("Error dispatching custom realm alert:", err));

        sendCustomConfirmationToVisitor({
          smtp: realmSmtp,
          toEmail: email.trim().toLowerCase(),
          visitorName: name.trim(),
          realmOwnerName: realm.name,
        }).catch((err) => console.error("Error dispatching custom confirmation:", err));
      }
      // If realmSmtp is not configured, the visitor note is safely stored in their Redis Inbox.
      // Zero exposure of Ajay's email to Rohan or the visitor.
    }

    return NextResponse.json({
      success: true,
      message: `Your note has reached ${realm.name} directly.`,
      id: saved.id,
    });
  } catch (error) {
    console.error("Error in realm contact submission:", error);
    return NextResponse.json({ success: false, error: "Failed to send message." }, { status: 500 });
  }
}
