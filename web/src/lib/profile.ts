import redis from "./redis";

export interface SundayMoment {
  id: string;
  time: string;
  label: string;
  title: string;
  desc: string;
  atmosphere: string;
}

export interface ValuesMirrorOption {
  id: string;
  label: string;
  shortTag: string;
  ownerReflection: string;
  harmonyLevel: "aligned" | "complementary" | "distinct";
}

export interface ValuesMirrorScenario {
  id: string;
  topic: string;
  question: string;
  options: ValuesMirrorOption[];
}

export interface VoiceNoteMeta {
  enabled: boolean;
  title: string;
  subtitle?: string;
  durationSec?: number;
  transcript?: string;
  requireUnlock?: boolean;
  hasAudio?: boolean;
}

export interface ProfileConfig {
  name: string;
  tagline: string;
  headline: string;
  bio1: string;
  bio2: string;
  specs: {
    height: string;
    base: string;
    lifestyle: string;
    career: string;
  };
  images: {
    hero: string;
    craftDesk: string;
    friendsTrip: string;
    formalWaistcoat: string;
    casualOutdoor: string;
  };
  craft: {
    title: string;
    subtitle: string;
    cards: Array<{
      id: string;
      title: string;
      desc: string;
      image?: string;
      imageCaption?: string;
    }>;
  };
  rhythm: {
    title: string;
    subtitle: string;
    highlightTitle: string;
    highlightDesc: string;
    card1Title?: string;
    card1Desc?: string;
    card2Title?: string;
    card2Desc?: string;
    card3Title?: string;
    card3Desc?: string;
    extraCards?: Array<{
      id: string;
      title: string;
      desc: string;
      image: string;
    }>;
  };
  sundayRitual?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    moments: SundayMoment[];
  };
  valuesMirror?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    scenarios: ValuesMirrorScenario[];
  };
  voiceNote?: VoiceNoteMeta;
  partnerVision: {
    title: string;
    subtitle: string;
    pillars: Array<{
      num: string;
      title: string;
      desc: string;
    }>;
  };
  contact: {
    title: string;
    subtitle: string;
    notePlaceholder: string;
  };
  socials?: {
    linkedin?: string;
    tinder?: string;
    github?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  privateAlbum?: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
    photoCount?: number;
    categories?: string[];
  };
}

// Open-Source Default Profile Template
export const DEFAULT_PROFILE: ProfileConfig = getGenericStarterProfile("Alex");
export const AJAY_DEFAULT_PROFILE: ProfileConfig = DEFAULT_PROFILE;


