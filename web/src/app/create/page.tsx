"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, UserPlus, AlertCircle, Heart } from "lucide-react";

export default function CreateRealmPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanSlug || cleanSlug.length < 3) {
      setErrorMessage("Realm handle must be at least 3 characters (letters, numbers, hyphens).");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Please enter your display name.");
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address for visitor notifications.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage("Passkey should be at least 4 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/realms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: cleanSlug,
          name: name.trim(),
          ownerEmail: ownerEmail.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create realm.");
      }

      // Pre-authenticate session
      sessionStorage.setItem(
        `admin_token_${cleanSlug}`,
        `auth_${cleanSlug}_${btoa(password.trim())}`
      );

      // Redirect immediately to their new realm admin editor
      router.push(`/${cleanSlug}/admin`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Tenant Realm Engine
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
          Create Your Story Realm
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Launch your own private, intentional matchmaking page with zero-surname privacy, dwell heatmaps, and in-place visual editing.
        </p>

        {errorMessage && (
          <div className="mt-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Realm Handle (Your URL Path) <span className="text-rose-400">*</span>
            </label>
            <div className="flex rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden focus-within:border-emerald-500/60">
              <span className="px-3.5 py-2.5 bg-zinc-900 text-zinc-500 text-xs font-mono border-r border-zinc-800 select-none">
                /
              </span>
              <input
                type="text"
                required
                placeholder="e.g. rohan or priya"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                className="w-full px-3 py-2.5 bg-transparent text-zinc-100 placeholder-zinc-600 focus:outline-none text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Your story will live at <code className="text-emerald-400 font-mono">/{slug || "yourhandle"}/story</code>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Display Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rohan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Admin Passkey <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                placeholder="Passkey to edit story"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Notification Email <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="Where visitor notes will be delivered"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                "Creating Realm..."
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create My Story Realm <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <Link href="/story" className="hover:text-zinc-300 transition">
            ← View Sample Story
          </Link>
          <a
            href="https://github.com/ajaymajukar/deep-connection"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition flex items-center gap-1 text-zinc-500"
          >
            <span>Open Source on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
