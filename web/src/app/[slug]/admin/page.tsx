"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  BarChart3,
  Users,
  Clock,
  Mail,
  Edit3,
  Sparkles,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Eye,
  Trash2,
  AlertTriangle,
  Settings,
  HelpCircle,
  ChevronDown,
  Key,
  Camera,
  X,
  Share2,
  Layers,
  FileText,
  Unlock,
} from "lucide-react";
import Image from "next/image";
import { ProfileConfig, DEFAULT_PROFILE, getGenericStarterProfile } from "@/lib/profile";
import StoryLiveEditor from "@/components/StoryLiveEditor";

interface SectionDwell {
  sectionId: string;
  name: string;
  totalSeconds: number;
  totalViews: number;
  avgSeconds: number;
}

interface ContactMessage {
  id: string;
  timestamp: string;
  name: string;
  email: string;
  contact?: string;
  message: string;
  referrer?: string | null;
  photos?: string[];
  unlockedAlbum?: boolean;
}

interface RealmAnalyticsData {
  slug: string;
  ownerName: string;
  totalViews: number;
  referrers: Record<string, number>;
  sectionDwell: SectionDwell[];
  messageCount: number;
  recentVisits: any[];
  messages: ContactMessage[];
  llmPrompt: string;
}

export default function RealmAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active view tab: visual editor by default!
  const [activeTab, setActiveTab] = useState<"editor" | "export" | "analytics" | "llm" | "inbox" | "settings">("editor");

  const [analytics, setAnalytics] = useState<RealmAnalyticsData | null>(null);
  const [profile, setProfile] = useState<ProfileConfig>(() =>
    slug === "ajay" ? DEFAULT_PROFILE : getGenericStarterProfile(slug)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLLM, setCopiedLLM] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Server-Side Export States
  const [exportMode, setExportMode] = useState<"unrevealed" | "revealed">("unrevealed");
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [copiedRedditPitch, setCopiedRedditPitch] = useState<boolean>(false);

  // Deletion state
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // SMTP & Email Notification configuration
  const [smtpConfig, setSmtpConfig] = useState<{
    isMasterAjay: boolean;
    email: string;
    enabled: boolean;
    isConfigured: boolean;
    appPassword?: string;
  }>({
    isMasterAjay: slug === "ajay",
    email: "",
    enabled: false,
    isConfigured: false,
    appPassword: "",
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpSuccess, setSmtpSuccess] = useState(false);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(`admin_token_${slug}`);
    if (saved) {
      setToken(saved);
    }
  }, [slug]);

  const fetchRealmData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const [statsRes, profileRes, smtpRes] = await Promise.all([
        fetch(`/api/realms/${slug}/stats?key=${encodeURIComponent(authToken)}`),
        fetch(`/api/realms/${slug}/profile`),
        fetch(`/api/realms/${slug}/smtp?key=${encodeURIComponent(authToken)}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAnalytics(statsData);
      } else {
        sessionStorage.removeItem(`admin_token_${slug}`);
        setToken(null);
        setAuthError("Session expired or unauthorized. Please re-enter passkey.");
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData && profileData.name) {
          setProfile(profileData);
        }
      }

      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setSmtpConfig((prev) => ({
          ...prev,
          ...smtpData,
          appPassword: "",
        }));
      }
    } catch (err) {
      console.error(`Failed to load realm admin data for ${slug}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (token) {
      fetchRealmData(token);
    }
  }, [token, fetchRealmData]);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSmtpSaving(true);
    setSmtpError(null);
    setSmtpSuccess(false);

    try {
      const res = await fetch(`/api/realms/${slug}/smtp?key=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: smtpConfig.email,
          appPassword: smtpConfig.appPassword,
          enabled: smtpConfig.enabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpSuccess(true);
        setSmtpConfig((prev) => ({
          ...prev,
          isConfigured: data.isConfigured,
          appPassword: "",
        }));
        setTimeout(() => setSmtpSuccess(false), 4000);
      } else {
        setSmtpError(data.error || "Failed to update notification settings.");
      }
    } catch {
      setSmtpError("Network error updating notification settings.");
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      const res = await fetch(`/api/realms/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem(`admin_token_${slug}`, data.token);
        setToken(data.token);
      } else {
        setAuthError(data.error || "Incorrect administrative passkey.");
      }
    } catch {
      setAuthError("Network error. Could not authenticate.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`admin_token_${slug}`);
    setToken(null);
    setAnalytics(null);
  };

  const handleSaveProfile = async (updatedProfile: ProfileConfig): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/realms/${slug}/profile?key=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });

      if (res.ok) {
        setProfile(updatedProfile);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save profile:", err);
      return false;
    }
  };

  const handleCopyLLM = () => {
    if (!analytics?.llmPrompt) return;
    navigator.clipboard.writeText(analytics.llmPrompt);
    setCopiedLLM(true);
    setTimeout(() => setCopiedLLM(false), 2500);
  };

  const handleDownloadLLM = () => {
    if (!analytics?.llmPrompt) return;
    const blob = new Blob([analytics.llmPrompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `realm-${slug}-audit-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDownload = async (format: "deck" | "infographic" | "pdf") => {
    if (!token) return;
    setExportLoading(format);
    try {
      const url = `/api/realms/${slug}/export?format=${format}&mode=${exportMode}&token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to generate export");
      }

      const blob = await res.blob();
      const ext = format === "deck" ? "zip" : format === "infographic" ? "png" : "pdf";
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${slug}-${format === "deck" ? "story-deck" : format === "infographic" ? "infographic" : "biodata"}-${exportMode}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Export generation failed: ${err?.message || String(err)}`);
    } finally {
      setExportLoading(null);
    }
  };

  const handleCopyRedditPitch = () => {
    const pitch = `Hey! I know sharing external links on Reddit feels super sketchy with all the random IP loggers and phishers floating around, so I just snapshotted my portfolio deck into a quick 3-slide image instead.\n\n(I've kept my face blurred for privacy until we mutually exchange, but my story, craft, and what I'm looking for are all here. Have a look! 😊)`;
    navigator.clipboard.writeText(pitch);
    setCopiedRedditPitch(true);
    setTimeout(() => setCopiedRedditPitch(false), 2500);
  };

  const handleDeleteRealm = async () => {
    if (deleteConfirmSlug.trim().toLowerCase() !== slug.toLowerCase()) {
      setDeleteError(`Please type "${slug}" to confirm.`);
      return;
    }
    if (!token) return;

    if (!confirm(`Are you absolutely sure you want to permanently delete realm "/${slug}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/realms/${slug}/delete?key=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.removeItem(`admin_token_${slug}`);
        alert(`Realm "/${slug}" has been permanently erased from the database.`);
        router.push("/create");
      } else {
        setDeleteError(data.error || "Failed to delete realm.");
      }
    } catch {
      setDeleteError("Network error while attempting to delete realm.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Auth Gate
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Admin Realm: <span className="text-emerald-400 font-mono">/{slug}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Enter administrative passkey to visually edit this story and view dwell heatmaps.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Passkey
              </label>
              <input
                type="password"
                required
                placeholder="Enter realm passkey"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition cursor-pointer disabled:opacity-50"
            >
              {isAuthenticating ? "Verifying..." : "Unlock Realm Admin"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
            <Link href={`/${slug}/story`} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
              ← Return to Public Story
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalViews = analytics?.totalViews || 0;
  const messageCount = analytics?.messageCount || 0;
  const conversionRate = totalViews > 0 ? ((messageCount / totalViews) * 100).toFixed(1) : "0.0";
  const maxDwellSec = Math.max(...(analytics?.sectionDwell?.map((s) => s.avgSeconds) || [1]), 1);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Realm Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-lg text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Realm <code className="text-emerald-400 font-mono text-sm">/{slug}</code>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                {profile.name}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRealmData(token)}
              disabled={isLoading}
              title="Refresh"
              className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>

            <Link
              href={`/${slug}/story`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Public Story <ExternalLink className="w-3 h-3 text-zinc-500" />
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      {/* View Switcher Tabs */}
      <div className="bg-zinc-900/40 border-b border-zinc-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "editor"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Live Visual Story Editor
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "export"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Shareable Decks & PDF Export
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "analytics"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Attention & Dwell Heatmap
          </button>

          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "inbox"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Visitor Notes ({messageCount})
          </button>

          <button
            onClick={() => setActiveTab("llm")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "llm"
                ? "bg-emerald-500 text-zinc-950 font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Export for LLM Audit
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "settings"
                ? "bg-rose-500 text-white font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-rose-300"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Settings & Delete Realm
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. In-Context Live WYSIWYG Editor */}
      {activeTab === "editor" && (
        <StoryLiveEditor
          slug={slug}
          initialProfile={profile}
          token={token}
          onSave={handleSaveProfile}
        />
      )}

      {/* 2. Shareable Decks & PDF Export */}
      {activeTab === "export" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
          {/* Header Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Server-Side Chromium 2x Retina Rendering
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-100">
                Shareable Dating Decks &amp; PDF Exports
              </h3>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Send your story directly into Reddit chat, Instagram DM, or WhatsApp as native image slides or documents. Completely eliminates link hesitation, fears of IP grabbers, and phishing warnings.
              </p>
            </div>

            {/* Quick Preview Links */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`/${slug}/cards?mode=${exportMode}`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Preview Cards <ExternalLink className="w-3 h-3 text-zinc-500" />
              </Link>
              <Link
                href={`/${slug}/biodata?mode=${exportMode}`}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Preview Biodata <ExternalLink className="w-3 h-3 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* Privacy Mode Selector */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  Select Privacy Level for Export
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose whether your photos will have the aesthetic frosted-glass lock or be fully revealed.
                </p>
              </div>

              {/* Segmented Control */}
              <div className="inline-flex p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setExportMode("unrevealed")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    exportMode === "unrevealed"
                      ? "bg-amber-500 text-zinc-950 shadow-md font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  🔒 Unrevealed (Privacy Protected)
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode("revealed")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    exportMode === "revealed"
                      ? "bg-emerald-500 text-zinc-950 shadow-md font-bold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  🔓 Revealed (Full Access)
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-3">
              {exportMode === "unrevealed" ? (
                <>
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong>Unrevealed Active:</strong> Face &amp; candid lifestyle photos are frosted with a stylish lock badge. Full bio, craft, and vision are crystal clear. Perfect for Reddit outreach to spark interest while maintaining equal privacy.
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong>Revealed Active:</strong> All photos are crystal-clear high-definition with zero blur. Send this immediately after she shares hers to fulfill the reciprocal exchange!
                  </span>
                </>
              )}
            </div>
          </div>

          {/* The 3 Export Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Story Deck (ZIP) */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ⭐ Best for Reddit
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-zinc-100">
                    4-Card Story Deck
                  </h4>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">
                    ZIP of 4 PNG Cards • 1080×1920 (9:16)
                  </p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Engineered specifically for smartphone screens. Drop all 4 cards into Reddit Chat, WhatsApp, or Instagram DM to form an instant swipeable story carousel.
                </p>

                <div className="space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Card 1: Intro &amp; Vibe
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Card 2: Craft &amp; Mindset
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Card 3: Partnership Vision
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Card 4: Rhythm &amp; Downtime
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={Boolean(exportLoading)}
                  onClick={() => handleExportDownload("deck")}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${exportLoading === "deck" ? "animate-bounce" : ""}`} />
                  {exportLoading === "deck"
                    ? "Rendering Deck via Chromium..."
                    : `Download ${exportMode === "unrevealed" ? "Unrevealed" : "Revealed"} Deck (.zip)`}
                </button>
              </div>
            </div>

            {/* Card 2: Single-Page Infographic */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Single Long Scroll
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-zinc-100">
                    Single Infographic Scroll
                  </h4>
                  <p className="text-xs text-cyan-400 font-medium mt-0.5">
                    Continuous High-Res PNG • 1200px Wide
                  </p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  The complete profile story seamlessly captured from top to bottom as one high-definition vertical infographic graphic.
                </p>

                <div className="space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Full Story top-to-bottom
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> 2x Device Scale Pixel Sharpness
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" /> Native visual styling preserved
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={Boolean(exportLoading)}
                  onClick={() => handleExportDownload("infographic")}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${exportLoading === "infographic" ? "animate-bounce" : ""}`} />
                  {exportLoading === "infographic"
                    ? "Rendering Infographic..."
                    : `Download ${exportMode === "unrevealed" ? "Unrevealed" : "Revealed"} Scroll (.png)`}
                </button>
              </div>
            </div>

            {/* Card 3: Biodata Portfolio PDF */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    A4 Print Document
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-zinc-100">
                    Biodata Portfolio PDF
                  </h4>
                  <p className="text-xs text-purple-400 font-medium mt-0.5">
                    Print-Ready Vector PDF • 2 Pages A4
                  </p>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Clean editorial layout formatted with precise A4 page breaks. Features crisp vector typography, executive spec table, and life rhythm pillars.
                </p>

                <div className="space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Vector text with infinite zoom
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Ideal for WhatsApp docs &amp; matrimony
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400" /> Standardized 2-page pagination
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={Boolean(exportLoading)}
                  onClick={() => handleExportDownload("pdf")}
                  className="w-full py-3 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10 disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${exportLoading === "pdf" ? "animate-bounce" : ""}`} />
                  {exportLoading === "pdf"
                    ? "Generating A4 Vector PDF..."
                    : `Download ${exportMode === "unrevealed" ? "Unrevealed" : "Revealed"} Biodata (.pdf)`}
                </button>
              </div>
            </div>
          </div>

          {/* High-EQ Reddit Opening Copy Banner */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  Recommended Reddit DM Opening Script
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Send this alongside your 4 Story Deck cards in chat. It immediately disarms suspicion, validates her security concerns, and frames reciprocity naturally.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyRedditPitch}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 border border-zinc-700"
              >
                {copiedRedditPitch ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" /> Copy Opening Script
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {`Hey! I know sharing external links on Reddit feels super sketchy with all the random IP loggers and phishers floating around, so I just snapshotted my portfolio deck into a quick 3-slide image instead.\n\n(I've kept my face blurred for privacy until we mutually exchange, but my story, craft, and what I'm looking for are all here. Have a look! 😊)`}
            </div>
          </div>
        </div>
      )}

      {/* 3. Attention & Dwell Heatmap */}
      {activeTab === "analytics" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Total Visitors</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{totalViews}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Recorded on /{slug}/story</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Notes Received</span>
                <Mail className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{messageCount}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Delivered to your email</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Conversion Rate</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{conversionRate}%</div>
              <div className="text-[11px] text-zinc-500 mt-1">Visitors who left a note</div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
                <span>Traffic Sources</span>
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
                {Object.keys(analytics?.referrers || {}).length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">Distinct referrer origins</div>
            </div>
          </div>

          {/* Dwell Heatmap */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-emerald-400" /> Section Dwell Heatmap & Drop-off Funnel
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Shows how many seconds visitors actively spent reading each section on /{slug}/story.
            </p>

            <div className="space-y-4">
              {(analytics?.sectionDwell || []).map((sec) => {
                const reachPct = totalViews > 0 ? Math.round((sec.totalViews / totalViews) * 100) : 0;
                const barWidth = Math.max(Math.round((sec.avgSeconds / maxDwellSec) * 100), 4);

                return (
                  <div key={sec.sectionId} className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-200">{sec.name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          #{sec.sectionId}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-zinc-400">
                          Reached: <strong className="text-zinc-200">{sec.totalViews}</strong> ({reachPct}%)
                        </span>
                        <span className="text-emerald-400 font-semibold">Avg: {sec.avgSeconds}s</span>
                        <span className="text-zinc-500 text-[11px]">Total: {sec.totalSeconds}s</span>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Sources & Visits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Header & Referrer Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(analytics?.referrers || {}).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">No referrer data recorded yet.</p>
                ) : (
                  Object.entries(analytics?.referrers || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([ref, count]) => {
                      const pct = totalViews > 0 ? ((count / totalViews) * 100).toFixed(1) : "0";
                      return (
                        <div
                          key={ref}
                          className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-zinc-300">{ref}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500">{pct}%</span>
                            <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                              {count} visits
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Recent Visits Log
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(analytics?.recentVisits || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">No visits logged yet.</p>
                ) : (
                  (analytics?.recentVisits || []).slice(0, 15).map((visit, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-400">{visit.parsedReferrer || "Direct"}</span>
                        <span className="text-zinc-500 text-[11px] font-mono">
                          {visit.timestamp ? new Date(visit.timestamp).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">{visit.userAgent || "Unknown Device"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Visitor Notes Inbox */}
      {activeTab === "inbox" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" /> Private Notes for {profile.name} ({analytics?.messages?.length || 0})
            </h3>
          </div>

          {(analytics?.messages || []).length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800 text-zinc-500 text-sm">
              No visitor notes received yet for realm /{slug}.
            </div>
          ) : (
            (analytics?.messages || []).map((msg) => (
              <div
                key={msg.id}
                className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div>
                    <span className="font-bold text-base text-zinc-100">{msg.name}</span>
                    <span className="text-zinc-500 text-xs ml-2">({msg.email})</span>
                    {msg.contact && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-emerald-400">
                        {msg.contact}
                      </span>
                    )}
                    {msg.photos && msg.photos.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1 font-semibold">
                        <Camera className="w-3 h-3 text-purple-400" /> Photo Attached
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {msg.referrer && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {msg.referrer}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                {msg.photos && msg.photos.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5 mb-2">
                      <Camera className="w-3.5 h-3.5 text-purple-400" /> Attached Photo(s):
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {msg.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setViewingPhoto(photo)}
                          className="relative aspect-square w-24 sm:w-28 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 cursor-pointer hover:border-emerald-400 group shadow-md"
                        >
                          <Image
                            src={photo}
                            alt={`Attached photo ${pIdx + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <a
                    href={`mailto:${msg.email}?subject=Re: Your note on ${profile.name}'s story`}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-400" /> Reply via Email
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. LLM Audit Export & Profile Import */}
      {activeTab === "llm" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
          {/* Direct Import Link Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                <Sparkles className="w-3 h-3 text-purple-400" /> New: AI Profile Import
              </span>
              <h4 className="text-base font-bold text-zinc-100">
                Want to rewrite your Story Realm using ChatGPT, Claude, or Gemini?
              </h4>
              <p className="text-xs text-zinc-400 max-w-xl">
                Generate or revamp your profile using AI. The Live Editor features a 1-click prompt generator and smart JSON parser that updates your story canvas live while preserving your uploaded photos.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("editor")}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-purple-600/20"
            >
              <Edit3 className="w-4 h-4" /> Open Live Editor to Import
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> AI Conversion Audit Prompt for Realm /{slug}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Bundles all dwell times, drop-off rates, referrer origins, and visitor feedback for this realm.
                  Paste into ChatGPT, Claude, or Gemini for an instant empirical audit.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyLLM}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {copiedLLM ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Prompt for LLM
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadLLM}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
                  title="Download as .md"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[550px] leading-relaxed whitespace-pre-wrap">
              {analytics?.llmPrompt || "Compiling LLM audit payload..."}
            </div>
          </div>
        </div>
      )}

      {/* 5. Realm Settings & Danger Zone */}
      {activeTab === "settings" && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
          <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" /> Realm Configuration
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Manage your realm identity, public URLs, and lifecycle.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Realm Handle:</span>
                <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  /{slug}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Public Story Link:</span>
                <Link
                  href={`/${slug}/story`}
                  target="_blank"
                  className="text-zinc-300 hover:text-emerald-400 transition flex items-center gap-1 font-mono"
                >
                  /{slug}/story <ExternalLink className="w-3 h-3 text-zinc-500" />
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Owner Name:</span>
                <span className="text-zinc-200 font-medium">{profile.name}</span>
              </div>
            </div>

            {/* Email Notifications Configuration & Google App Password Guide */}
            <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-zinc-100">Email Notifications & Forwarding</h4>
                </div>
                {smtpConfig.isMasterAjay ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Master Server SMTP Active
                  </span>
                ) : smtpConfig.enabled && smtpConfig.isConfigured ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Direct Email Forwarding Active
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                    In-App Inbox Only (Zero Setup)
                  </span>
                )}
              </div>

              {smtpConfig.isMasterAjay ? (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your realm uses your master server environment credentials (<code className="text-zinc-300 font-mono">NOTIFICATION_TO</code>). All visitor messages are dispatched directly to your personal email inbox.
                </p>
              ) : (
                <div className="space-y-4 text-xs text-zinc-300">
                  <p className="text-zinc-400 leading-relaxed">
                    By default, visitor messages are stored securely inside your private <strong>Inbox</strong> tab above. If you also want instant email notifications forwarded directly to your personal Gmail inbox, configure your Google App Password below.
                  </p>

                  {smtpError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-200 text-xs">
                      {smtpError}
                    </div>
                  )}

                  {smtpSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Email notification settings updated successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSmtp} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">
                          Notification Gmail Address
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. you@gmail.com"
                          value={smtpConfig.email}
                          onChange={(e) => setSmtpConfig((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-medium mb-1">
                          Google App Password (16 Letters)
                        </label>
                        <input
                          type="password"
                          placeholder={smtpConfig.isConfigured ? "•••• •••• •••• •••• (Configured)" : "e.g. jxfv bhuc zzyk lplt"}
                          value={smtpConfig.appPassword || ""}
                          onChange={(e) => setSmtpConfig((prev) => ({ ...prev, appPassword: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="enableSmtp"
                        checked={smtpConfig.enabled}
                        onChange={(e) => setSmtpConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                        className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="enableSmtp" className="text-zinc-300 font-medium cursor-pointer select-none">
                        Forward visitor notes to my Gmail address
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAppPasswordGuide((prev) => !prev)}
                        className="text-emerald-400 hover:text-emerald-300 transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        {showAppPasswordGuide ? "Hide Google App Password Guide" : "How to get a Google App Password (60 sec)"}
                      </button>

                      <button
                        type="submit"
                        disabled={smtpSaving}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {smtpSaving ? "Saving..." : "Save Notification Settings"}
                      </button>
                    </div>
                  </form>

                  {/* Expandable Step-by-Step Google App Password Guide */}
                  {showAppPasswordGuide && (
                    <div className="mt-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 text-zinc-300 animate-in fade-in duration-200">
                      <h5 className="font-bold text-zinc-100 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" /> 5 Quick Steps to Create a Google App Password:
                      </h5>
                      <ol className="list-decimal list-inside space-y-2 text-[11px] text-zinc-400 leading-relaxed">
                        <li>
                          Open your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">Google Account Security Settings</a> and verify that <strong>2-Step Verification</strong> is ON.
                        </li>
                        <li>
                          Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">myaccount.google.com/apppasswords</a>.
                        </li>
                        <li>
                          In the <strong>App name</strong> field, type <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded font-mono">Story Realm</code> and click <strong>Create</strong>.
                        </li>
                        <li>
                          Google will display a 16-character code (e.g. <code className="text-emerald-300 bg-zinc-800 px-1 py-0.5 rounded font-mono">abcd efgh ijkl mnop</code>).
                        </li>
                        <li>
                          Paste that 16-character code into the <strong>Google App Password</strong> field above and click <strong>Save Notification Settings</strong>.
                        </li>
                      </ol>
                      <p className="text-[10px] text-zinc-500 italic pt-1">
                        Note: App Passwords allow sending only your own visitor notes via Google SMTP without sharing your real Google account password.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Danger Zone: Delete Realm */}
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Danger Zone: Permanently Delete Realm</span>
              </div>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                Deleting this realm is permanent and irreversible. Your public page at <code className="font-mono bg-rose-950/60 px-1 py-0.5 rounded text-rose-200">/{slug}/story</code>, all visitor messages, dwell heatmaps, and custom photos will be erased immediately from the database.
              </p>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-200 text-xs">
                  {deleteError}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <label className="block text-xs text-zinc-400">
                  To confirm deletion, type <strong className="text-zinc-100 font-mono">{slug}</strong> below:
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={deleteConfirmSlug}
                    onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                    placeholder={`Type "${slug}" to confirm`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500/60 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteRealm}
                    disabled={isDeleting || deleteConfirmSlug.trim().toLowerCase() !== slug.toLowerCase()}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      "Deleting Realm..."
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Delete Realm Permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Visitor Photo Viewer Modal */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                Shared Visitor Photo
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={viewingPhoto}
                  download={`visitor_photo_${Date.now()}.jpg`}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setViewingPhoto(null)}
                  className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden mt-3 bg-zinc-950">
              <Image
                src={viewingPhoto}
                alt="Full size visitor photo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
