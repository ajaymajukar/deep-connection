import redis from "./redis";

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
  };
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
 * Load the current profile configuration from Redis or fallback to default
 */
export async function getActiveProfile(): Promise<ProfileConfig> {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const stored = await redis.get<ProfileConfig>("profile:config");
      if (stored && typeof stored === "object" && stored.name) {
        return {
          ...AJAY_DEFAULT_PROFILE,
          ...stored,
          images: { ...AJAY_DEFAULT_PROFILE.images, ...(stored.images || {}) },
          specs: { ...AJAY_DEFAULT_PROFILE.specs, ...(stored.specs || {}) },
          craft: { ...AJAY_DEFAULT_PROFILE.craft, ...(stored.craft || {}) },
          rhythm: { ...AJAY_DEFAULT_PROFILE.rhythm, ...(stored.rhythm || {}) },
          partnerVision: { ...AJAY_DEFAULT_PROFILE.partnerVision, ...(stored.partnerVision || {}) },
          contact: { ...AJAY_DEFAULT_PROFILE.contact, ...(stored.contact || {}) },
          socials: { ...AJAY_DEFAULT_PROFILE.socials, ...(stored.socials || {}) },
        };
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
