import { NextRequest, NextResponse } from "next/server";
import { saveMessage } from "@/lib/redis";
import { sendAlertToAjay, sendConfirmationToVisitor } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, contact, message, ref, turnstileToken } = body;

    // Basic validation
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Please enter your name or nickname." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address so I can reply." }, { status: 400 });
    }
    if (!message || message.trim().length < 5) {
      return NextResponse.json({ success: false, error: "Please share a brief note or thought." }, { status: 400 });
    }

    // Turnstile check if secret key exists
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const formData = new URLSearchParams();
      formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
      formData.append("response", turnstileToken);

      try {
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          body: formData,
        });
        const verifyOutcome = await verifyRes.json();
        if (!verifyOutcome.success) {
          console.warn("Turnstile check failed during contact form submission.");
        }
      } catch (err) {
        console.error("Turnstile network error in contact form:", err);
      }
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    // 1. Save to Redis
    const saved = await saveMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact ? contact.trim() : undefined,
      message: message.trim(),
      referrer: ref || null,
    });

    // 2. Dispatch alert email to Ajay (async, won't block)
    sendAlertToAjay({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      contact: contact ? contact.trim() : undefined,
      message: message.trim(),
      ref: ref || null,
      userAgent,
    }).catch((err) => console.error("Error in sendAlertToAjay:", err));

    // 3. Dispatch polite confirmation to visitor (async)
    sendConfirmationToVisitor(email.trim().toLowerCase(), name.trim()).catch((err) =>
      console.error("Error in sendConfirmationToVisitor:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Your message has been delivered directly.",
      id: saved.id,
    });
  } catch (error) {
    console.error("Error handling contact submission:", error);
    return NextResponse.json({ success: false, error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
