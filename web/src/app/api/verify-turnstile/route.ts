import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing Turnstile verification token" }, { status: 400 });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn("TURNSTILE_SECRET_KEY not set. Falling back to allowed for local dev.");
      return NextResponse.json({ success: true });
    }

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    // Optional IP forwarding for extra validation accuracy
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");
    if (clientIp) {
      formData.append("remoteip", clientIp.split(",")[0].trim());
    }

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const outcome = await result.json();

    if (outcome.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Turnstile verification failed:", outcome["error-codes"]);
      return NextResponse.json(
        { success: false, error: "Human verification failed. Please try again." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying turnstile token:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
