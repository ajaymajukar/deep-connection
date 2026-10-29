import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/browser";
import { getRealmMeta } from "@/lib/realms";
import JSZip from "jszip";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for server-side Chromium capture

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let browser = null;

  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);

    const format = searchParams.get("format") || "deck"; // "deck" | "infographic" | "pdf"
    const mode = searchParams.get("mode") === "revealed" ? "revealed" : "unrevealed";
    const token = req.headers.get("authorization")?.replace("Bearer ", "") || searchParams.get("token");

    // Authenticate admin request
    const meta = await getRealmMeta(slug);
    if (!meta) {
      return NextResponse.json({ error: "Realm not found" }, { status: 404 });
    }

    const expectedToken = `auth_${meta.slug}_${Buffer.from(meta.password).toString("base64")}`;
    const legacyKey = process.env.ADMIN_SECRET || "admin2026";

    // Validate access
    if (token && token !== expectedToken && token !== meta.password && token !== legacyKey) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const origin = req.nextUrl.origin || "http://localhost:3000";

    // Launch headless Chromium browser
    browser = await getBrowser();
    const page = await browser.newPage();

    // OPTION 1: STORY DECK (ZIP of 4 PNG cards @ 1080x1920, 2x Retina)
    if (format === "deck") {
      await page.setViewport({
        width: 1080,
        height: 1920,
        deviceScaleFactor: 2,
      });

      const targetUrl = `${origin}/${slug}/cards?mode=${mode}`;
      await page.goto(targetUrl, {
        waitUntil: "networkidle0",
        timeout: 45000,
      });

      // Brief settle time to ensure fonts, Tailwind CSS, and images are fully decoded
      await new Promise((resolve) => setTimeout(resolve, 800));

      const zip = new JSZip();
      const cardTitles = [
        "01-intro-vibe",
        "02-craft-mindset",
        "03-partnership-vision",
        "04-rhythm-downtime",
      ];

      for (let i = 1; i <= 4; i++) {
        const selector = `#story-card-${i}`;
        const cardElement = await page.$(selector);

        if (cardElement) {
          const cardScreenshot = await cardElement.screenshot({
            type: "png",
            omitBackground: false,
          });
          zip.file(`${cardTitles[i - 1]}-${mode}.png`, cardScreenshot);
        }
      }

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${slug}-story-deck-${mode}.zip"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // OPTION 2: SINGLE-PAGE INFOGRAPHIC (High-res full-length PNG scroll)
    if (format === "infographic") {
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      const targetUrl = `${origin}/${slug}/story?export=true&mode=${mode}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
      await page.goto(targetUrl, {
        waitUntil: "networkidle0",
        timeout: 45000,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const fullScreenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      });

      return new NextResponse(fullScreenshot as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="${slug}-infographic-${mode}.png"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // OPTION 3: BIODATA PORTFOLIO PDF (Print-ready A4 vector PDF)
    if (format === "pdf") {
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      const targetUrl = `${origin}/${slug}/biodata?mode=${mode}`;
      await page.goto(targetUrl, {
        waitUntil: "networkidle0",
        timeout: 45000,
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "10mm",
          bottom: "10mm",
          left: "8mm",
          right: "8mm",
        },
      });

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${slug}-biodata-portfolio-${mode}.pdf"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return NextResponse.json(
      { error: `Unknown export format: ${format}. Use 'deck', 'infographic', or 'pdf'.` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Server-side export generation failed:", error);
    return NextResponse.json(
      { error: "Export generation failed", details: error?.message || String(error) },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.warn("Failed to close browser:", err);
      }
    }
  }
}
