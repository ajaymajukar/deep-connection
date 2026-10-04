import redis from "./redis";
import { DEFAULT_PROFILE, ProfileConfig, getGenericStarterProfile } from "./profile";
import { parseReferrer } from "./referrer-parser";

export interface RealmMeta {
  slug: string;
  name: string;
  ownerEmail: string;
  password: string;
  createdAt: string;
}

export interface RealmVisitEvent {
  timestamp: string;
  path: string;
  rawReferrer: string | null;
  parsedReferrer: string;
  userAgent: string | null;
  ip: string | null;
}

export interface RealmContactMessage {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  contact?: string;
  message: string;
  referrer?: string | null;
}

export interface RealmSectionDwellReport {
  sectionId: string;
  name: string;
  totalSeconds: number;
  totalViews: number;
  avgSeconds: number;
}

export const DEFAULT_REALM_SLUG = process.env.DEFAULT_REALM_SLUG || "ajay";

/**
 * Normalize realm slug (lowercase alphanumeric and dashes)
 */
export function sanitizeSlug(slug: string): string {
  return (slug || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) || DEFAULT_REALM_SLUG;
}

/**
 * Check if a realm exists
 */
export async function getRealmMeta(slug: string): Promise<RealmMeta | null> {
  const cleanSlug = sanitizeSlug(slug);

  if (cleanSlug === DEFAULT_REALM_SLUG) {
    // Default master realm
    return {
      slug: DEFAULT_REALM_SLUG,
      name: process.env.DEFAULT_OWNER_NAME || (DEFAULT_REALM_SLUG === "ajay" ? "Ajay" : "Alex"),
      ownerEmail: process.env.NOTIFICATION_TO || process.env.SMTP_USER || "admin@example.com",
      password: process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || "admin2026",
      createdAt: "2026-10-04T00:00:00.000Z",
    };
  }

  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const stored = await redis.get<RealmMeta>(`realm:${cleanSlug}:meta`);
      if (stored) return stored;
    }
  } catch (error) {
    console.error(`Error loading realm meta for ${cleanSlug}:`, error);
  }

  return null;
}

/**
 * Create a new realm for any 3rd party user
 */
export async function createNewRealm(data: {
  slug: string;
  name: string;
  ownerEmail: string;
  password: string;
}): Promise<{ success: boolean; error?: string; realm?: RealmMeta }> {
  const cleanSlug = sanitizeSlug(data.slug);

  if (!cleanSlug || cleanSlug.length < 3) {
    return { success: false, error: "Realm handle must be at least 3 characters." };
  }

  if (cleanSlug === DEFAULT_REALM_SLUG) {
    return { success: false, error: "This realm handle is reserved." };
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return { success: false, error: "Database connection unavailable." };
    }

    // Check availability
    const existing = await redis.get(`realm:${cleanSlug}:meta`);
    if (existing) {
      return { success: false, error: `The realm handle '${cleanSlug}' is already taken. Please pick another.` };
    }

    const newMeta: RealmMeta = {
      slug: cleanSlug,
      name: data.name.trim(),
      ownerEmail: data.ownerEmail.trim().toLowerCase(),
      password: data.password.trim(),
      createdAt: new Date().toISOString(),
    };

    // Initialize custom profile with a clean, neutral generic starter template
    const initialProfile: ProfileConfig = getGenericStarterProfile(data.name.trim());

    await Promise.all([
      redis.set(`realm:${cleanSlug}:meta`, newMeta),
      redis.set(`realm:${cleanSlug}:profile`, initialProfile),
      redis.sadd("realms:directory", cleanSlug),
    ]);

    return { success: true, realm: newMeta };
  } catch (error) {
    console.error("Error creating new realm:", error);
    return { success: false, error: "Failed to initialize new realm in database." };
  }
}

/**
 * Permanently delete a realm and all associated data from database
 */