// Neutral Generic Starter Template for 3rd Party Realm Creators
export function getGenericStarterProfile(displayName: string): ProfileConfig {
  const name = displayName.trim() || "Alex";
  return {
    name,
    tagline: "Product Designer & Builder",
    headline: "Looking for an honest, lasting partnership built on shared values.",
    bio1: `Hi, I'm ${name}. I made this personal page to share a bit more about what I do, how I live, and the kind of life I hope to build with someone.`,
    bio2: "The best relationships I know are built on honesty, direct communication, curiosity, and backing each other's goals.",
    specs: {
      height: "5'10\" (178 cm)",
      base: "City, Country",
      lifestyle: "Active & Balanced",
      career: "Engineering / Technology",
    },
    images: {
      // Aesthetic, neutral placeholders that invite uploading or customizing
      hero: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
      craftDesk: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80",
      friendsTrip: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80",
      formalWaistcoat: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
      casualOutdoor: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
    },
    craft: {
      title: "Work, Projects & Interests",
      subtitle: "How I approach my work, what keeps me curious, and what I enjoy outside the office.",
      cards: [
        {
          id: "core_craft",
          title: "Work & Problem Solving",
          desc: "Taking care with hard problems, keeping high standards, and never pretending I have everything figured out.",
        },
        {
          id: "curiosity",
          title: "Hobbies & Interests",
          desc: "Hands-on projects, staying active outdoors, and hobbies that get me away from screens.",
        },
        {
          id: "growth",
          title: "Mindset & Balance",
          desc: "Listening properly, staying steady when things get hectic, and keeping perspective.",
        },
      ],
    },
    rhythm: {
      title: "Daily life, travel, and weekends.",
      subtitle: "How I balance focused work weeks with time outdoors, good food, and recharging.",
      highlightTitle: "Weekend Trips & Downtime",
      highlightDesc: "I enjoy getting outside, finding good coffee spots, reading, and spending relaxed time with friends and family.",
    },
    sundayRitual: {
      enabled: true,
      title: "A Typical Sunday",
      subtitle: "Adjectives rarely tell you what living with someone actually feels like. Here is how a good Sunday goes for me.",
      moments: [
        {
          id: "morning",
          time: "08:00 AM",
          label: "Morning Routine",
          title: "Movement & Coffee",
          desc: "Starting early with a workout or walk, then making coffee before the day gets busy.",
          atmosphere: "Consistency & Fresh Air",
        },
        {
          id: "afternoon",
          time: "01:00 PM",
          label: "Slow Lunch",
          title: "Cooking & Offline Time",
          desc: "Cooking a proper meal from scratch, leaving phones in another room, and talking over lunch.",
          atmosphere: "Warmth & Presence",
        },
        {
          id: "evening",
          time: "05:30 PM",
          label: "Outdoors & Unwind",
          title: "Evening Drive or Reading",
          desc: "Taking a drive or walking through a park, then winding down with music or a book before Monday.",
          atmosphere: "Calm & Perspective",
        },
      ],
    },
    valuesMirror: {
      enabled: true,
      title: "Values & Communication Mirror",
      subtitle: "No compatibility scores or gimmicks, just a quick look at how we handle everyday situations.",
      scenarios: [
        {
          id: "conflict",
          topic: "Handling Disagreements",
          question: "When tension builds up over something small or serious, how do you naturally handle it?",
          options: [
            {
              id: "direct_calm",
              label: "Pause briefly if heated, then talk it out calmly and directly as a team.",
              shortTag: "Direct & Calm",
              ownerReflection: "We handle conflict the same way. Talking things through side by side works much better than silent treatment or keeping score.",
              harmonyLevel: "aligned",
            },
            {
              id: "space_first",
              label: "Take a little quiet time to gather thoughts before talking openly.",
              shortTag: "Reflective Space",
              ownerReflection: "That makes a lot of sense. Taking a breather before having an honest talk keeps things constructive instead of heated.",
              harmonyLevel: "aligned",
            },
            {
              id: "light_humor",
              label: "Use warmth and gentle humor to break the ice, then address the real issue.",
              shortTag: "Warmth First",
              ownerReflection: "Keeping perspective is a real strength. A little humor plus honesty keeps a relationship light without brushing issues aside.",
              harmonyLevel: "complementary",
            },
          ],
        },
        {
          id: "weekend_pace",
          topic: "Weekend Rhythm",
          question: "After a busy work week, what actually recharges you?",
          options: [
            {
              id: "slow_outdoors",
              label: "Easy mornings, cooking something fresh, and getting outdoors for a drive or walk.",
              shortTag: "Easygoing & Outdoors",
              ownerReflection: "That is pretty much my ideal Sunday. Slow mornings and time outside always reset my head.",
              harmonyLevel: "aligned",
            },
            {
              id: "balanced_mix",
              label: "One day out checking out new places or cafes, and one quiet day at home.",
              shortTag: "Balanced Mix",
              ownerReflection: "A great rhythm. Getting out on Saturday and keeping Sunday low-key gives the best of both.",
              harmonyLevel: "aligned",
            },
            {
              id: "social_energy",
              label: "Having close friends or family over for dinner and good conversation.",
              shortTag: "Hosting & Gatherings",
              ownerReflection: "I like small get-togethers with people we care about, especially around homemade food.",
              harmonyLevel: "complementary",
            },
          ],
        },
        {
          id: "partnership_balance",
          topic: "Ambition & Home Life",
          question: "How do you picture two careers fitting alongside building a shared home?",
          options: [
            {
              id: "equal_teammates",
              label: "Two independent people backing each other's work while sharing home responsibilities.",
              shortTag: "Equal Partnership",
              ownerReflection: "Completely on the same page. Both careers, interests, and voices should carry equal weight.",
              harmonyLevel: "aligned",
            },
            {
              id: "peace_first",
              label: "Work matters, as long as it does not crowd out kindness and a calm home.",
              shortTag: "Driven yet Grounded",
              ownerReflection: "I feel the exact same way. Ambition is great, as long as home stays a warm, restful place to come back to.",
              harmonyLevel: "aligned",
            },
            {
              id: "growth_seasons",
              label: "Stepping up to back whichever partner is in a demanding work stretch.",
              shortTag: "Flexible Support",
              ownerReflection: "Real teamwork is not always 50/50 on any single day. Sometimes one person covers more ground when the other is under pressure.",
              harmonyLevel: "complementary",
            },
          ],
        },
      ],
    },
    voiceNote: {
      enabled: true,
      title: `A Quick Voice Intro from ${name}`,
      subtitle: "Text does not always get tone across, so here is 30 seconds in my own voice.",
      requireUnlock: false,
      hasAudio: false,
    },
    partnerVision: {
      title: "What I Value in a Partner",
      subtitle: "The practical foundations that make everyday life together actually work:",
      pillars: [
        {
          num: "01",
          title: "Kindness & Emotional Maturity",
          desc: "Someone who says what she means, listens well, and brings warmth to everyday life.",
        },
        {
          num: "02",
          title: "Her Own Drive & Curiosity",
          desc: "A partner with her own work, interests, and point of view, where we genuinely cheer each other on.",
        },
        {
          num: "03",
          title: "Mutual Respect & Teamwork",
          desc: "An equal partnership where decisions are shared and both of us have each other's back.",
        },
        {
          num: "04",
          title: "A Steady, Grounded Home",
          desc: "Building a home built on trust, humor, clear boundaries, and peace of mind.",
        },
      ],
    },
    contact: {
      title: `Say Hello to ${name}`,
      subtitle: "If anything here caught your attention, send me a note. It goes straight to my private inbox.",
      notePlaceholder: "Say hi, introduce yourself, or ask me anything...",
    },
  };
}

