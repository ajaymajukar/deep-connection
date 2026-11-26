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
    tagline: "Product Designer & Curious Explorer",
    headline: "A quiet, intentional space to share who I am and what I value.",
    bio1: `Hi, I'm ${name}. I created this quiet personal realm to share a little bit about who I am, what I care about, and the kind of life and partnership I'm hoping to build.`,
    bio2: "I believe the best relationships are built on genuine honesty, emotional maturity, mutual curiosity, and supporting each other's dreams.",
    specs: {
      height: "5'10\" (178 cm)",
      base: "Bengaluru, India",
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
      title: "Work, Creativity & Craft",
      subtitle: "A glimpse into what I build, how I think, and what fuels my curiosity.",
      cards: [
        {
          id: "core_craft",
          title: "The Professional Craft",
          desc: "Solving complex problems with care and high standards. Taking genuine pride in what I build and continually learning.",
        },
        {
          id: "curiosity",
          title: "Passions & Hobbies",
          desc: "Engaging in creative projects, staying active outdoors, and pursuing interests that keep me energized.",
        },
        {
          id: "growth",
          title: "Mindset & Balance",
          desc: "Valuing active listening, emotional self-awareness, and bringing calm perspective into life.",
        },
      ],
    },
    rhythm: {
      title: "Daily rhythm, downtime, and weekends.",
      subtitle: "How I like to balance focused work with downtime, reflection, and recharging.",
      highlightTitle: "Weekend Trips & Quiet Discoveries",
      highlightDesc: "I enjoy getting outside, discovering cozy coffee spots, reading, and spending quality downtime with good people.",
    },
    sundayRitual: {
      enabled: true,
      title: "The Sunday Test: A Day in My World",
      subtitle: "Adjectives rarely show what daily life with someone feels like. Here is how an unhurried Sunday actually unfolds.",
      moments: [
        {
          id: "morning",
          time: "08:00 AM",
          label: "Morning Reset",
          title: "Quiet Movement & Fresh Brew",
          desc: "Starting early with a workout or walk, followed by freshly brewed coffee while the day is still calm and unhurried.",
          atmosphere: "Discipline & Fresh Air",
        },
        {
          id: "afternoon",
          time: "01:00 PM",
          label: "Slow Cooking",
          title: "Thoughtful Lunch & Offline Hours",
          desc: "Cooking a unhurried meal from scratch, putting phones aside, and enjoying honest conversation around the table.",
          atmosphere: "Warmth & Presence",
        },
        {
          id: "evening",
          time: "05:30 PM",
          label: "Outdoors & Unwind",
          title: "Scenic Drive or Quiet Recharge",
          desc: "Exploring a scenic overlook or park, followed by music, reading, and preparing calmly for the week ahead.",
          atmosphere: "Peace & Perspective",
        },
      ],
    },
    valuesMirror: {
      enabled: true,
      title: "Values & Communication Mirror",
      subtitle: "No matchmaking scores or gimmicks—explore how our instincts align across three everyday relationship scenarios.",
      scenarios: [
        {
          id: "conflict",
          topic: "Navigating Disagreements",
          question: "When tension builds up over something small or serious, how do you naturally resolve it?",
          options: [
            {
              id: "direct_calm",
              label: "Pause briefly if heated, then talk it out calmly and directly as a team.",
              shortTag: "Direct & Calm",
              ownerReflection: "We speak the exact same language. I believe in tackling problems side-by-side without silent treatments or scorekeeping.",
              harmonyLevel: "aligned",
            },
            {
              id: "space_first",
              label: "Take a little quiet space to gather thoughts before talking openly.",
              shortTag: "Reflective Space",
              ownerReflection: "That resonates strongly. Having a mindful pause before a thoughtful, honest talk avoids saying things out of frustration.",
              harmonyLevel: "aligned",
            },
            {
              id: "light_humor",
              label: "Use warmth and gentle humor to break the ice, then address the real issue.",
              shortTag: "Warmth First",
              ownerReflection: "Keeping perspective is a great strength. Warmth paired with genuine accountability keeps a relationship light yet honest.",
              harmonyLevel: "complementary",
            },
          ],
        },
        {
          id: "weekend_pace",
          topic: "Weekend Rhythm",
          question: "After a busy work week, what genuinely recharges your battery?",
          options: [
            {
              id: "slow_outdoors",
              label: "Slow mornings, cooking something fresh, and a peaceful outdoor drive or trail.",
              shortTag: "Unhurried & Outdoors",
              ownerReflection: "You've basically described my ideal Sunday. Slow mornings and fresh air keep me completely grounded.",
              harmonyLevel: "aligned",
            },
            {
              id: "balanced_mix",
              label: "One day out discovering new places or cafes, and one quiet day completely at home.",
              shortTag: "Balanced Mix",
              ownerReflection: "A healthy rhythm. Exploring together on Saturday and keeping Sunday calm gives us the best of both worlds.",
              harmonyLevel: "aligned",
            },
            {
              id: "social_energy",
              label: "Hosting close friends or family for dinner and lively conversation.",
              shortTag: "Hosting & Gatherings",
              ownerReflection: "I love small, intentional gatherings with people we genuinely care about—especially over good food.",
              harmonyLevel: "complementary",
            },
          ],
        },
        {
          id: "partnership_balance",
          topic: "Ambition & Sanctuary",
          question: "How do you picture career ambition fitting alongside building a shared home?",
          options: [
            {
              id: "equal_teammates",
              label: "Two independent equals cheering on each other's craft while sharing home responsibilities.",
              shortTag: "Equal Partnership",
              ownerReflection: "Completely aligned. I'm building an egalitarian partnership where both careers, hobbies, and voices carry equal weight.",
              harmonyLevel: "aligned",
            },
            {
              id: "peace_first",
              label: "Ambition matters deeply, as long as work never crowds out kindness and home peace.",
              shortTag: "Driven yet Grounded",
              ownerReflection: "Exactly my philosophy. Hard work fuels our goals, while mutual peace at home is what makes it all worthwhile.",
              harmonyLevel: "aligned",
            },
            {
              id: "growth_seasons",
              label: "Leaning in to support whichever partner is navigating an intense career season.",
              shortTag: "Flexible Support",
              ownerReflection: "True teamwork isn't always 50/50 every single day—sometimes it's covering 80% when the other person needs backing.",
              harmonyLevel: "complementary",
            },
          ],
        },
      ],
    },
    voiceNote: {
      enabled: true,
      title: `A Quick Voice Intro from ${name}`,
      subtitle: "Text rarely captures tone or warmth—here is 30 seconds in my own voice.",
      requireUnlock: false,
      hasAudio: false,
    },
    partnerVision: {
      title: "Qualities I Value in a Partner",
      subtitle: "The values and foundations I believe create a thriving, loving partnership:",
      pillars: [
        {
          num: "01",
          title: "Kindness & Emotional Depth",
          desc: "Someone who communicates openly, values empathy, and approaches life with warmth and understanding.",
        },
        {
          num: "02",
          title: "Shared Ambition & Growth",
          desc: "A partner who pursues her own passions, loves learning, and celebrates each other's personal and professional growth.",
        },
        {
          num: "03",
          title: "Mutual Respect & Teamwork",
          desc: "An equal partnership where decisions are shared, trust is standard, and we support each other through every chapter.",
        },
        {
          num: "04",
          title: "Peaceful & Grounded Life",
          desc: "Building a shared home grounded in peace, mutual trust, laughter, and healthy boundaries.",
        },
      ],
    },
    contact: {
      title: `Say Hello to ${name}`,
      subtitle: "If any part of my story or values resonated with you, I'd love to connect. Your note reaches my private inbox directly.",
      notePlaceholder: "Share a thought, introduce yourself, or tell me what resonated with you...",
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
