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
  Utensils,
  ExternalLink,
  Lock,
  Unlock
} from "lucide-react";
import { SOCIAL_CONFIGS } from "@/components/SocialIcons";
import TurnstileWidget from "@/components/TurnstileWidget";
import ContactSection from "@/components/ContactSection";
import MutualPhotoReveal from "@/components/MutualPhotoReveal";
import SundayRitualSection from "@/components/SundayRitualSection";
import ValuesMirrorSection from "@/components/ValuesMirrorSection";
import VoiceIntroPlayer from "@/components/VoiceIntroPlayer";
import { DEFAULT_PROFILE, ProfileConfig, getGenericStarterProfile } from "@/lib/profile";

interface ActiveVipInvite {
  id: string;
  guestName: string;
  source: string;
  personalNote?: string;
  bypassTurnstile: boolean;
  unlockPhotos: boolean;
  unlockSocials: boolean;
}

function RealmStoryContent({ paramsPromise }: { paramsPromise: Promise<{ slug: string }> }) {
  const { slug } = use(paramsPromise);
  const searchParams = useSearchParams();
  const isExport = searchParams?.get("export") === "true";
  const exportMode = searchParams?.get("mode");
  const inviteParam = searchParams?.get("invite");

  const [profile, setProfile] = useState<ProfileConfig>(() =>
    slug === "ajay" ? DEFAULT_PROFILE : getGenericStarterProfile(slug)
  );
  const [isVerified, setIsVerified] = useState<boolean>(() => Boolean(isExport || searchParams?.get("preview") === "true"));
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isPhotoUnlocked, setIsPhotoUnlocked] = useState<boolean>(false);
  const [activeInvite, setActiveInvite] = useState<ActiveVipInvite | null>(null);
  const [activeInviteToken, setActiveInviteToken] = useState<string | null>(null);
  const [activeUnlockToken, setActiveUnlockToken] = useState<string | null>(null);

  const dwellTimesRef = useRef<Record<string, number>>({});
  const activeSectionsRef = useRef<Set<string>>(new Set());
  const viewedSectionsRef = useRef<Set<string>>(new Set());

  // Check if visitor has already completed mutual reveal or holds a VIP Realm Key
  useEffect(() => {
    if (isExport) {
      setIsVerified(true);
      const adminKey = searchParams?.get("key") || searchParams?.get("token");
      if (exportMode === "revealed" && adminKey) {
        setIsPhotoUnlocked(true);
      }
      return;
    }

    try {
      const storedToken = sessionStorage.getItem(`unlocked_token_${slug}`);
      if (storedToken) {
        setActiveUnlockToken(storedToken);
        setIsPhotoUnlocked(true);
      }
    } catch {
      // Ignore
    }

    // Validate VIP Realm Invite key if present in URL or sessionStorage
    const resolvedInviteToken =
      inviteParam ||
      (typeof window !== "undefined" ? sessionStorage.getItem(`invite_token_${slug}`) : null);

    if (resolvedInviteToken) {
      setActiveInviteToken(resolvedInviteToken);
      const isFreshUrlInvite = Boolean(inviteParam);
      fetch(
        `/api/realms/${slug}/invites?token=${encodeURIComponent(resolvedInviteToken)}${
          isFreshUrlInvite ? "" : "&peek=true"
        }`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data?.valid && data.invite) {
            setActiveInvite(data.invite);
            try {
              sessionStorage.setItem(`invite_token_${slug}`, resolvedInviteToken);
            } catch {
              // Ignore
            }
            if (data.invite.bypassTurnstile) {
              setIsVerified(true);
            }
            if (data.invite.unlockPhotos) {
              setIsPhotoUnlocked(true);
              if (data.unlockToken) {
                setActiveUnlockToken(data.unlockToken);
                try {
                  sessionStorage.setItem(`unlocked_token_${slug}`, data.unlockToken);
                  if (Array.isArray(data.album)) {
                    sessionStorage.setItem(`unlocked_album_${slug}`, JSON.stringify(data.album));
                  }
                } catch {
                  // Ignore
                }
                window.dispatchEvent(
                  new CustomEvent("mutual-reveal-unlocked", {
                    detail: { album: data.album || [], unlockToken: data.unlockToken },
                  })
                );
              }
            }
          }
        })
        .catch(() => {});
    }

    const handleUnlocked = (e: any) => {
      setIsPhotoUnlocked(true);
      const token = e.detail?.unlockToken;
      if (token) {
        setActiveUnlockToken(token);
        try {
          sessionStorage.setItem(`unlocked_token_${slug}`, token);
        } catch {
          // Ignore
        }
        // Refetch profile with unlock token so server provides crystal-clear photo URLs & allowed socials
        fetch(`/api/realms/${slug}/profile?unlockToken=${encodeURIComponent(token)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.name) {
              setProfile(data);
            }
          })
          .catch((err) => console.warn("Failed to refetch revealed profile:", err));
      }
    };

    window.addEventListener("mutual-reveal-unlocked", handleUnlocked);
    return () => window.removeEventListener("mutual-reveal-unlocked", handleUnlocked);
  }, [slug, isExport, exportMode, inviteParam, searchParams]);

  const triggerMutualReveal = () => {
    window.dispatchEvent(new CustomEvent("open-mutual-reveal"));
  };

  // 1. Fetch live dynamic profile for this realm (passing auth/unlock/invite credentials if available)
  useEffect(() => {
    const adminKey = searchParams?.get("key") || searchParams?.get("token");
    const unlockToken =
      activeUnlockToken ||
      (typeof window !== "undefined" ? sessionStorage.getItem(`unlocked_token_${slug}`) : null);
    const invToken =
      inviteParam ||
      activeInviteToken ||
      (typeof window !== "undefined" ? sessionStorage.getItem(`invite_token_${slug}`) : null);

    const params = new URLSearchParams();
    if (adminKey) params.set("key", adminKey);
    if (unlockToken) params.set("unlockToken", unlockToken);
    if (invToken) params.set("invite", invToken);
    const qs = params.toString();
    const profileUrl = `/api/realms/${slug}/profile${qs ? `?${qs}` : ""}`;

    fetch(profileUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setProfile(data);
          // Authoritative sync: server returns proxy `mode=unrevealed` only when not authorized to view photos
          const heroUrl = data.images?.hero || "";
          if (heroUrl && !heroUrl.includes("mode=unrevealed")) {
            setIsPhotoUnlocked(true);
          } else if (isExport && exportMode !== "revealed") {
            setIsPhotoUnlocked(false);
          }
        }
      })
      .catch((err) => console.warn("Using fallback profile:", err));
  }, [slug, searchParams, activeUnlockToken, inviteParam, activeInviteToken, isExport, exportMode]);

  // 2. Track initial page view via headers & document.referrer
  useEffect(() => {
    const queryRef = searchParams?.get("ref") || (activeInvite ? `${activeInvite.source} (VIP: ${activeInvite.guestName})` : null);
    const clientRef = typeof document !== "undefined" ? document.referrer || null : null;

    fetch(`/api/realms/${slug}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: `/${slug}/story`,
        clientReferrer: queryRef || clientRef,
      }),
    }).catch(() => {});
  }, [slug, searchParams, activeInvite]);

  // 3. Section Dwell Tracking & IntersectionObserver
  useEffect(() => {
    const sections = ["hero", "craft", "sunday", "rhythm", "private-album", "mirror", "vision", "connect"];

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
      {!isVerified && !isExport && (
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
        <header className={`sticky top-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-900 ${isExport ? "hidden" : ""}`}>
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
          {activeInvite && !isExport && (
            <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-zinc-900/90 to-zinc-950 border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-500">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Personal Invitation • Welcome, {activeInvite.guestName}
                  </span>
                  {activeInvite.unlockPhotos && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Unlock className="w-3 h-3" /> Full Photos Unlocked
                    </span>
                  )}
                </div>
                {activeInvite.personalNote && (
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl pt-1">
                    &ldquo;{activeInvite.personalNote}&rdquo;
                  </p>
                )}
              </div>
              <a
                href="#connect"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition shrink-0 self-start sm:self-center shadow-lg shadow-emerald-500/20"
              >
                Leave a Note ↓
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 relative group">
              <div
                onClick={() => {
                  if (!isPhotoUnlocked) triggerMutualReveal();
                }}
                className={`relative aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 ${
                  !isPhotoUnlocked ? "cursor-pointer" : ""
                }`}
              >
                <Image
                  src={profile.images.hero}
                  alt={`${profile.name} portrait`}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                  className={`object-cover transition-all duration-700 ${
                    isPhotoUnlocked ? "blur-0 scale-100 group-hover:scale-105" : "blur-2xl scale-110"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

                {!isPhotoUnlocked ? (
                  <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center group-hover:bg-zinc-950/30 transition">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition">
                      <Lock className="w-6 h-6" />
                    </div>
                    <span className="text-base font-bold text-zinc-100">Photo Protected</span>
                    <p className="text-xs text-zinc-300 mt-1 max-w-[200px] leading-relaxed">
                      Share your photo to reveal {profile.name}&apos;s face & photos
                    </p>
                    <span className="mt-3.5 px-4 py-1.5 rounded-full bg-emerald-500 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-400 transition">
                      Mutual Reveal • Click to Unlock
                    </span>
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80">
                    <p className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {profile.name} • {profile.specs.height}
                    </p>
                  </div>
                )}
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

                const socialsMasked =
                  !isPhotoUnlocked ||
                  activePlatforms.every((s) => profile.socials![s.key] === "__protected__");

                return (
                  <div className="relative pt-1 max-w-md">
                    <div
                      className={`flex flex-wrap items-center gap-2 transition-all duration-500 ${
                        socialsMasked
                          ? "blur-md opacity-30 pointer-events-none select-none"
                          : "blur-0 opacity-100"
                      }`}
                    >
                      {activePlatforms.map((s) => {
                        const Icon = s.icon;
                        const url = profile.socials![s.key]!;
                        if (socialsMasked || url === "__protected__") {
                          return (
                            <span
                              key={s.key}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${s.badgeClass}`}
                            >
                              <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                              <span>{s.label}</span>
                            </span>
                          );
                        }
                        const href =
                          url.startsWith("http://") || url.startsWith("https://")
                            ? url
                            : `https://${url}`;
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

                    {socialsMasked && (
                      <button
                        type="button"
                        onClick={triggerMutualReveal}
                        className="absolute inset-0 flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-950/85 border border-amber-500/40 hover:border-amber-500/70 hover:bg-zinc-900/90 backdrop-blur-md text-xs font-medium text-zinc-300 shadow-xl group transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-sm">
                            <Lock className="w-3 h-3" />
                          </span>
                          <span className="text-zinc-200 font-semibold">Social Profiles Protected</span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 transition flex items-center gap-1">
                          Mutual Reveal • Unlock <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Voice Note Atmosphere Player (renders only when audio is recorded/enabled) */}
              {!isExport && (
                <VoiceIntroPlayer
                  slug={slug}
                  ownerName={profile.name}
                  voiceNote={profile.voiceNote}
                  isUnlocked={isPhotoUnlocked}
                  inviteToken={activeInviteToken}
                  unlockToken={activeUnlockToken}
                  onRequestUnlock={triggerMutualReveal}
                />
              )}

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
                alt="Workspace and engineering space"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 text-xs font-medium text-zinc-300">
                Focus Space: Multi-monitor engineering and remote research setup
              </div>
            </div>

            <div className="space-y-4">
              {profile.craft.cards.map((card, idx) => {
                const renderIcon = () => {
                  switch (card.id) {
                    case "cooking_market":
                      return <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "weightloss_grit":
                      return <Flame className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "hsp_empathy":
                      return <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "software_engineering":
                      return <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "security_engineering":
                    case "cybersecurity":
                    default:
                      return <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
                  }
                };

                return (
                  <div key={card.id || idx} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/70">
                    <h3 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                      {renderIcon()} {card.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      {card.desc}
                    </p>
                    {card.image && (
                      <div className="mt-4 relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-zinc-800/80 group">
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 450px"
                          className="object-cover group-hover:scale-105 transition duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                        {card.imageCaption && (
                          <div className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-sm text-[11px] font-medium text-zinc-300 border border-zinc-800/60">
                            {card.imageCaption}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 1.5: The Sunday Test Interactive Vignette */}
        {profile.sundayRitual?.enabled !== false &&
          profile.sundayRitual?.moments &&
          profile.sundayRitual.moments.length > 0 && (
            <SundayRitualSection
              ownerName={profile.name}
              title={profile.sundayRitual.title}
              subtitle={profile.sundayRitual.subtitle}
              moments={profile.sundayRitual.moments}
            />
          )}

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
                  alt={profile.rhythm.card1Title || "Lifestyle and family moments"}
                  fill
                  sizes="350px"
                  className={`object-cover transition-all duration-700 ${
                    isPhotoUnlocked ? "blur-0 scale-100 group-hover:scale-105" : "blur-2xl scale-110"
                  }`}
                />
                {!isPhotoUnlocked && (
                  <div
                    onClick={triggerMutualReveal}
                    className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center cursor-pointer group-hover:bg-zinc-950/30 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">Photo Locked</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">Click to unlock</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {profile.rhythm.card1Title || "Western Ghats Drives & Mountain Air"}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">
                  {profile.rhythm.card1Desc || "Belagavi sits right at the threshold of the Western Ghats. Taking peaceful road trips through the misty ghats and pausing at quiet viewpoints is my favorite way to clear my mind."}
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.formalWaistcoat}
                  alt={profile.rhythm.card2Title || "Coastal hobby"}
                  fill
                  sizes="350px"
                  className={`object-cover transition-all duration-700 ${
                    isPhotoUnlocked ? "blur-0 scale-100 group-hover:scale-105" : "blur-2xl scale-110"
                  }`}
                />
                {!isPhotoUnlocked && (
                  <div
                    onClick={triggerMutualReveal}
                    className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center cursor-pointer group-hover:bg-zinc-950/30 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">Photo Locked</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">Click to unlock</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {profile.rhythm.card2Title || "Learning the Basics of Fishing (101)"}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">
                  {profile.rhythm.card2Desc || "I recently learned the 101 basics of fishing during a trip to the coast. Learning to read the water, bait the hook, and wait patiently by the rocks is a hobby I would love to pursue during my coastal trips in the future."}
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.casualOutdoor}
                  alt={profile.rhythm.card3Title || "Work travel and downtime"}
                  fill
                  sizes="350px"
                  className={`object-cover transition-all duration-700 ${
                    isPhotoUnlocked ? "blur-0 scale-100 group-hover:scale-105" : "blur-2xl scale-110"
                  }`}
                />
                {!isPhotoUnlocked && (
                  <div
                    onClick={triggerMutualReveal}
                    className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center cursor-pointer group-hover:bg-zinc-950/30 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">Photo Locked</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">Click to unlock</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {profile.rhythm.card3Title || "Space to Think & Quiet Travel"}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">
                  {profile.rhythm.card3Desc || "Looking out over the cloudscape between deep-focus work blocks. Taking time to disconnect, travel, and let my mind wander keeps me grounded and creative."}
                </p>
              </div>
            </div>

            {profile.rhythm.extraCards?.map((card, idx) => (
              <div
                key={card.id || idx}
                className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    sizes="350px"
                    className={`object-cover transition-all duration-700 ${
                      isPhotoUnlocked ? "blur-0 scale-100 group-hover:scale-105" : "blur-2xl scale-110"
                    }`}
                  />
                  {!isPhotoUnlocked && (
                    <div
                      onClick={triggerMutualReveal}
                      className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center cursor-pointer group-hover:bg-zinc-950/30 transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-200">Photo Locked</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">Click to unlock</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                  <h4 className="text-sm font-semibold text-zinc-200">
                    {card.title}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2.5: Mutual Photo Exchange & Private Album */}
        {profile.privateAlbum?.enabled !== false && (
          <MutualPhotoReveal
            slug={slug}
            ownerName={profile.name}
            title={profile.privateAlbum?.title}
            subtitle={profile.privateAlbum?.subtitle}
            photoCount={profile.privateAlbum?.photoCount || 4}
            categories={profile.privateAlbum?.categories}
            turnstileToken={turnstileToken}
            referrer={activeInvite ? `${activeInvite.source} (VIP: ${activeInvite.guestName})` : undefined}
          />
        )}

        {/* Section 2.8: Values & Communication Mirror */}
        {!isExport &&
          profile.valuesMirror?.enabled !== false &&
          profile.valuesMirror?.scenarios &&
          profile.valuesMirror.scenarios.length > 0 && (
            <ValuesMirrorSection
              ownerName={profile.name}
              title={profile.valuesMirror.title}
              subtitle={profile.valuesMirror.subtitle}
              scenarios={profile.valuesMirror.scenarios}
              onBringToNote={(summary) => {
                window.dispatchEvent(
                  new CustomEvent("prefill-contact-note", { detail: { summary } })
                );
                const el = document.getElementById("connect");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            />
          )}

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
          referrer={activeInvite ? `${activeInvite.source} (VIP: ${activeInvite.guestName})` : undefined}
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
