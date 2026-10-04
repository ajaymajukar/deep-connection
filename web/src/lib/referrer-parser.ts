/**
 * Parse any raw HTTP Referer or document.referrer string into a clean, human-readable category
 */
export function parseReferrer(rawReferrer: string | null | undefined): string {
  if (!rawReferrer || !rawReferrer.trim()) {
    return "Direct / Private Bookmark";
  }

  const ref = rawReferrer.trim().toLowerCase();

  // Android App Intent URI Schemes
  if (ref.startsWith("android-app://")) {
    if (ref.includes("reddit")) return "Reddit (Android App)";
    if (ref.includes("okcupid")) return "OkCupid (Android App)";
    if (ref.includes("bumble")) return "Bumble (Android App)";
    if (ref.includes("hinge")) return "Hinge (Android App)";
    if (ref.includes("tinder")) return "Tinder (Android App)";
    if (ref.includes("telegram")) return "Telegram (Android App)";
    if (ref.includes("whatsapp")) return "WhatsApp (Android App)";
    if (ref.includes("instagram")) return "Instagram (Android App)";
    if (ref.includes("twitter") || ref.includes("x.com")) return "X / Twitter (App)";
    return `Android App (${ref.replace("android-app://", "").split("/")[0]})`;
  }

  // Web Domain Referrers
  if (ref.includes("reddit.com")) {
    if (ref.includes("/r/r4r")) return "Reddit (r/r4r)";
    if (ref.includes("/r/")) {
      const match = ref.match(/\/r\/([a-z0-9_]+)/);
      return match ? `Reddit (r/${match[1]})` : "Reddit";
    }
    return "Reddit (Web)";
  }

  if (ref.includes("okcupid.com")) return "OkCupid (Web)";
  if (ref.includes("bumble.com")) return "Bumble (Web)";
  if (ref.includes("hinge.co")) return "Hinge (Web)";
  if (ref.includes("tinder.com")) return "Tinder (Web)";
  if (ref.includes("instagram.com")) return "Instagram (Web)";
  if (ref.includes("twitter.com") || ref.includes("x.com") || ref.includes("t.co")) return "X / Twitter";
  if (ref.includes("linkedin.com")) return "LinkedIn";
  if (ref.includes("t.me") || ref.includes("telegram.org")) return "Telegram";
  if (ref.includes("google.")) return "Google Search";
  if (ref.includes("duckduckgo.")) return "DuckDuckGo";
  if (ref.includes("bing.com")) return "Bing Search";
  if (ref.includes("github.com")) return "GitHub";

  // URL fallback extraction
  try {
    const url = new URL(ref.startsWith("http") ? ref : `https://${ref}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return ref.slice(0, 40);
  }
}