/**
 * Deep-merge a stored ProfileConfig with a fallback template without dropping nested defaults.
 */
export function mergeProfileWithDefaults(base: ProfileConfig, stored: Partial<ProfileConfig>): ProfileConfig {
  return {
    ...base,
    ...stored,
    images: { ...base.images, ...(stored.images || {}) },
    specs: { ...base.specs, ...(stored.specs || {}) },
    craft: { ...base.craft, ...(stored.craft || {}) },
    rhythm: { ...base.rhythm, ...(stored.rhythm || {}) },
    sundayRitual: stored.sundayRitual
      ? {
          ...(base.sundayRitual || { enabled: true, title: "", subtitle: "", moments: [] }),
          ...stored.sundayRitual,
          moments:
            Array.isArray(stored.sundayRitual.moments) && stored.sundayRitual.moments.length > 0
              ? stored.sundayRitual.moments
              : base.sundayRitual?.moments || [],
        }
      : base.sundayRitual,
    valuesMirror: stored.valuesMirror
      ? {
          ...(base.valuesMirror || { enabled: true, title: "", subtitle: "", scenarios: [] }),
          ...stored.valuesMirror,
          scenarios:
            Array.isArray(stored.valuesMirror.scenarios) && stored.valuesMirror.scenarios.length > 0
              ? stored.valuesMirror.scenarios
              : base.valuesMirror?.scenarios || [],
        }
      : base.valuesMirror,
    voiceNote: stored.voiceNote
      ? { ...(base.voiceNote || { enabled: true, title: "" }), ...stored.voiceNote }
      : base.voiceNote,
    partnerVision: { ...base.partnerVision, ...(stored.partnerVision || {}) },
    contact: { ...base.contact, ...(stored.contact || {}) },
    socials: stored.socials !== undefined ? stored.socials : base.socials ? { ...base.socials } : undefined,
  };
}

/**
 * Load the current profile configuration from Redis or fallback to default
 */
export async function getActiveProfile(): Promise<ProfileConfig> {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const stored = await redis.get<ProfileConfig>("profile:config");
      if (stored && typeof stored === "object" && stored.name) {
        return mergeProfileWithDefaults(AJAY_DEFAULT_PROFILE, stored);
      }
    }
  } catch (error) {
    console.error("Failed to load profile from Redis:", error);
  }
  return AJAY_DEFAULT_PROFILE;
}

/**
 * Save updated profile configuration in Redis
 */
export async function saveActiveProfile(profile: ProfileConfig): Promise<boolean> {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      await redis.set("profile:config", profile);
      return true;
    }
  } catch (error) {
    console.error("Failed to save profile in Redis:", error);
  }
  return false;
}
