import puppeteer, { Browser } from "puppeteer-core";
import fs from "fs";

/**
 * Launch a headless Chromium/Chrome instance suitable for both local development and Vercel serverless.
 */
export async function getBrowser(): Promise<Browser> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    // Dynamic import to avoid local compilation problems
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const isArm = process.arch === "arm64";
    const packUrl = isArm
      ? "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.arm64.tar"
      : "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";

    return await puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: { width: 1080, height: 1920 },
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
    });
  }

  // Local development fallback paths (Windows, Mac, Linux)
  const candidatePaths = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];

  let executablePath = "";
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    throw new Error(
      "No compatible Chrome/Edge browser found on this machine. Please set CHROME_EXECUTABLE_PATH."
    );
  }

  return await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--font-render-hinting=medium",
    ],
  });
}
