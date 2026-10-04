import { Redis } from "@upstash/redis";
import { parseReferrer } from "./referrer-parser";

// Initialize Upstash Redis client from environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export interface VisitEvent {
  timestamp: string;
  path: string;
  rawReferrer: string | null;
  parsedReferrer: string;
  userAgent: string | null;
  ip: string | null;
}

export interface ContactMessage {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  contact?: string;
  message: string;
  referrer?: string | null;
}

export interface SectionDwellReport {
  sectionId: string;
  name: string;
  totalSeconds: number;
  totalViews: number;
  avgSeconds: number;
}

/**
 * Record a page visit in Redis analytics
 */
export async function recordVisit(data: {
  path: string;
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
}) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;

    const parsedRef = parseReferrer(data.referrer);

    const event: VisitEvent = {
      timestamp: new Date().toISOString(),
      path: data.path,
      rawReferrer: data.referrer,
      parsedReferrer: parsedRef,
      userAgent: data.userAgent,
      ip: data.ip,
    };

    // Increment total visit count
    await redis.incr("analytics:views:total");

    // Increment count for this clean referrer category
    await redis.hincrby("analytics:referrers", parsedRef, 1);

    // Keep the latest 100 visit logs
    await redis.lpush("analytics:visits:log", JSON.stringify(event));
    await redis.ltrim("analytics:visits:log", 0, 99);
  } catch (error) {
    console.error("Failed to record visit in Redis:", error);
  }
}

/**
 * Record section dwell times from visitor's active reading session
 */
export async function recordSectionDwell(
  dwellSeconds: Record<string, number>,
  viewedSections: string[]
) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;

    // Increment seconds spent per section
    for (const [section, seconds] of Object.entries(dwellSeconds)) {
      if (typeof seconds === "number" && seconds > 0) {
        // Cap single session increment to avoid abnormal background tab inflation
        const safeSeconds = Math.min(Math.round(seconds), 300);
        await redis.hincrby("analytics:dwell:seconds", section, safeSeconds);
      }
    }

    // Increment view counter for reached sections
    for (const section of viewedSections) {
      if (section && typeof section === "string") {
        await redis.hincrby("analytics:dwell:views", section, 1);
      }
    }
  } catch (error) {
    console.error("Failed to record dwell times in Redis:", error);
  }
}

/**
 * Save visitor contact message in Redis
 */
export async function saveMessage(data: Omit<ContactMessage, "id" | "timestamp">): Promise<ContactMessage> {
  const messageRecord: ContactMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...data,
  };

  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.lpush("contact:messages", JSON.stringify(messageRecord));
      await redis.incr("contact:count");
    }
  } catch (error) {
    console.error("Failed to save message in Redis:", error);
  }

  return messageRecord;
}

/**
 * Fetch all contact messages for the admin inbox
 */
