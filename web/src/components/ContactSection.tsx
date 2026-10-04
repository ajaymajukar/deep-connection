"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Send, CheckCircle2, AlertCircle, HeartHandshake, Sparkles, Lock } from "lucide-react";

interface ContactSectionProps {
  slug?: string;
  ownerName?: string;
  title?: string;
  subtitle?: string;
  notePlaceholder?: string;
  referrer?: string | null;
  turnstileToken?: string | null;
}

export default function ContactSection({
  slug,
  ownerName = "Host",
  title,
  subtitle,
  notePlaceholder,
  referrer,
  turnstileToken,
}: ContactSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayTitle = title || `Say Hello to ${ownerName}`;
  const displaySubtitle =
    subtitle ||
    `If any part of my story, values, or rhythm resonated with you, I'd love to hear your thoughts. Your note reaches my personal inbox directly, without middleman algorithms or swiping games.`;
  const displayPlaceholder =
    notePlaceholder ||
    "What resonated with you? Tell me a little about your world, what you're passionate about, or ask me anything...";

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage("Please write a slightly longer note (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = slug ? `/api/realms/${slug}/contact` : "/api/contact";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          contact: contact.trim() || undefined,
          message: message.trim(),
          ref: referrer || undefined,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setIsSubmitted(true);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#10b981", "#38bdf8", "#f59e0b", "#ec4899"],
        });
      } catch {
        // Confetti fallback
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="connect" data-section="connect" className="relative py-16 px-4 max-w-3xl mx-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent pointer-events-none rounded-3xl" />

      <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-3 h-3" /> Private & Direct
          </span>
          <span className="text-zinc-500 text-xs">• Zero Public Indexing</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
          {displayTitle} <Sparkles className="w-6 h-6 text-amber-400" />
        </h2>
        <p className="mt-2 text-sm sm:text-base text-zinc-400 leading-relaxed">
          {displaySubtitle}
        </p>

        {isSubmitted ? (
          <div className="mt-8 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center animate-in fade-in duration-500">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-100">Note Received, {name}!</h3>
            <p className="mt-2 text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
              Your message has landed straight in {ownerName}&apos;s personal inbox. A gentle confirmation was also sent to <span className="text-emerald-400 font-medium">{email}</span>.
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              Every genuine message is read thoughtfully and will be answered directly by email.
            </p>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-xs text-zinc-400">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              Thank you for taking the time to connect.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Your Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Where I can reply back"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Social or Direct Handle <span className="text-zinc-500 font-normal lowercase">(optional — Instagram, LinkedIn, Telegram, etc.)</span>
              </label>
              <input
                type="text"
                placeholder="@handle or profile link"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Your Note / Thoughts <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder={displayPlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 text-sm leading-relaxed transition"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 order-2 sm:order-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Replies usually within 24–48 hours
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Sending note...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Note to {ownerName}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
