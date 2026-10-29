import { getRealmProfile } from "@/lib/realms";
import { DEFAULT_PROFILE, ProfileConfig } from "@/lib/profile";
import {
  MapPin,
  Ruler,
  Briefcase,
  ShieldCheck,
  Cpu,
  Heart,
  Compass,
  Lock,
  Sparkles,
  Utensils,
  Flame,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RealmCardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { slug } = await params;
  const { mode = "unrevealed" } = await searchParams;
  const isRevealed = mode === "revealed";

  let profile: ProfileConfig = DEFAULT_PROFILE;
  try {
    profile = await getRealmProfile(slug);
  } catch (e) {
    console.warn("Failed to load profile for cards, using default:", e);
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 flex flex-col items-center gap-12 py-8 min-h-screen">
      {/* CARD 1: INTRO & VIBE (1080 x 1920) */}
      <div
        id="story-card-1"
        style={{ width: "1080px", height: "1920px" }}
        className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-16 flex flex-col justify-between overflow-hidden border border-zinc-800 shadow-2xl shrink-0"
      >
        {/* Subtle Background Glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-100">
              {profile.name}
              <span className="text-emerald-400">.</span>
            </span>
            <span className="px-4 py-1.5 rounded-full text-lg font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              01 / 04 • Introduction
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 px-5 py-2 rounded-full text-lg font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
              <MapPin className="w-5 h-5 text-emerald-400" /> {profile.specs.base}
            </span>
            <span className="flex items-center gap-2 px-5 py-2 rounded-full text-lg font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Ruler className="w-5 h-5 text-emerald-400" /> {profile.specs.height}
            </span>
          </div>
        </div>

        {/* Hero Photo Section */}
        <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.images.hero}
            alt={profile.name}
            className={`w-full h-full object-cover ${
              isRevealed ? "blur-0 scale-100" : "blur-3xl scale-110"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

          {!isRevealed ? (
            <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-6 shadow-xl">
                <Lock className="w-12 h-12" />
              </div>
              <span className="text-3xl font-bold text-zinc-100">Photo Protected</span>
              <p className="text-xl text-zinc-300 mt-3 max-w-md leading-relaxed">
                Photos are kept private for reciprocity. Unlocks instantly upon mutual exchange.
              </p>
              <div className="mt-6 px-6 py-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-lg font-semibold">
                Mutual Reciprocity 🤝
              </div>
            </div>
          ) : (
            <div className="absolute bottom-6 left-8 px-6 py-3 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80">
              <span className="text-xl font-semibold text-zinc-200 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                {profile.name} • {profile.specs.height}
              </span>
            </div>
          )}
        </div>

        {/* Headline & Bios */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full text-lg font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Briefcase className="w-5 h-5" /> {profile.tagline}
          </div>

          <h2 className="text-5xl font-black tracking-tight text-zinc-100 leading-tight">
            {profile.headline}
          </h2>

          <p className="text-2xl text-zinc-300 leading-relaxed font-normal">
            {profile.bio1}
          </p>

          <p className="text-xl text-zinc-400 leading-relaxed">
            {profile.bio2}
          </p>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Base</div>
              <div className="text-xl font-bold text-zinc-200 mt-1">{profile.specs.base}</div>
            </div>
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Lifestyle</div>
              <div className="text-xl font-bold text-zinc-200 mt-1">{profile.specs.lifestyle}</div>
            </div>
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Career</div>
              <div className="text-xl font-bold text-zinc-200 mt-1">{profile.specs.career}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-6 flex items-center justify-between text-zinc-400 text-lg">
          <span>Personal Dating Deck</span>
          <span className="font-semibold text-emerald-400">Swipe for Craft & Mindset →</span>
        </div>
      </div>

      {/* CARD 2: CRAFT & ENGINEERING MINDSET (1080 x 1920) */}
      <div
        id="story-card-2"
        style={{ width: "1080px", height: "1920px" }}
        className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-16 flex flex-col justify-between overflow-hidden border border-zinc-800 shadow-2xl shrink-0"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-100">
              {profile.name}
              <span className="text-emerald-400">.</span>
            </span>
            <span className="px-4 py-1.5 rounded-full text-lg font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              02 / 04 • Craft & Mindset
            </span>
          </div>
          <span className="px-5 py-2 rounded-full text-lg font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
            {profile.specs.career}
          </span>
        </div>

        {/* Header */}
        <div className="space-y-4 my-4">
          <span className="text-lg font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-2">
            <Cpu className="w-5 h-5" /> Professional Focus & Philosophy
          </span>
          <h2 className="text-5xl font-black text-zinc-100 leading-tight">
            {profile.craft.title || "Crafting Resilient Systems & Intentional Work"}
          </h2>
          <p className="text-2xl text-zinc-400 leading-relaxed">
            {profile.craft.subtitle || "How I approach complex engineering challenges, problem-solving, and continuous growth."}
          </p>
        </div>

        {/* Workstation Photo */}
        <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.images.craftDesk}
            alt="Work setup"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-6 px-4 py-2 rounded-xl bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 text-base font-medium text-zinc-300">
            Focus Space • Multi-monitor engineering and research workstation
          </div>
        </div>

        {/* Craft Cards Grid */}
        <div className="space-y-6 my-4">
          {profile.craft.cards.slice(0, 3).map((card, idx) => (
            <div
              key={card.id || idx}
              className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80"
            >
              <h3 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                {card.title}
              </h3>
              <p className="mt-2 text-xl text-zinc-400 leading-relaxed font-normal">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Philosophy Card */}
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
          <p className="text-xl font-medium leading-relaxed italic">
            &ldquo;Building quiet, reliable systems by day; keeping an authentic, grounded life by night.&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-6 flex items-center justify-between text-zinc-400 text-lg">
          <span>Personal Dating Deck</span>
          <span className="font-semibold text-emerald-400">Swipe for Partnership Vision →</span>
        </div>
      </div>

      {/* CARD 3: PARTNERSHIP & CORE VALUES (1080 x 1920) */}
      <div
        id="story-card-3"
        style={{ width: "1080px", height: "1920px" }}
        className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-16 flex flex-col justify-between overflow-hidden border border-zinc-800 shadow-2xl shrink-0"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-100">
              {profile.name}
              <span className="text-emerald-400">.</span>
            </span>
            <span className="px-4 py-1.5 rounded-full text-lg font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              03 / 04 • Partnership Vision
            </span>
          </div>
          <span className="px-5 py-2 rounded-full text-lg font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
            Equal Partnership
          </span>
        </div>

        {/* Header */}
        <div className="space-y-4 my-6">
          <span className="text-lg font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-2">
            <Heart className="w-5 h-5" /> What I Value Most in a Partner
          </span>
          <h2 className="text-5xl font-black text-zinc-100 leading-tight">
            {profile.partnerVision.title || "Building an Equal, Intentional Partnership"}
          </h2>
          <p className="text-2xl text-zinc-400 leading-relaxed">
            {profile.partnerVision.subtitle || "Beyond checklists—what actually matters when life settles into quiet daily rhythms."}
          </p>
        </div>

        {/* Vision Pillars (4 Pillars) */}
        <div className="space-y-6 my-auto">
          {profile.partnerVision.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl font-black shrink-0">
                {pillar.num || `0${idx + 1}`}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-100">{pillar.title}</h3>
                <p className="mt-2 text-xl text-zinc-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 flex items-center gap-4">
          <Sparkles className="w-8 h-8 text-emerald-400 shrink-0" />
          <p className="text-xl">
            Looking for a best friend, intellectual equal, and reliable teammate to navigate life with.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-6 flex items-center justify-between text-zinc-400 text-lg">
          <span>Personal Dating Deck</span>
          <span className="font-semibold text-emerald-400">Swipe for Life Rhythm & Photos →</span>
        </div>
      </div>

      {/* CARD 4: RHYTHM & DOWNTIME (1080 x 1920) */}
      <div
        id="story-card-4"
        style={{ width: "1080px", height: "1920px" }}
        className="relative bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-16 flex flex-col justify-between overflow-hidden border border-zinc-800 shadow-2xl shrink-0"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-8">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-zinc-100">
              {profile.name}
              <span className="text-emerald-400">.</span>
            </span>
            <span className="px-4 py-1.5 rounded-full text-lg font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              04 / 04 • Life Rhythm & Downtime
            </span>
          </div>
          <span className="px-5 py-2 rounded-full text-lg font-medium bg-zinc-900 border border-zinc-800 text-zinc-300">
            Western Ghats & Travel
          </span>
        </div>

        {/* Header */}
        <div className="space-y-4 my-4">
          <span className="text-lg font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-2">
            <Compass className="w-5 h-5" /> Outside of Work & Screen Time
          </span>
          <h2 className="text-5xl font-black text-zinc-100 leading-tight">
            {profile.rhythm.title || "Visual Rhythm & Quiet Hours"}
          </h2>
          <p className="text-2xl text-zinc-400 leading-relaxed">
            {profile.rhythm.subtitle || "Road trips into the misty ghats, fresh morning air, and simple unhurried conversations."}
          </p>
        </div>

        {/* Lifestyle Photos (2 Photos) */}
        <div className="grid grid-cols-2 gap-6 my-4">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.images.friendsTrip}
              alt="Western Ghats Drive"
              className={`w-full h-full object-cover ${
                isRevealed ? "blur-0 scale-100" : "blur-3xl scale-110"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            {!isRevealed ? (
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                <Lock className="w-10 h-10 text-amber-400 mb-2" />
                <span className="text-lg font-bold text-zinc-200">Locked Photo</span>
                <span className="text-sm text-zinc-400 mt-1">Reciprocal unlock</span>
              </div>
            ) : (
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-zinc-950/80 backdrop-blur-sm text-sm text-zinc-300">
                Western Ghats drives & misty mountain viewpoints
              </div>
            )}
          </div>

          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.images.formalWaistcoat || profile.images.casualOutdoor}
              alt="Rituals & Gatherings"
              className={`w-full h-full object-cover ${
                isRevealed ? "blur-0 scale-100" : "blur-3xl scale-110"
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
            {!isRevealed ? (
              <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                <Lock className="w-10 h-10 text-amber-400 mb-2" />
                <span className="text-lg font-bold text-zinc-200">Locked Photo</span>
                <span className="text-sm text-zinc-400 mt-1">Reciprocal unlock</span>
              </div>
            ) : (
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-zinc-950/80 backdrop-blur-sm text-sm text-zinc-300">
                Quiet downtime & meaningful celebrations
              </div>
            )}
          </div>
        </div>

        {/* Highlight Description */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80">
          <h4 className="text-2xl font-bold text-zinc-100">
            {profile.rhythm.highlightTitle || "Belagavi & Ghats Threshold"}
          </h4>
          <p className="mt-2 text-xl text-zinc-400 leading-relaxed">
            {profile.rhythm.highlightDesc || "Living at the foothills of the Western Ghats means clean air, endless trails, and peaceful road trips whenever I need to recharge."}
          </p>
        </div>

        {/* Action Callout */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-emerald-500/30 text-center">
          {!isRevealed ? (
            <div>
              <h3 className="text-3xl font-extrabold text-emerald-300">
                Liked the vibe? Let&apos;s exchange photos! 🤝
              </h3>
              <p className="text-xl text-zinc-300 mt-2">
                Drop your photo in chat and I&apos;ll immediately share my full unblurred album.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-3xl font-extrabold text-emerald-300">
                Looking forward to saying hello! ✨
              </h3>
              <p className="text-xl text-zinc-300 mt-2">
                Drop me a message in chat—excited to learn more about you.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-6 flex items-center justify-between text-zinc-400 text-lg">
          <span>Personal Dating Deck</span>
          <span className="font-semibold text-emerald-400">End of Deck • 04 / 04</span>
        </div>
      </div>
    </div>
  );
}