export async function deleteRealm(slug: string): Promise<boolean> {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return false;

    await Promise.all([
      redis.del(`realm:${cleanSlug}:meta`),
      redis.del(`realm:${cleanSlug}:profile`),
      redis.del(`realm:${cleanSlug}:views:total`),
      redis.del(`realm:${cleanSlug}:referrers`),
      redis.del(`realm:${cleanSlug}:visits:log`),
      redis.del(`realm:${cleanSlug}:dwell:seconds`),
      redis.del(`realm:${cleanSlug}:dwell:views`),
      redis.del(`realm:${cleanSlug}:messages`),
      redis.del(`realm:${cleanSlug}:messages:count`),
      redis.srem("realms:directory", cleanSlug),
    ]);

    if (cleanSlug === DEFAULT_REALM_SLUG) {
      await redis.del("profile:config");
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete realm ${cleanSlug}:`, error);
    return false;
  }
}

/**
 * Load the profile config for a specific realm
 */
export async function getRealmProfile(slug: string): Promise<ProfileConfig> {
  const cleanSlug = sanitizeSlug(slug);

  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      // Check realm-specific key
      const stored = await redis.get<ProfileConfig>(`realm:${cleanSlug}:profile`);
      if (stored && typeof stored === "object" && stored.name) {
        if (cleanSlug !== DEFAULT_REALM_SLUG) {
          // Check for contamination from Ajay's default profile (photos or specific prompts)
          const isContaminatedWithAjayImages =
            stored.images?.hero === DEFAULT_PROFILE.images.hero ||
            stored.images?.craftDesk === DEFAULT_PROFILE.images.craftDesk ||
            stored.images?.friendsTrip === DEFAULT_PROFILE.images.friendsTrip;

          const isContaminatedWithAjayDetails =
            stored.headline === DEFAULT_PROFILE.headline ||
            stored.bio2?.includes("family-run queues") ||
            stored.bio2?.includes("rigid traditions") ||
            stored.specs?.base?.toLowerCase().includes("tilakwadi") ||
            stored.bio1?.toLowerCase().includes("hellfire") ||
            stored.specs?.career?.toLowerCase().includes("red team") ||
            stored.rhythm?.highlightTitle?.toLowerCase().includes("western ghats") ||
            stored.craft?.title?.toLowerCase().includes("breaking systems");

          const hasAjayPillars = stored.partnerVision?.pillars?.some(
            (p) =>
              p.title?.toLowerCase().includes("her own craft") ||
              p.desc?.toLowerCase().includes("tilakwadi") ||
              p.desc?.toLowerCase().includes("passive-aggressive")
          );

          // Determine realm creator's real name from realm meta if available
          let ownerName = stored.name;
          if (ownerName.toLowerCase() === "ajay" || isContaminatedWithAjayDetails) {
            const meta = await getRealmMeta(cleanSlug);
            if (meta?.name && meta.name.toLowerCase() !== "ajay") {
              ownerName = meta.name;
            } else {
              ownerName = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
            }
          }

          const genericTemplate = getGenericStarterProfile(ownerName);

          let wasContaminated = false;
          const cleanedProfile: ProfileConfig = {
            ...genericTemplate,
            ...stored,
            name: ownerName,
            images: {
              ...genericTemplate.images,
              ...(stored.images || {}),
            },
            specs: {
              ...genericTemplate.specs,
              ...(stored.specs || {}),
            },
            craft: {
              ...genericTemplate.craft,
              ...(stored.craft || {}),
            },
            rhythm: {
              ...genericTemplate.rhythm,
              ...(stored.rhythm || {}),
            },
            partnerVision: {
              ...genericTemplate.partnerVision,
              ...(stored.partnerVision || {}),
            },
            contact: {
              ...genericTemplate.contact,
              ...(stored.contact || {}),
            },
            socials: { ...(stored.socials || {}) },
          };

          if (isContaminatedWithAjayImages) {
            cleanedProfile.images = { ...genericTemplate.images };
            wasContaminated = true;
          }

          const isContaminatedWithAjaySocials =
            Boolean(stored.socials &&
            (stored.socials.linkedin?.includes("ajaymajukar") ||
              stored.socials.tinder?.includes("ajaymajukar") ||
              stored.socials.github?.includes("ajaymajukar")));

          if (isContaminatedWithAjaySocials) {
            cleanedProfile.socials = {};
            wasContaminated = true;
          }

          if (isContaminatedWithAjayDetails) {
            cleanedProfile.tagline = genericTemplate.tagline;
            cleanedProfile.headline = genericTemplate.headline;
            cleanedProfile.bio1 = genericTemplate.bio1;
            cleanedProfile.bio2 = genericTemplate.bio2;
            cleanedProfile.specs = { ...genericTemplate.specs };
            cleanedProfile.craft = { ...genericTemplate.craft };
            cleanedProfile.rhythm = { ...genericTemplate.rhythm };
            cleanedProfile.contact = { ...genericTemplate.contact };
            wasContaminated = true;
          }

          if (hasAjayPillars) {
            cleanedProfile.partnerVision = { ...genericTemplate.partnerVision };
            wasContaminated = true;
          }

          if (wasContaminated) {
            // Self-heal the database so the clean version is permanently stored
            await redis.set(`realm:${cleanSlug}:profile`, cleanedProfile);
          }

          return cleanedProfile;
        }

        // Ajay's default realm
        const baseTemplate = DEFAULT_PROFILE;
        return {
          ...baseTemplate,
          ...stored,
          images: { ...baseTemplate.images, ...(stored.images || {}) },
          specs: { ...baseTemplate.specs, ...(stored.specs || {}) },
          craft: { ...baseTemplate.craft, ...(stored.craft || {}) },
          rhythm: { ...baseTemplate.rhythm, ...(stored.rhythm || {}) },
          partnerVision: { ...baseTemplate.partnerVision, ...(stored.partnerVision || {}) },
          contact: { ...baseTemplate.contact, ...(stored.contact || {}) },
          socials: stored.socials !== undefined ? stored.socials : { ...baseTemplate.socials },
        };
      }

      // Fallback for Ajay if legacy key exists
      if (cleanSlug === DEFAULT_REALM_SLUG) {
        const legacy = await redis.get<ProfileConfig>("profile:config");
        if (legacy && legacy.name) {
          return { ...DEFAULT_PROFILE, ...legacy };
        }
      }
    }
  } catch (error) {
    console.error(`Failed to load profile for realm ${cleanSlug}:`, error);
  }

  if (cleanSlug !== DEFAULT_REALM_SLUG) {
    const meta = await getRealmMeta(cleanSlug);
    const ownerName = meta?.name || cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
    return getGenericStarterProfile(ownerName);
  }

  return DEFAULT_PROFILE;
}

/**
 * Save profile configuration for a specific realm
 */
export async function saveRealmProfile(slug: string, profile: ProfileConfig): Promise<boolean> {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      if (cleanSlug !== DEFAULT_REALM_SLUG) {
        // Prevent accidental saving of Ajay's default photos to a non-Ajay realm
        const generic = getGenericStarterProfile(profile.name);
        if (profile.images?.hero === DEFAULT_PROFILE.images.hero) {
          profile.images.hero = generic.images.hero;
        }
        if (profile.images?.craftDesk === DEFAULT_PROFILE.images.craftDesk) {
          profile.images.craftDesk = generic.images.craftDesk;
        }
        if (profile.images?.friendsTrip === DEFAULT_PROFILE.images.friendsTrip) {
          profile.images.friendsTrip = generic.images.friendsTrip;
        }
        if (profile.images?.formalWaistcoat === DEFAULT_PROFILE.images.formalWaistcoat) {
          profile.images.formalWaistcoat = generic.images.formalWaistcoat;
        }
        if (profile.images?.casualOutdoor === DEFAULT_PROFILE.images.casualOutdoor) {
          profile.images.casualOutdoor = generic.images.casualOutdoor;
        }
      }

      await redis.set(`realm:${cleanSlug}:profile`, profile);
      if (cleanSlug === DEFAULT_REALM_SLUG) {
        // Keep legacy key synced
        await redis.set("profile:config", profile);
      }
      return true;
    }
  } catch (error) {
    console.error(`Failed to save profile for realm ${cleanSlug}:`, error);
  }
  return false;
}

/**
 * Record a visit for a specific realm
 */
export async function recordRealmVisit(slug: string, data: {
  path: string;
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
}) {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;

    const parsedRef = parseReferrer(data.referrer);
    const event: RealmVisitEvent = {
      timestamp: new Date().toISOString(),
      path: data.path,
      rawReferrer: data.referrer,
      parsedReferrer: parsedRef,
      userAgent: data.userAgent,
      ip: data.ip,
    };

    await Promise.all([
      redis.incr(`realm:${cleanSlug}:views:total`),
      redis.hincrby(`realm:${cleanSlug}:referrers`, parsedRef, 1),
      redis.lpush(`realm:${cleanSlug}:visits:log`, JSON.stringify(event)),
      redis.ltrim(`realm:${cleanSlug}:visits:log`, 0, 99),
    ]);
  } catch (error) {
    console.error(`Failed to record visit for realm ${cleanSlug}:`, error);
  }
}

/**
 * Record section dwell times for a specific realm
 */
export async function recordRealmDwell(
  slug: string,
  dwellSeconds: Record<string, number>,
  viewedSections: string[]
) {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return;

    for (const [section, seconds] of Object.entries(dwellSeconds)) {
      if (typeof seconds === "number" && seconds > 0) {
        const safeSeconds = Math.min(Math.round(seconds), 300);
        await redis.hincrby(`realm:${cleanSlug}:dwell:seconds`, section, safeSeconds);
      }
    }

    for (const section of viewedSections) {
      if (section && typeof section === "string") {
        await redis.hincrby(`realm:${cleanSlug}:dwell:views`, section, 1);
      }
    }
  } catch (error) {
    console.error(`Failed to record dwell times for realm ${cleanSlug}:`, error);
  }
}

/**
 * Save contact message for a specific realm
 */
export async function saveRealmMessage(
  slug: string,
  data: Omit<RealmContactMessage, "id" | "timestamp">
): Promise<RealmContactMessage> {
  const cleanSlug = sanitizeSlug(slug);
  const messageRecord: RealmContactMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...data,
  };

  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.lpush(`realm:${cleanSlug}:messages`, JSON.stringify(messageRecord));
      await redis.incr(`realm:${cleanSlug}:messages:count`);
    }
  } catch (error) {
    console.error(`Failed to save message for realm ${cleanSlug}:`, error);
  }

  return messageRecord;
}

/**
 * Fetch messages for a specific realm
 */
export async function getRealmMessages(slug: string, limit = 100): Promise<RealmContactMessage[]> {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return [];
    const raw = await redis.lrange(`realm:${cleanSlug}:messages`, 0, limit - 1);
    return (raw || [])
      .map((item) => {
        try {
          return typeof item === "string" ? JSON.parse(item) : item;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as RealmContactMessage[];
  } catch (error) {
    console.error(`Failed to get messages for realm ${cleanSlug}:`, error);
    return [];
  }
}

/**
 * Get comprehensive analytics for a specific realm
 */
export async function getRealmComprehensiveAnalytics(slug: string) {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return getEmptyRealmAnalytics();
    }

    const [
      totalViews,
      referrersMap,
      dwellSecondsMap,
      dwellViewsMap,
      messageCount,
      rawVisits,
      messages,
      profile,
    ] = await Promise.all([
      redis.get<number>(`realm:${cleanSlug}:views:total`) || 0,
      redis.hgetall<Record<string, number>>(`realm:${cleanSlug}:referrers`) || {},
      redis.hgetall<Record<string, number>>(`realm:${cleanSlug}:dwell:seconds`) || {},
      redis.hgetall<Record<string, number>>(`realm:${cleanSlug}:dwell:views`) || {},
      redis.get<number>(`realm:${cleanSlug}:messages:count`) || 0,
      redis.lrange(`realm:${cleanSlug}:visits:log`, 0, 49),
      getRealmMessages(cleanSlug, 50),
      getRealmProfile(cleanSlug),
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

    const sectionNames: Record<string, string> = {
      hero: "Hero & Introduction",
      craft: "The Craft & Lab",
      rhythm: "Life Rhythm & Downtime",
      vision: "Life Partner Vision",
      connect: "Say Hello / Direct Form",
    };

    const dwellReports: RealmSectionDwellReport[] = Object.keys(sectionNames).map((key) => {
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
      slug: cleanSlug,
      ownerName: profile.name,
      totalViews: Number(totalViews) || 0,
      referrers: referrersMap || {},
      sectionDwell: dwellReports,
      messageCount: Number(messageCount) || 0,
      recentVisits,
      messages,
    };
  } catch (error) {
    console.error(`Failed to get analytics for realm ${cleanSlug}:`, error);
    return getEmptyRealmAnalytics(cleanSlug);
  }
}

function getEmptyRealmAnalytics(slug: string = DEFAULT_REALM_SLUG) {
  const isAjay = slug === DEFAULT_REALM_SLUG;
  return {
    slug,
    ownerName: isAjay ? "Ajay" : slug.charAt(0).toUpperCase() + slug.slice(1),
    totalViews: 0,
    referrers: {},
    sectionDwell: [],
    messageCount: 0,
    recentVisits: [],
    messages: [],
  };
}

/**
 * Format realm analytics into an LLM analysis prompt
 */
export function formatRealmDataForLLM(
  analytics: Awaited<ReturnType<typeof getRealmComprehensiveAnalytics>>,
  profile?: ProfileConfig
) {
  const { slug, ownerName, totalViews, referrers, sectionDwell, messageCount, messages } = analytics;
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
      return `### Note #${idx + 1} (${m.timestamp.slice(0, 10)})\n- **From**: ${m.name}\n- **Source**: ${m.referrer || "Direct"}\n- **Message**: "${m.message}"`;
    })
    .join("\n\n");

  if (!messagesSummary) messagesSummary = "No visitor notes received yet.";

  return `
# MATCHMAKING PROFILE & CONVERSION AUDIT REPORT: REALM [${slug.toUpperCase()}]

## 1. Executive Summary
- **Realm Owner**: ${ownerName} (Realm Handle: \`${slug}\`)
${profile?.headline ? `- **Headline**: "${profile.headline}"` : ""}
${profile?.tagline ? `- **Tagline**: "${profile.tagline}"` : ""}
${profile?.specs?.base ? `- **Base Location**: ${profile.specs.base}` : ""}
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

## 5. Strategic AI Audit Instructions:
You are an expert matchmaking and conversion optimization consultant.
Analyze the empirical data above for ${ownerName}'s realm:
1. **Drop-Off Points**: What sections have the lowest dwell times or highest visitor drop-off?
2. **Channel ROI**: Which referrers convert best into meaningful notes?
3. **Copy & Persona Critique**: Suggest 3 high-impact copy or photo adjustments based on ${ownerName}'s headline and presentation.
4. **Action Items**: Next actionable steps to maximize match quality.
`.trim();
}

export interface RealmSmtpConfig {
  email: string;
  appPassword: string;
  enabled: boolean;
  updatedAt?: string;
}

/**
 * Retrieve custom SMTP settings for a realm
 */
export async function getRealmSmtp(slug: string): Promise<RealmSmtpConfig | null> {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const stored = await redis.get<RealmSmtpConfig>(`realm:${cleanSlug}:smtp`);
      if (stored && typeof stored === "object" && stored.email) {
        return stored;
      }
    }
  } catch (err) {
    console.error(`Failed to load SMTP config for realm ${cleanSlug}:`, err);
  }
  return null;
}

/**
 * Save custom SMTP settings for a realm
 */
export async function saveRealmSmtp(slug: string, config: RealmSmtpConfig): Promise<boolean> {
  const cleanSlug = sanitizeSlug(slug);
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.set(`realm:${cleanSlug}:smtp`, {
        ...config,
        email: (config.email || "").trim().toLowerCase(),
        appPassword: (config.appPassword || "").replace(/\s+/g, ""),
        updatedAt: new Date().toISOString(),
      });
      return true;
    }
  } catch (err) {
    console.error(`Failed to save SMTP config for realm ${cleanSlug}:`, err);
  }
  return false;
}
