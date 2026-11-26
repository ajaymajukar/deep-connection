"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Sparkles,
  Plus,
  Copy,
  Check,
  Trash2,
  Unlock,
  ShieldCheck,
  Clock,
  ExternalLink,
  MessageCircle,
  Ban,
} from "lucide-react";

interface VipInviteRecord {
  id: string;
  token: string;
  guestName: string;
  source: string;
  personalNote?: string;
  bypassTurnstile: boolean;
  unlockPhotos: boolean;
  unlockSocials: boolean;
  createdAt: string;
  expiresAt?: string;
  lastOpenedAt?: string;
  openCount: number;
  revoked?: boolean;
}

interface VipInvitesTabProps {
  slug: string;
  token: string;
  ownerName: string;
}

const SOURCE_PRESETS = ["Aisle", "Hinge", "Bumble", "Reddit", "Matrimony / Family", "Direct"];

export default function VipInvitesTab({ slug, token, ownerName }: VipInvitesTabProps) {
  const [invites, setInvites] = useState<VipInviteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [source, setSource] = useState("Aisle");
  const [personalNote, setPersonalNote] = useState(
    "Loved our conversation so far—put together this quiet personal space to share more of my story, values, and daily rhythm beyond short app prompts."
  );
  const [bypassTurnstile, setBypassTurnstile] = useState(true);
  const [unlockPhotos, setUnlockPhotos] = useState(true);
  const [unlockSocials, setUnlockSocials] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/realms/${slug}/invites?key=${encodeURIComponent(token)}`);
        if (res.ok && active) {
          const data = await res.json();
          setInvites(data.invites || []);
          setNowMs(Date.now());
        }
      } catch (err) {
        console.error("Failed to fetch VIP invites:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, token]);

  const handleSourceChange = (nextSource: string) => {
    setSource(nextSource);
    // Sensible privacy defaults: matches already seen visually on Aisle/Hinge/Bumble default to unlockPhotos=true; Reddit defaults to false!
    if (nextSource === "Reddit" || nextSource === "Direct") {
      setUnlockPhotos(false);
    } else {
      setUnlockPhotos(true);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!guestName.trim()) {
      setErrorMsg("Enter the match's first name or nickname.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`/api/realms/${slug}/invites?key=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          source,
          personalNote: personalNote.trim(),
          bypassTurnstile,
          unlockPhotos,
          unlockSocials,
          expiresInDays: expiresInDays > 0 ? expiresInDays : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate VIP invite");
      }

      setInvites((prev) => [data.invite, ...prev]);
      setNowMs(Date.now());
      setGuestName("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Could not create VIP link.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (invToken: string, purge = false) => {
    const label = purge ? "permanently delete" : "revoke access for";
    if (!confirm(`Are you sure you want to ${label} this VIP invitation link?`)) return;

    try {
      const res = await fetch(
        `/api/realms/${slug}/invites?key=${encodeURIComponent(token)}&inviteToken=${encodeURIComponent(invToken)}&purge=${purge}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        if (purge) {
          setInvites((prev) => prev.filter((i) => i.token !== invToken));
        } else {
          setInvites((prev) => prev.map((i) => (i.token === invToken ? { ...i, revoked: true } : i)));
        }
      }
    } catch (err) {
      console.error("Failed to revoke VIP invite:", err);
    }
  };

  const getOrigin = () => (typeof window !== "undefined" ? window.location.origin : "https://deep-connection.vercel.app");

  const buildUrl = (invToken: string) => `${getOrigin()}/${slug}/story?invite=${invToken}`;

  const copyLink = (invite: VipInviteRecord) => {
    navigator.clipboard.writeText(buildUrl(invite.token));
    setCopiedId(`link_${invite.id}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyPitch = (invite: VipInviteRecord) => {
    const url = buildUrl(invite.token);
    const msg = `Hey ${invite.guestName}! I really enjoy our vibe so far. Since dating apps barely leave space for nuance, I created a quiet personal story space about my values, daily rhythm, and what I'm building in life.\n\nMade a personal pass for you here: ${url}\n\nNo pressure at all—explore whenever you have a few calm minutes!`;
    navigator.clipboard.writeText(msg);
    setCopiedId(`msg_${invite.id}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-950 border border-emerald-500/30 space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Key className="w-3.5 h-3.5" /> Ephemeral Match Invitations
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">
          VIP Realm Keys for {ownerName}&apos;s Matches
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Instead of sending a cold generic link, mint a personal invitation key for each match. Greet her by name, skip Turnstile bot friction, track when she reads your story, and choose whether her link automatically unlocks your photos (ideal for Aisle/Hinge matches you&apos;ve already seen!).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Generator Form */}
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4"
        >
          <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Mint New VIP Invite Key
          </h4>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Match&apos;s First Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Platform Source</label>
            <div className="flex flex-wrap gap-1.5">
              {SOURCE_PRESETS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => handleSourceChange(src)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    source === src
                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                      : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Personalized Greeting Note (Shown in Hero Banner)
            </label>
            <textarea
              rows={3}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-200 leading-relaxed focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Key Permissions
            </span>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={bypassTurnstile}
                onChange={(e) => setBypassTurnstile(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-emerald-500"
              />
              <div>
                <span className="font-semibold text-zinc-200 block">Skip Turnstile Bot Check</span>
                <span className="text-[11px] text-zinc-500">Opens your story directly with zero friction.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={unlockPhotos}
                onChange={(e) => setUnlockPhotos(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-emerald-500"
              />
              <div>
                <span className="font-semibold text-zinc-200 block">Pre-unlock Photos &amp; Private Album</span>
                <span className="text-[11px] text-zinc-500">
                  Ideal for Aisle/Hinge/Bumble matches whose photos you&apos;ve already seen. Leave OFF for Reddit.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={unlockSocials}
                onChange={(e) => setUnlockSocials(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-amber-500"
              />
              <div>
                <span className="font-semibold text-zinc-200 block">Reveal LinkedIn / GitHub Handles</span>
                <span className="text-[11px] text-zinc-500">
                  Keep OFF to protect your full professional handles until you&apos;ve chatted longer.
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Key Expiry</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60"
            >
              <option value={7}>Expires in 7 days</option>
              <option value={30}>Expires in 30 days</option>
              <option value={0}>No expiry (Manual revoke only)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isCreating ? "Minting Invite Key..." : "Generate Personal VIP Key"}
          </button>
        </form>

        {/* Issued Passes List */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active &amp; Past VIP Keys ({invites.length})
          </h4>

          {isLoading ? (
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
              Loading VIP invitation keys...
            </div>
          ) : invites.length === 0 ? (
            <div className="p-10 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-500">
              No VIP keys created yet. Mint one on the left when inviting an Aisle, Hinge, or Bumble match!
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((inv) => {
                const isExpired = inv.expiresAt ? new Date(inv.expiresAt).getTime() < nowMs : false;
                const isDead = Boolean(inv.revoked || isExpired);
                return (
                  <div
                    key={inv.id}
                    className={`p-5 rounded-3xl border transition space-y-3 ${
                      isDead
                        ? "bg-zinc-950/50 border-zinc-800/60 opacity-60"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-zinc-100">{inv.guestName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {inv.source}
                        </span>
                        {inv.unlockPhotos && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Photos Unlocked
                          </span>
                        )}
                        {inv.revoked && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            Revoked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] ${
                            inv.openCount > 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-950 text-zinc-500 border border-zinc-800"
                          }`}
                        >
                          {inv.openCount > 0 ? `Opened ${inv.openCount}x` : "Not opened yet"}
                        </span>
                      </div>
                    </div>

                    {inv.personalNote && (
                      <p className="text-xs text-zinc-400 italic leading-relaxed">
                        &ldquo;{inv.personalNote}&rdquo;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70">
                      <div className="text-[11px] text-zinc-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Created {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                        {inv.lastOpenedAt && (
                          <span>Last viewed {new Date(inv.lastOpenedAt).toLocaleTimeString()}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!isDead && (
                          <>
                            <button
                              type="button"
                              onClick={() => copyPitch(inv)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedId === `msg_${inv.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Message Copied!
                                </>
                              ) : (
                                <>
                                  <MessageCircle className="w-3.5 h-3.5" /> Copy Warm Invite Msg
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => copyLink(inv)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-[11px] transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                            >
                              {copiedId === `link_${inv.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Link Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copy URL
                                </>
                              )}
                            </button>

                            <a
                              href={buildUrl(inv.token)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
                              title="Open VIP Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleRevoke(inv.token, false)}
                              className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition cursor-pointer"
                              title="Revoke Key"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRevoke(inv.token, true)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                          title="Delete Key Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
