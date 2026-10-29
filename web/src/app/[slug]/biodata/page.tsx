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
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RealmBiodataPage({
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
    console.warn("Failed to load profile for biodata, using default:", e);
  }

  // Enforce server-side physical blur: when unrevealed, use the server-blurred raster
  const heroImage = isRevealed
    ? profile.images.hero
    : `/api/realms/${slug}/image?key=hero&mode=unrevealed`;

  const friendsTripImage = isRevealed
    ? profile.images.friendsTrip
    : `/api/realms/${slug}/image?key=friendsTrip&mode=unrevealed`;

  const secondaryLifestyleImage = isRevealed
    ? profile.images.formalWaistcoat || profile.images.casualOutdoor
    : `/api/realms/${slug}/image?key=formalWaistcoat&mode=unrevealed`;

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen py-10 px-4 print:p-0 print:bg-zinc-950 flex flex-col items-center">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 10mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>

      {/* A4 PAGE 1: EXECUTIVE PROFILE & BIOGRAPHY */}
      <div
        id="biodata-page-1"
        style={{ width: "210mm", minHeight: "297mm" }}
        className="page-break bg-zinc-950 text-zinc-100 p-12 border border-zinc-850 shadow-2xl flex flex-col justify-between mb-8 print:mb-0 print:border-none print:shadow-none"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">
                {profile.name}
                <span className="text-emerald-400">.</span>
              </h1>
              <p className="text-sm text-emerald-400 font-medium mt-0.5">
                {profile.tagline} • {profile.specs.career}
              </p>
            </div>
            <div className="text-right text-xs text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 justify-end">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {profile.specs.base}
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Ruler className="w-3.5 h-3.5 text-emerald-400" /> {profile.specs.height}
              </div>
            </div>
          </div>

          {/* Profile Hero & Overview */}
          <div className="grid grid-cols-12 gap-8 items-start mb-8">
            <div className="col-span-5">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={profile.name}
                  className={`w-full h-full object-cover ${
                    isRevealed ? "blur-0" : "blur-2xl scale-110"
                  }`}
                />
                {!isRevealed ? (
                  <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-sm font-bold text-zinc-200">Photo Protected</span>
                    <span className="text-xs text-zinc-400 mt-1 max-w-[140px]">
                      Mutual exchange upon request 🤝
                    </span>
                  </div>
                ) : (
                  <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 backdrop-blur-sm text-center text-xs font-medium text-zinc-200">
                    {profile.name} • {profile.specs.height}
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-7 space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-100 leading-snug">
                {profile.headline}
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                {profile.bio1}
              </p>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {profile.bio2}
              </p>

              {/* Quick Specs Matrix */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    Location Base
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {profile.specs.base}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    Physical Height
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {profile.specs.height}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    Lifestyle & Habits
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {profile.specs.lifestyle}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                    Profession & Craft
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mt-0.5">
                    {profile.specs.career}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Craft & Engineering Highlight */}
          <div className="border-t border-zinc-850 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4" /> Professional Focus & Mindset
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              {profile.craft.subtitle || "A deliberate approach to technology, engineering resilience, and clean systems."}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {profile.craft.cards.slice(0, 2).map((card, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {card.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Page 1 */}
        <div className="border-t border-zinc-850 pt-4 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{profile.name} • Matchmaking & Life Portfolio</span>
          <span>Page 1 of 2</span>
        </div>
      </div>

      {/* A4 PAGE 2: PARTNERSHIP VISION & LIFE RHYTHM */}
      <div
        id="biodata-page-2"
        style={{ width: "210mm", minHeight: "297mm" }}
        className="page-break bg-zinc-950 text-zinc-100 p-12 border border-zinc-850 shadow-2xl flex flex-col justify-between print:border-none print:shadow-none"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
            <span className="text-sm font-bold text-zinc-400">
              {profile.name}<span className="text-emerald-400">.</span> Portfolio
            </span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Partnership Vision & Life Rhythm
            </span>
          </div>

          {/* Section 1: Partnership Vision */}
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-emerald-400" />
              {profile.partnerVision.title || "Equal & Modern Partnership"}
            </h2>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              {profile.partnerVision.subtitle || "The core values and mutual respect that form the foundation of a lasting bond."}
            </p>

            <div className="grid grid-cols-2 gap-4">
              {profile.partnerVision.pillars.map((pillar, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {pillar.num || `0${idx + 1}`}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">{pillar.title}</h3>
                    <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Life Rhythm & Downtime */}
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-emerald-400" />
              {profile.rhythm.title || "Life Rhythm & Outside of Work"}
            </h2>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              {profile.rhythm.subtitle || "Peaceful mountain drives, coffee rituals, and grounding downtime."}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={friendsTripImage}
                  alt="Western Ghats Drive"
                  className={`w-full h-full object-cover ${
                    isRevealed ? "blur-0" : "blur-2xl scale-110"
                  }`}
                />
                {!isRevealed ? (
                  <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
                    <Lock className="w-5 h-5 text-amber-400 mb-1" />
                    <span className="text-[11px] font-semibold text-zinc-300">Western Ghats</span>
                    <span className="text-[9px] text-zinc-500">Mutual exchange</span>
                  </div>
                ) : (
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-zinc-950/80 backdrop-blur-sm text-[10px] text-zinc-300">
                    Western Ghats drives & viewpoint trails
                  </div>
                )}
              </div>

              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={secondaryLifestyleImage}
                  alt="Downtime"
                  className={`w-full h-full object-cover ${
                    isRevealed ? "blur-0" : "blur-2xl scale-110"
                  }`}
                />
                {!isRevealed ? (
                  <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
                    <Lock className="w-5 h-5 text-amber-400 mb-1" />
                    <span className="text-[11px] font-semibold text-zinc-300">Quiet Downtime</span>
                    <span className="text-[9px] text-zinc-500">Mutual exchange</span>
                  </div>
                ) : (
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-zinc-950/80 backdrop-blur-sm text-[10px] text-zinc-300">
                    Meaningful celebrations & simple rituals
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-200">
                {profile.rhythm.highlightTitle || "Belagavi & Ghats Threshold"}
              </h4>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                {profile.rhythm.highlightDesc || "Living at the threshold of the Western Ghats provides the perfect balance of focused quiet work and open nature."}
              </p>
            </div>
          </div>

          {/* Reciprocal Exchange Callout */}
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {!isRevealed ? "Reciprocal Photo Exchange" : "Direct Connection"}
              </h4>
              <p className="text-[11px] text-zinc-300 mt-1 max-w-md">
                {!isRevealed
                  ? "To preserve comfort and mutual respect, full photos are shared in return upon exchanging yours."
                  : "Thank you for reviewing my story. Looking forward to speaking directly."}
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {!isRevealed ? "Mutual Exchange 🤝" : "Say Hello ✨"}
            </div>
          </div>
        </div>

        {/* Footer Page 2 */}
        <div className="border-t border-zinc-850 pt-4 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{profile.name} • Matchmaking & Life Portfolio</span>
          <span>Page 2 of 2</span>
        </div>
      </div>
    </div>
  );
}
