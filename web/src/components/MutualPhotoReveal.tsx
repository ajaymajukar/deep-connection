"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  Lock,
  Unlock,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  HeartHandshake,
} from "lucide-react";

export interface PrivateAlbumItem {
  id: string;
  url: string;
  caption?: string;
  category?: string;
}

interface MutualPhotoRevealProps {
  slug: string;
  ownerName?: string;
  title?: string;
  subtitle?: string;
  photoCount?: number;
  categories?: string[];
  turnstileToken?: string | null;
}

export default function MutualPhotoReveal({
  slug,
  ownerName = "Ajay",
  title = "Private Album: Candid & Unfiltered Moments",
  subtitle = "A quiet, reciprocal exchange. Share a picture of yourself along with a short hello to unlock and view my private photo album.",
  photoCount = 4,
  categories = ["Coastal Days", "Travel & Nature", "Everyday Rituals", "Quiet Downtime"],
  turnstileToken,
}: MutualPhotoRevealProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockedPhotos, setUnlockedPhotos] = useState<PrivateAlbumItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if visitor has already unlocked this realm's private album
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`unlocked_album_${slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUnlockedPhotos(parsed);
          setIsUnlocked(true);
        } else if (stored === "true") {
          setIsUnlocked(true);
        }
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }

    const handleOpen = () => setIsModalOpen(true);
    const handleUnlocked = (e: any) => {
      setIsUnlocked(true);
      if (e.detail?.album && Array.isArray(e.detail.album)) {
        setUnlockedPhotos(e.detail.album);
      }
    };

    window.addEventListener("open-mutual-reveal", handleOpen);
    window.addEventListener("mutual-reveal-unlocked", handleUnlocked);
    return () => {
      window.removeEventListener("open-mutual-reveal", handleOpen);
      window.removeEventListener("mutual-reveal-unlocked", handleUnlocked);
    };
  }, [slug]);

  // Handle client-side photo selection & compression
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image is larger than 15MB. Please choose a smaller photo.");
      return;
    }

    setPhotoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Compress client-side via canvas to ensure snappy upload
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setPhotoDataUrl(compressed);
        } else {
          setPhotoDataUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your name or nickname.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address so I can reply back.");
      return;
    }
    if (!photoDataUrl) {
      setErrorMessage("Please upload a photo of yourself for the mutual reveal.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/realms/${slug}/photo-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          contact: contact.trim() || undefined,
          message: message.trim() || undefined,
          photo: photoDataUrl,
          ref: "Mutual Photo Reveal Section",
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to exchange photo. Please try again.");
      }

      const receivedAlbum: PrivateAlbumItem[] = data.album || [];
      setUnlockedPhotos(receivedAlbum);
      setIsUnlocked(true);
      setIsModalOpen(false);

      // Save unlock state in sessionStorage
      try {
        sessionStorage.setItem(`unlocked_album_${slug}`, JSON.stringify(receivedAlbum));
        if (data.unlockToken) {
          sessionStorage.setItem(`unlocked_token_${slug}`, data.unlockToken);
        }
      } catch {
        // Fallback
      }

      window.dispatchEvent(
        new CustomEvent("mutual-reveal-unlocked", {
          detail: { album: receivedAlbum, unlockToken: data.unlockToken },
        })
      );

      // Celebratory Confetti!
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#10b981", "#38bdf8", "#f59e0b", "#a855f7"],
        });
      } catch {
        // Fallback
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveLightboxIndex(null);
      if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : unlockedPhotos.length - 1));
      }
      if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) => (prev !== null && prev < unlockedPhotos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, unlockedPhotos.length]);

  const displayCount = isUnlocked ? unlockedPhotos.length : Math.max(photoCount, 4);

  return (
    <section id="private-album" data-section="private-album" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
      {/* Section Header */}
      <div className="max-w-2xl mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
            {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
            {isUnlocked ? "Private Album Unlocked" : "Mutual Photo Exchange"}
          </span>
          <span className="text-zinc-600 text-xs">•</span>
          <span className="text-xs text-zinc-500 font-medium">Reciprocal & Fair</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 flex items-center gap-2.5">
          {title} <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>

        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
          {subtitle}
        </p>

        {isUnlocked && (
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mutual exchange verified. You have full access to {ownerName}&apos;s private album.</span>
          </div>
        )}
      </div>

      {/* Grid of Photos: Locked Teaser or Unlocked Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isUnlocked
          ? unlockedPhotos.map((photo, idx) => (
              <div
                key={photo.id || idx}
                onClick={() => setActiveLightboxIndex(idx)}
                className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-[3/4] cursor-pointer shadow-lg hover:border-emerald-500/50 transition duration-300 flex flex-col"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || `Private photo ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover group-hover:scale-105 transition duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition" />

                {photo.category && (
                  <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                    {photo.category}
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3 space-y-1">
                  <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed font-medium">
                    {photo.caption || "Click to view full photo"}
                  </p>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-emerald-400" /> Click to enlarge
                  </div>
                </div>
              </div>
            ))
          : Array.from({ length: displayCount }).map((_, idx) => {
              const categoryLabel = categories[idx % categories.length] || "Private Photo";
              return (
                <div
                  key={idx}
                  onClick={() => setIsModalOpen(true)}
                  className="group relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 aspect-[3/4] cursor-pointer hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between p-5 select-none"
                >
                  {/* Decorative blurred background simulation */}
                  <div className="absolute inset-0 bg-radial from-emerald-500/5 via-zinc-900/60 to-zinc-950 backdrop-blur-xl pointer-events-none" />

                  {/* Top category pill */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-medium text-zinc-300">
                      {categoryLabel}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">#{idx + 1}</span>
                  </div>

                  {/* Center lock state */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/20 transition duration-300 shadow-lg">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-zinc-200 block">Photo Locked</span>
                      <span className="text-[11px] text-zinc-500">Share yours to reveal</span>
                    </div>
                  </div>

                  {/* Bottom reveal indicator */}
                  <div className="relative z-10 text-center">
                    <div className="w-full py-2 rounded-xl bg-zinc-900/80 group-hover:bg-amber-500/10 border border-zinc-800 group-hover:border-amber-500/30 text-[11px] font-medium text-zinc-400 group-hover:text-amber-300 transition flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" /> Unlock Photo
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Main CTA Banner when locked */}
      {!isUnlocked && (
        <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-zinc-300">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>How Mutual Reveal Works</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Upload a clear photo of yourself along with a brief introduction. Your photo is sent straight to {ownerName}&apos;s private inbox, and {ownerName}&apos;s private gallery will immediately unlock for you.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
          >
            <Camera className="w-4 h-4" /> Share Photo to Unlock
          </button>
        </div>
      )}

      {/* Upload & Exchange Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1.5 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-3 h-3" /> 1-on-1 Mutual Reveal
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">
                Unlock {ownerName}&apos;s Private Album
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Fair, private, and respectful. Share a photo of yourself to immediately reveal {ownerName}&apos;s candid photos.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleExchangeSubmit} className="space-y-4">
              {/* Photo Upload Zone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Your Photo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {photoDataUrl ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/50 bg-zinc-950 group">
                    <Image
                      src={photoDataUrl}
                      alt="Selected preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900/90 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoDataUrl(null);
                          setPhotoFileName(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-900/80 text-xs font-semibold text-rose-200 border border-rose-700 hover:bg-rose-800 transition"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-sm text-[11px] font-medium text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[200px]">{photoFileName || "Photo ready"}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 bg-zinc-950/40 hover:bg-zinc-950/80 transition flex flex-col items-center justify-center gap-2.5 cursor-pointer text-center group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 flex items-center justify-center transition border border-zinc-800">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-emerald-300 transition">
                        Click or drag to select your photo
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Supports JPG, PNG, WebP (up to 15MB)
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Your Name / Nickname <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Your Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Where I can reply back"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-sm transition"
                  />
                </div>
              </div>

              {/* Optional Handle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Social or Direct Handle <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="@handle or profile link"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-sm transition"
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Say a Quick Hello <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder={`Hi ${ownerName}, wanted to exchange photos and say hello...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-sm leading-relaxed transition"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      Exchanging photo & unlocking...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Exchange Photo & Unlock Album
                    </>
                  )}
                </button>
                <p className="text-[11px] text-zinc-500 text-center mt-2">
                  🔒 Your photo will be sent directly to {ownerName}&apos;s personal inbox. Zero public indexing.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Viewer for Unlocked Photos */}
      {activeLightboxIndex !== null && unlockedPhotos[activeLightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-700 transition cursor-pointer z-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxIndex((prev) =>
                prev !== null && prev > 0 ? prev - 1 : unlockedPhotos.length - 1
              );
            }}
            className="absolute left-4 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition cursor-pointer z-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxIndex((prev) =>
                prev !== null && prev < unlockedPhotos.length - 1 ? prev + 1 : 0
              );
            }}
            className="absolute right-4 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition cursor-pointer z-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Photo Container */}
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[70vh] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
              <Image
                src={unlockedPhotos[activeLightboxIndex].url}
                alt={unlockedPhotos[activeLightboxIndex].caption || "Private photo"}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Caption & Category Footer */}
            <div className="mt-4 text-center max-w-xl space-y-1">
              {unlockedPhotos[activeLightboxIndex].category && (
                <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-1">
                  {unlockedPhotos[activeLightboxIndex].category}
                </span>
              )}
              {unlockedPhotos[activeLightboxIndex].caption && (
                <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed">
                  {unlockedPhotos[activeLightboxIndex].caption}
                </p>
              )}
              <p className="text-xs text-zinc-500">
                Photo {activeLightboxIndex + 1} of {unlockedPhotos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
