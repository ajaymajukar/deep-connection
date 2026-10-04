"use client";

import { useEffect, useState, useRef, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Compass,
  Heart,
  Cpu,
  ArrowRight,
  MapPin,
  Briefcase,
  Ruler,
  ChevronDown,
  Sparkles,
  Flame,
  ExternalLink
} from "lucide-react";
import { SOCIAL_CONFIGS } from "@/components/SocialIcons";
import TurnstileWidget from "@/components/TurnstileWidget";
import ContactSection from "@/components/ContactSection";
import { DEFAULT_PROFILE, ProfileConfig, getGenericStarterProfile } from "@/lib/profile";

function RealmStoryContent({ paramsPromise }: { paramsPromise: Promise<{ slug: string }> }) {
  const { slug } = use(paramsPromise);
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<ProfileConfig>(() =>
    slug === "ajay" ? DEFAULT_PROFILE : getGenericStarterProfile(slug)
  );
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const dwellTimesRef = useRef<Record<string, number>>({});
  const activeSectionsRef = useRef<Set<string>>(new Set());
  const viewedSectionsRef = useRef<Set<string>>(new Set());

  // 1. Fetch live dynamic profile for this realm
  useEffect(() => {
    fetch(`/api/realms/${slug}/profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setProfile(data);
        }
      })
      .catch((err) => console.warn("Using fallback profile:", err));
  }, [slug]);

  // 2. Track initial page view via headers & document.referrer (No ?ref needed!)
  useEffect(() => {
    const queryRef = searchParams?.get("ref") || null;
    const clientRef = typeof document !== "undefined" ? document.referrer || null : null;

    fetch(`/api/realms/${slug}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: `/${slug}/story`,
        clientReferrer: queryRef || clientRef,
      }),
    }).catch(() => {});
  }, [slug, searchParams]);

  // 3. Section Dwell Tracking & IntersectionObserver
  useEffect(() => {
    const sections = ["hero", "craft", "rhythm", "vision", "connect"];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute("data-section");
          if (!sectionId) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
            activeSectionsRef.current.add(sectionId);
            viewedSectionsRef.current.add(sectionId);
          } else {
            activeSectionsRef.current.delete(sectionId);
          }
        });
      },
      { threshold: [0.25, 0.5] }
    );

    sections.forEach((id) => {
      const el = document.querySelector(`[data-section="${id}"]`);
      if (el) observer.observe(el);
    });

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        activeSectionsRef.current.forEach((sectionId) => {
          dwellTimesRef.current[sectionId] = (dwellTimesRef.current[sectionId] || 0) + 1;
        });
      }
    }, 1000);

    const flushDwellData = () => {
      const currentDwell = { ...dwellTimesRef.current };
      const currentViewed = Array.from(viewedSectionsRef.current);

      if (Object.keys(currentDwell).length === 0 && currentViewed.length === 0) return;

      const payload = JSON.stringify({
        dwellSeconds: currentDwell,
        viewedSections: currentViewed,
      });

      dwellTimesRef.current = {};

      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/realms/${slug}/dwell`, payload);
      } else {
        fetch(`/api/realms/${slug}/dwell`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const flushInterval = setInterval(flushDwellData, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDwellData();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", flushDwellData);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearInterval(flushInterval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", flushDwellData);
      flushDwellData();
    };
  }, [slug]);

  const handleTurnstileSuccess = async (token: string) => {
    setTurnstileToken(token);
    try {
      const res = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVerified(true);
      } else {
        setVerificationError("Bot verification failed. Please try again.");
      }
    } catch {
      setIsVerified(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Bot Check Gate */}
      {!isVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
          <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {profile.name}&apos;s Story
            </h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              A private, intentional space to share who I am, what I build, and the life partner I&apos;m seeking.
            </p>

            <div className="my-6 py-4 px-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col items-center justify-center">
              <p className="text-xs text-zinc-500 mb-2 font-medium">Quick bot check — zero email required:</p>
              <TurnstileWidget
                onVerify={handleTurnstileSuccess}
                onError={(err) => setVerificationError(err)}
              />
            </div>

            {verificationError && (
              <p className="text-xs text-rose-400 mb-4">{verificationError}</p>
            )}

            <button
              onClick={() => setIsVerified(true)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition underline underline-offset-4 cursor-pointer"
            >
              Skip verification for preview
            </button>
          </div>
        </div>
      )}

      {/* Main Story Container */}
      <div className={`transition-opacity duration-700 ${isVerified ? "opacity-100" : "opacity-20 blur-sm pointer-events-none"}`}>
        <header className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold tracking-tight text-zinc-100">
                {profile.name}<span className="text-emerald-400">.</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                <MapPin className="w-3 h-3 text-emerald-400" /> {profile.specs.base}
              </span>
            </div>

            <a
              href="#connect"
              className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium transition flex items-center gap-1.5"
            >
              Say Hello <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section data-section="hero" className="relative pt-12 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 relative group">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
                <Image
                  src={profile.images.hero}
                  alt={`${profile.name} portrait`}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                  className="object-cover group-hover:scale-105 transition duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80">
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {profile.name} • {profile.specs.height}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Briefcase className="w-3.5 h-3.5" /> {profile.tagline}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-tight">
                {profile.headline}
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
                {profile.bio1}
              </p>

              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {profile.bio2}
              </p>

              {/* Dynamic Quick Specs */}
              {(Boolean(profile.specs?.height?.trim()) ||
                Boolean(profile.specs?.base?.trim()) ||
                Boolean(profile.specs?.lifestyle?.trim())) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {profile.specs?.height?.trim() && (
                    <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                      <Ruler className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Height</div>
                        <div className="text-xs font-semibold text-zinc-200">{profile.specs.height}</div>
                      </div>
                    </div>
                  )}

                  {profile.specs?.base?.trim() && (
                    <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Base</div>
                        <div className="text-xs font-semibold text-zinc-200">{profile.specs.base}</div>
                      </div>
                    </div>
                  )}

                  {profile.specs?.lifestyle?.trim() && (
                    <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3 col-span-2 sm:col-span-1">
                      <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Lifestyle</div>
                        <div className="text-xs font-semibold text-zinc-200">{profile.specs.lifestyle}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Social & Direct Presence Links */}
              {(() => {
                const activePlatforms = SOCIAL_CONFIGS.filter(
                  (s) => profile.socials?.[s.key] && profile.socials[s.key]!.trim().length > 0
                );
                if (activePlatforms.length === 0) return null;

                return (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {activePlatforms.map((s) => {
                      const Icon = s.icon;
                      const url = profile.socials![s.key]!;
                      const href = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
                      return (
                        <a
                          key={s.key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition group ${s.badgeClass}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${s.color} group-hover:scale-110 transition`} />
                          <span>{s.label}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </a>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="pt-2">
                <a
                  href="#partner-vision"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
                >
                  Explore what I&apos;m looking for <ChevronDown className="w-4 h-4 animate-bounce" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: The Craft & Engineering */}
        <section data-section="craft" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Cpu className="w-4 h-4" /> The Craft & Engineering
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              {profile.craft.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              {profile.craft.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative aspect-video sm:aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900">
              <Image
                src={profile.images.craftDesk}
                alt="Workspace and research lab"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 text-xs font-medium text-zinc-300">
                The Lab: Multi-monitor research battle station
              </div>
            </div>

            <div className="space-y-4">
              {profile.craft.cards.map((card, idx) => (
                <div key={card.id || idx} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/70">
                  <h3 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Visual Moments & Life Rhythm */}
        <section data-section="rhythm" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Compass className="w-4 h-4" /> Rhythm & Downtime
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              {profile.rhythm.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              {profile.rhythm.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.friendsTrip}
                  alt="Exploring outdoors with friends"
                  fill
                  sizes="350px"
                  className="object-cover group-hover:scale-105 transition duration-500 ease-out"
                />
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {profile.rhythm.card1Title || "The Starting Point (04 Mar 2024)"}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">
                  {profile.rhythm.card1Desc || "Where the commitment began. Deciding to reclaim my health, stamina, and discipline."}
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.formalWaistcoat}
                  alt="Transformation milestone"
                  fill
                  sizes="350px"
                  className="object-cover group-hover:scale-105 transition duration-500 ease-out"
                />
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {profile.rhythm.card2Title || "Six Months of Grit (12 Sep 2024)"}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">
                  {profile.rhythm.card2Desc || "Proof of follow-through. Not at my absolute peak yet, but living proof that when I take something to heart, I see it through no matter what."}
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.casualOutdoor}
                  alt="Active coastal travels"
                  fill
                  sizes="350px"
                  className="object-cover group-hover:scale-105 transition duration-500 ease-out"
                />
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {profile.rhythm.card3Title || "Active Living & True Friends"}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">
                  {profile.rhythm.card3Desc || "Coastal trails, fresh sea breezes, and genuine friendships that keep life grounded and fun."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Life Partner Vision */}
        <section id="partner-vision" data-section="vision" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Heart className="w-4 h-4" /> Partnership Vision
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              {profile.partnerVision.title}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
              {profile.partnerVision.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.partnerVision.pillars.map((pillar, idx) => (
              <div key={pillar.num || idx} className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  {pillar.num}
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Direct Connection Box */}
        <ContactSection
          slug={slug}
          ownerName={profile.name}
          title={profile.contact.title}
          subtitle={profile.contact.subtitle}
          notePlaceholder={profile.contact.notePlaceholder}
          turnstileToken={turnstileToken}
        />

        {/* Realm Growth & Open-Source Discovery Card */}
        <section className="py-12 px-4 max-w-xl mx-auto text-center">
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">
              Want your own personal Story Realm?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              Cut through superficial swiping apps and arranged marriage queues. Create your own private, intentional matchmaking page with zero-surname privacy and in-context visual editing.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/create"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Launch Your Realm <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="https://github.com/ajaymajukar/deep-connection"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition flex items-center gap-1.5 border border-zinc-700/60 cursor-pointer"
              >
                Self-Host on GitHub
              </a>
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-zinc-900 text-center text-xs text-zinc-600">
          <p>Curated & built by {profile.name} • {profile.specs.base}</p>
          <p className="mt-1">Realm: /{slug} • Zero commercial tracking</p>
        </footer>
      </div>
    </div>
  );
}

export default function RealmStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading Story Realm...</div>}>
      <RealmStoryContent paramsPromise={params} />
    </Suspense>
  );
}