export async function getAllMessages(limit = 100): Promise<ContactMessage[]> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return [];
    const raw = await redis.lrange("contact:messages", 0, limit - 1);
    return (raw || [])
      .map((item) => {
        try {
          return typeof item === "string" ? JSON.parse(item) : item;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ContactMessage[];
  } catch (error) {
    console.error("Failed to get messages:", error);
    return [];
  }
}

/**
 * Get comprehensive analytics summary for Admin Realm and LLM parsing
 */
export async function getComprehensiveAnalytics() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return getEmptyAnalytics();
    }

    const [
      totalViews,
      referrersMap,
      dwellSecondsMap,
      dwellViewsMap,
      messageCount,
      rawVisits,
      messages,
    ] = await Promise.all([
      redis.get<number>("analytics:views:total") || 0,
      redis.hgetall<Record<string, number>>("analytics:referrers") || {},
      redis.hgetall<Record<string, number>>("analytics:dwell:seconds") || {},
      redis.hgetall<Record<string, number>>("analytics:dwell:views") || {},
      redis.get<number>("contact:count") || 0,
      redis.lrange("analytics:visits:log", 0, 49),
      getAllMessages(50),
    ]);

    const recentVisits = (rawVisits || [])
      .map((v) => {
        try {
          return typeof v === "string" ? JSON.parse(v) : v;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Section definitions
    const sectionNames: Record<string, string> = {
      hero: "Hero & Introduction",
      craft: "The Craft & Red Team Lab",
      rhythm: "Life Rhythm, Tilakwadi & Western Ghats",
      vision: "Life Partner Vision & Expectations",
      connect: "Say Hello / Direct Contact Form",
    };

    const dwellReports: SectionDwellReport[] = Object.keys(sectionNames).map((key) => {
      const totalSec = Number(dwellSecondsMap?.[key] || 0);
      const views = Number(dwellViewsMap?.[key] || 0);
      const avgSec = views > 0 ? Math.round(totalSec / views) : 0;
      return {
        sectionId: key,
        name: sectionNames[key],
        totalSeconds: totalSec,
        totalViews: views,
        avgSeconds: avgSec,
      };
    });

    return {
      totalViews: Number(totalViews) || 0,
      referrers: referrersMap || {},
      sectionDwell: dwellReports,
      messageCount: Number(messageCount) || 0,
      recentVisits,
      messages,
    };
  } catch (error) {
    console.error("Failed to get comprehensive analytics:", error);
    return getEmptyAnalytics();
  }
}

function getEmptyAnalytics() {
  return {
    totalViews: 0,
    referrers: {},
    sectionDwell: [],
    messageCount: 0,
    recentVisits: [],
    messages: [],
  };
}

/**
 * Format the entire platform data into a prompt bundle ready for LLM audit
 */
export function formatDataForLLM(data: Awaited<ReturnType<typeof getComprehensiveAnalytics>>) {
  const { totalViews, referrers, sectionDwell, messageCount, messages } = data;
  const conversionRate = totalViews > 0 ? ((messageCount / totalViews) * 100).toFixed(1) : "0.0";

  let referrersList = Object.entries(referrers)
    .sort((a, b) => b[1] - a[1])
    .map(([ref, count]) => {
      const pct = totalViews > 0 ? ((count / totalViews) * 100).toFixed(1) : "0";
      return `- **${ref}**: ${count} visits (${pct}%)`;
    })
    .join("\n");

  if (!referrersList) referrersList = "- No referrer data recorded yet.";

  let sectionList = sectionDwell
    .map((s) => {
      const reachPct = totalViews > 0 ? ((s.totalViews / totalViews) * 100).toFixed(1) : "0";
      return `- **${s.name}** [ID: \`${s.sectionId}\`]:\n  - Reached by: ${s.totalViews} visitors (${reachPct}%)\n  - Average Time Spent: ${s.avgSeconds}s (Total: ${s.totalSeconds}s)`;
    })
    .join("\n");

  let messagesSummary = messages
    .map((m, idx) => {
      return `### Note #${idx + 1} (${m.timestamp.slice(0, 10)})\n- **From**: ${m.name}\n- **Source**: ${m.referrer || "Direct"}\n- **Message Content**: "${m.message}"`;
    })
    .join("\n\n");

  if (!messagesSummary) messagesSummary = "No visitor notes received yet.";

  return `
# MATCHMAKING PROFILE & CONVERSION AUDIT REPORT

## 1. Executive Summary
- **Profile Owner**: Realm Owner
- **Goal**: Attracting an ambitious, emotionally mature, intentional life partner.
- **Total Unique Visitors**: ${totalViews}
- **Total Personal Notes Submitted**: ${messageCount}
- **Conversion Rate (Notes / Visitors)**: ${conversionRate}%

## 2. Traffic Sources Breakdown (Headers & Referrers)
${referrersList}

## 3. Section Heatmap & Dwell Time Analysis
${sectionList}

## 4. Received Notes / Feedback
${messagesSummary}

---

## 5. Instructions for the Analyzing AI:
You are an elite dating strategist, copywriter, and conversion consultant.
Analyze the empirical engagement data above:
1. **Drop-Off & Retention Analysis**: Identify which section experiences the highest drop-off or lowest dwell time. Where are potential matches bouncing?
2. **Channel Quality**: Compare conversion rates and retention between traffic sources (e.g. Reddit vs. Dating Apps vs. Direct). Which channel provides the highest-intent visitors?
3. **Copy & Persona Optimization**: Based on the feedback notes and dwell patterns, provide 3 concrete suggestions to improve the copy, tone, or visual presentation.
4. **Actionable Next Steps**: What changes would increase the quantity and quality of meaningful notes?
`.trim();
}

export default redis;
