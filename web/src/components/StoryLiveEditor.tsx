"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Compass,
  Heart,
  Cpu,
  ArrowRight,
  MapPin,
  Briefcase,
  Ruler,
  Camera,
  Eye,
  Pencil,
  Save,
  RotateCcw,
  Check,
  Sparkles,
  ChevronDown,
  Flame,
  Utensils,
  ExternalLink,
  Plus,
  Trash2,
  Download,
  Upload
} from "lucide-react";
import { SOCIAL_CONFIGS } from "@/components/SocialIcons";
import { ProfileConfig } from "@/lib/profile";
import PhotoEditorModal from "./PhotoEditorModal";
import ImportFromLLMModal from "./ImportFromLLMModal";

export { SOCIAL_CONFIGS };

export interface StoryLiveEditorProps {
  slug: string;
  initialProfile: ProfileConfig;
  token: string;
  onSave: (updatedProfile: ProfileConfig) => Promise<boolean>;
}

export default function StoryLiveEditor({

  slug,
  initialProfile,
  token,
  onSave,
}: StoryLiveEditorProps) {
  const [profile, setProfile] = useState<ProfileConfig>(initialProfile);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Sync state whenever the parent component finishes fetching or updating the realm profile
  useEffect(() => {
    setProfile(initialProfile);
    setHasUnsavedChanges(false);
  }, [initialProfile]);

  // Photo modal state
  const [activePhotoKey, setActivePhotoKey] = useState<keyof ProfileConfig["images"] | null>(null);
  const [photoModalLabel, setPhotoModalLabel] = useState<string>("");

  // AI Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const handleImportFromLLM = (newProfile: ProfileConfig) => {
    setProfile(newProfile);
    setHasUnsavedChanges(true);
  };

  const updateField = (updater: (prev: ProfileConfig) => ProfileConfig) => {
    setProfile((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleOpenPhotoModal = (key: keyof ProfileConfig["images"], label: string) => {
    if (!isEditMode) return;
    setActivePhotoKey(key);
    setPhotoModalLabel(label);
  };

  const handleApplyPhoto = (newUrl: string) => {
    if (!activePhotoKey) return;
    updateField((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [activePhotoKey]: newUrl,
      },
    }));
  };

  const handleAddSocial = (key: keyof NonNullable<ProfileConfig["socials"]>) => {
    updateField((prev) => ({
      ...prev,
      socials: {
        ...(prev.socials || {}),
        [key]: "",
      },
    }));
  };

  const handleRemoveSocial = (key: keyof NonNullable<ProfileConfig["socials"]>) => {
    updateField((prev) => {
      const updated = { ...(prev.socials || {}) };
      delete updated[key];
      return {
        ...prev,
        socials: updated,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const success = await onSave(profile);
      if (success) {
        setSaveSuccess(true);
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save changes. Please try again.");
      }
    } catch {
      alert("Error saving profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (confirm("Discard all unsaved edits and restore last saved state?")) {
      setProfile(initialProfile);
      setHasUnsavedChanges(false);
    }
  };

  const handleExportProfile = () => {
    try {
      const jsonStr = JSON.stringify(profile, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `realm-${slug}-profile.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonStr).catch(() => {});
      }
      alert(`Profile exported successfully! Saved as 'realm-${slug}-profile.json' and copied to your clipboard.`);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export profile.");
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200 pb-24">
      {/* Floating Visual Editor Toolbar */}
      <div className="sticky top-16 z-40 backdrop-blur-xl bg-zinc-900/90 border-b border-emerald-500/30 shadow-xl px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Canvas: <code className="text-emerald-400 font-mono">/{slug}</code>
            </span>

            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                Unsaved Edits
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Edit / Preview Toggle */}
            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isEditMode ? "bg-emerald-500 text-zinc-950 font-bold shadow" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Pencil className="w-3.5 h-3.5" /> Visual Edit
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  !isEditMode ? "bg-emerald-500 text-zinc-950 font-bold shadow" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Live
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportProfile}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download your full profile configuration as JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export JSON
            </button>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Import profile from JSON file or AI prompt"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" /> Import Profile
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleRevert}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Revert
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Published!
                </>
              ) : isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Story Public Canvas with In-Place Editable Elements */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
        {/* Navigation Mockup */}
        <div className="flex flex-wrap items-center justify-between pb-8 border-b border-zinc-900 mb-10 gap-4">
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateField((p) => ({ ...p, name: e.target.value }))}
                  className="text-xl font-bold tracking-tight text-zinc-100 bg-zinc-900/60 px-2.5 py-1 rounded-xl border border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400 w-36"
                  placeholder="Your Name"
                />
                <span className="text-emerald-400 text-xl font-bold">.</span>
              </div>
            ) : (
              <span className="text-xl font-bold tracking-tight text-zinc-100">
                {profile.name}
                <span className="text-emerald-400">.</span>
              </span>
            )}

            {isEditMode ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-dashed border-zinc-700 text-zinc-300">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={profile.specs.base}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      specs: { ...p.specs, base: e.target.value },
                    }))
                  }
                  className="bg-transparent text-xs text-zinc-200 focus:outline-none w-40"
                  placeholder="Location / Base"
                />
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
                <MapPin className="w-3 h-3 text-emerald-400" /> {profile.specs.base}
              </span>
            )}
          </div>

          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 opacity-60">
            Say Hello <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left: Photo with Click-to-Change Overlay */}
            <div className="lg:col-span-5 relative group">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
                <Image
                  src={profile.images.hero}
                  alt={`${profile.name} portrait`}
                  fill
                  sizes="400px"
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

                {/* Edit Photo Overlay */}
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal("hero", "Hero Portrait")}
                    className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <div className="p-3 rounded-full bg-emerald-500 text-zinc-950 shadow-lg">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-100 bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-700">
                      Change Hero Photo
                    </span>
                  </button>
                )}

                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80">
                  <p className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {profile.name} • {profile.specs.height}
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Right Column: In-Place Text Fields */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tagline / Profession Pill */}
              <div className="inline-flex items-center gap-2">
                {isEditMode ? (
                  <div className="relative flex items-center">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={profile.tagline}
                      onChange={(e) => updateField((p) => ({ ...p, tagline: e.target.value }))}
                      className="pl-8 pr-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> {profile.tagline}
                  </div>
                )}
              </div>

              {/* Headline */}
              {isEditMode ? (
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                    Headline (Click to edit)
                  </label>
                  <textarea
                    rows={2}
                    value={profile.headline}
                    onChange={(e) => updateField((p) => ({ ...p, headline: e.target.value }))}
                    className="w-full text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-100 bg-zinc-900/40 p-2 rounded-2xl border border-dashed border-zinc-700 focus:outline-none focus:border-emerald-500 leading-tight"
                  />
                </div>
              ) : (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-tight">
                  {profile.headline}
                </h1>
              )}

              {/* Bio Paragraphs */}
              {isEditMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      Bio Paragraph 1
                    </label>
                    <textarea
                      rows={3}
                      value={profile.bio1}
                      onChange={(e) => updateField((p) => ({ ...p, bio1: e.target.value }))}
                      className="w-full text-sm sm:text-base text-zinc-300 bg-zinc-900/40 p-2 rounded-2xl border border-dashed border-zinc-700 focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                      Bio Paragraph 2
                    </label>
                    <textarea
                      rows={3}
                      value={profile.bio2}
                      onChange={(e) => updateField((p) => ({ ...p, bio2: e.target.value }))}
                      className="w-full text-sm sm:text-base text-zinc-300 bg-zinc-900/40 p-2 rounded-2xl border border-dashed border-zinc-700 focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">{profile.bio1}</p>
                  <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">{profile.bio2}</p>
                </>
              )}

              {/* Quick Spec Pills */}
              {isEditMode ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                    <Ruler className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="w-full">
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Height</div>
                      <input
                        type="text"
                        placeholder="e.g. 6'0''"
                        value={profile.specs.height}
                        onChange={(e) =>
                          updateField((p) => ({
                            ...p,
                            specs: { ...p.specs, height: e.target.value },
                          }))
                        }
                        className="w-full text-xs font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="w-full">
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Base</div>
                      <input
                        type="text"
                        placeholder="e.g. City, Country"
                        value={profile.specs.base}
                        onChange={(e) =>
                          updateField((p) => ({
                            ...p,
                            specs: { ...p.specs, base: e.target.value },
                          }))
                        }
                        className="w-full text-xs font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 col-span-2 sm:col-span-1">
                    <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="w-full">
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Lifestyle</div>
                      <input
                        type="text"
                        placeholder="e.g. Active, Fitness"
                        value={profile.specs.lifestyle}
                        onChange={(e) =>
                          updateField((p) => ({
                            ...p,
                            specs: { ...p.specs, lifestyle: e.target.value },
                          }))
                        }
                        className="w-full text-xs font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                (Boolean(profile.specs.height?.trim()) ||
                  Boolean(profile.specs.base?.trim()) ||
                  Boolean(profile.specs.lifestyle?.trim())) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {profile.specs.height?.trim() && (
                      <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                        <Ruler className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Height</div>
                          <div className="text-xs font-semibold text-zinc-200">{profile.specs.height}</div>
                        </div>
                      </div>
                    )}
                    {profile.specs.base?.trim() && (
                      <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Base</div>
                          <div className="text-xs font-semibold text-zinc-200">{profile.specs.base}</div>
                        </div>
                      </div>
                    )}
                    {profile.specs.lifestyle?.trim() && (
                      <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 col-span-2 sm:col-span-1">
                        <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Lifestyle</div>
                          <div className="text-xs font-semibold text-zinc-200">{profile.specs.lifestyle}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Dynamic Social Presence Links */}
              <div className="pt-2">
                {isEditMode ? (
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        Direct Profiles & Social Links (Optional)
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {Object.keys(profile.socials || {}).filter((k) => profile.socials?.[k as keyof typeof profile.socials] !== undefined).length} connected
                      </span>
                    </div>

                    {/* Active Social Inputs */}
                    {(() => {
                      const activeKeys = (Object.keys(profile.socials || {}) as Array<keyof NonNullable<ProfileConfig["socials"]>>)
                        .filter((k) => profile.socials?.[k] !== undefined);

                      if (activeKeys.length === 0) {
                        return (
                          <div className="py-2 text-xs text-zinc-500 italic bg-zinc-950/40 p-3 rounded-xl border border-dashed border-zinc-800/80">
                            No profiles attached yet. Click an option below to add a link.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {activeKeys.map((key) => {
                            const config = SOCIAL_CONFIGS.find((c) => c.key === key) || {
                              key,
                              label: key,
                              placeholder: "https://...",
                              icon: Sparkles,
                              color: "text-zinc-200",
                              badgeClass: "",
                            };
                            const Icon = config.icon;
                            return (
                              <div key={key} className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                    <span>{config.label}</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSocial(key)}
                                    className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition cursor-pointer"
                                    title={`Remove ${config.label}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                                <input
                                  type="url"
                                  placeholder={config.placeholder}
                                  value={profile.socials?.[key] || ""}
                                  onChange={(e) =>
                                    updateField((p) => ({
                                      ...p,
                                      socials: { ...p.socials, [key]: e.target.value },
                                    }))
                                  }
                                  className="w-full text-xs text-zinc-200 bg-zinc-900 p-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Unadded Platforms Quick-Add Bar */}
                    {(() => {
                      const unadded = SOCIAL_CONFIGS.filter(
                        (s) => !profile.socials || profile.socials[s.key] === undefined
                      );
                      if (unadded.length === 0) return null;

                      return (
                        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            Add profile link:
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {unadded.map((s) => {
                              const Icon = s.icon;
                              return (
                                <button
                                  key={s.key}
                                  type="button"
                                  onClick={() => handleAddSocial(s.key)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer group"
                                >
                                  <Plus className="w-3 h-3 text-emerald-400 group-hover:scale-125 transition" />
                                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                                  <span>{s.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  (() => {
                    const activePlatforms = SOCIAL_CONFIGS.filter(
                      (s) => profile.socials?.[s.key] && profile.socials[s.key]!.trim().length > 0
                    );
                    if (activePlatforms.length === 0) return null;

                    return (
                      <div className="flex flex-wrap items-center gap-2">
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
                  })()
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Section 1: The Craft & Lab */}
        <section className="py-16 border-t border-zinc-900">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Cpu className="w-4 h-4" /> The Craft & Engineering
            </span>

            {isEditMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.craft.title}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      craft: { ...p.craft, title: e.target.value },
                    }))
                  }
                  className="w-full text-2xl sm:text-3xl font-bold text-zinc-100 bg-zinc-900/40 p-2 rounded-xl border border-dashed border-zinc-700"
                />
                <textarea
                  rows={2}
                  value={profile.craft.subtitle}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      craft: { ...p.craft, subtitle: e.target.value },
                    }))
                  }
                  className="w-full text-sm text-zinc-400 bg-zinc-900/40 p-2 rounded-xl border border-dashed border-zinc-700"
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">{profile.craft.title}</h2>
                <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {profile.craft.subtitle}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Craft Photo with Hover Change */}
            <div className="relative aspect-video sm:aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
              <Image
                src={profile.images.craftDesk}
                alt="Workspace and research lab"
                fill
                sizes="500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => handleOpenPhotoModal("craftDesk", "The Craft & Engineering Photo")}
                  className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="p-3 rounded-full bg-emerald-500 text-zinc-950 shadow-lg">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-100 bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-700">
                    Change Workspace Photo
                  </span>
                </button>
              )}

              <div className="absolute bottom-3 left-4 text-xs font-medium text-zinc-300">
                Focus Space: Multi-monitor engineering and remote research setup
              </div>
            </div>

            {/* Craft Cards */}
            <div className="space-y-4">
              {profile.craft.cards.map((card, idx) => {
                const renderCardIcon = () => {
                  switch (card.id) {
                    case "cooking_market":
                      return <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "weightloss_grit":
                      return <Flame className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "hsp_empathy":
                      return <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />;
                    case "cybersecurity":
                    default:
                      return <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />;
                  }
                };

                return (
                  <div key={card.id || idx} className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 relative group">
                    {isEditMode ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={card.title}
                            placeholder="Focus area / pillar title"
                            onChange={(e) => {
                              const newCards = [...profile.craft.cards];
                              newCards[idx].title = e.target.value;
                              updateField((p) => ({
                                ...p,
                                craft: { ...p.craft, cards: newCards },
                              }));
                            }}
                            className="w-full text-base font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                          />
                          {profile.craft.cards.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newCards = profile.craft.cards.filter((_, i) => i !== idx);
                                updateField((p) => ({
                                  ...p,
                                  craft: { ...p.craft, cards: newCards },
                                }));
                              }}
                              className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Remove this focus area"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={card.desc}
                          placeholder="Description of this domain or philosophy..."
                          onChange={(e) => {
                            const newCards = [...profile.craft.cards];
                            newCards[idx].desc = e.target.value;
                            updateField((p) => ({
                              ...p,
                              craft: { ...p.craft, cards: newCards },
                            }));
                          }}
                          className="w-full text-xs text-zinc-400 bg-transparent border border-dashed border-zinc-700 rounded-lg p-1.5 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                          {renderCardIcon()} {card.title}
                        </h3>
                        <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">{card.desc}</p>
                        {card.image && (
                          <div className="mt-3 relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-zinc-800/80">
                            <Image
                              src={card.image}
                              alt={card.title}
                              fill
                              sizes="400px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                            {card.imageCaption && (
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-sm text-[11px] font-medium text-zinc-300 border border-zinc-800/60">
                                {card.imageCaption}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    const newCards = [
                      ...profile.craft.cards,
                      {
                        id: `craft_${Date.now()}`,
                        title: "New Focus Area",
                        desc: "Describe your technical domain, craft, or creative discipline...",
                      },
                    ];
                    updateField((p) => ({
                      ...p,
                      craft: { ...p.craft, cards: newCards },
                    }));
                  }}
                  className="w-full py-3 rounded-2xl border border-dashed border-zinc-700 hover:border-emerald-500/50 text-xs font-semibold text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Craft Pillar / Focus Area
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Visual Moments & Rhythm */}
        <section className="py-16 border-t border-zinc-900">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Compass className="w-4 h-4" /> Rhythm & Downtime
            </span>

            {isEditMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.rhythm.title}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      rhythm: { ...p.rhythm, title: e.target.value },
                    }))
                  }
                  className="w-full text-2xl sm:text-3xl font-bold text-zinc-100 bg-zinc-900/40 p-2 rounded-xl border border-dashed border-zinc-700"
                />
                <textarea
                  rows={2}
                  value={profile.rhythm.subtitle}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      rhythm: { ...p.rhythm, subtitle: e.target.value },
                    }))
                  }
                  className="w-full text-sm text-zinc-400 bg-zinc-900/40 p-2 rounded-xl border border-dashed border-zinc-700"
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">{profile.rhythm.title}</h2>
                <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {profile.rhythm.subtitle}
                </p>
              </>
            )}
          </div>

          {/* 3 Photo Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Friends Outdoor */}
            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.friendsTrip}
                  alt="Outdoor friends"
                  fill
                  sizes="350px"
                  className="object-cover"
                />
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal("friendsTrip", "The Starting Point Photo (04 Mar 2024)")}
                    className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-full bg-emerald-500 text-zinc-950 shadow-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-100 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-700">
                      Change Photo
                    </span>
                  </button>
                )}
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                {isEditMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={profile.rhythm.card1Title || ""}
                      placeholder="The Starting Point (04 Mar 2024)"
                      onChange={(e) =>
                        updateField((p) => ({
                          ...p,
                          rhythm: { ...p.rhythm, card1Title: e.target.value },
                        }))
                      }
                      className="w-full text-sm font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                    <textarea
                      rows={2}
                      value={profile.rhythm.card1Desc || ""}
                      placeholder="Where the commitment began..."
                      onChange={(e) =>
                        updateField((p) => ({
                          ...p,
                          rhythm: { ...p.rhythm, card1Desc: e.target.value },
                        }))
                      }
                      className="w-full text-xs text-zinc-400 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-zinc-200">
                      {profile.rhythm.card1Title || "The Starting Point (04 Mar 2024)"}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400">
                      {profile.rhythm.card1Desc || "Where the commitment began. Deciding to reclaim my health, stamina, and discipline."}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: Six Months Milestone */}
            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.formalWaistcoat}
                  alt="Transformation milestone"
                  fill
                  sizes="350px"
                  className="object-cover"
                />
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal("formalWaistcoat", "Six Months Milestone Photo (12 Sep 2024)")}
                    className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-full bg-emerald-500 text-zinc-950 shadow-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-100 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-700">
                      Change Photo
                    </span>
                  </button>
                )}
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                {isEditMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={profile.rhythm.card2Title || ""}
                      placeholder="Six Months of Grit (12 Sep 2024)"
                      onChange={(e) =>
                        updateField((p) => ({
                          ...p,
                          rhythm: { ...p.rhythm, card2Title: e.target.value },
                        }))
                      }
                      className="w-full text-sm font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                    <textarea
                      rows={2}
                      value={profile.rhythm.card2Desc || ""}
                      placeholder="Proof of follow-through..."
                      onChange={(e) =>
                        updateField((p) => ({
                          ...p,
                          rhythm: { ...p.rhythm, card2Desc: e.target.value },
                        }))
                      }
                      className="w-full text-xs text-zinc-400 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-zinc-200">
                      {profile.rhythm.card2Title || "Six Months of Grit (12 Sep 2024)"}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400">
                      {profile.rhythm.card2Desc || "Proof of follow-through. Not at my absolute peak yet, but living proof that when I take something to heart, I see it through no matter what."}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Card 3: Active Outdoor Living */}
            <div className="group relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={profile.images.casualOutdoor}
                  alt="Active outdoor living"
                  fill
                  sizes="350px"
                  className="object-cover"
                />
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal("casualOutdoor", "Active Living Photo")}
                    className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 cursor-pointer"
                  >
                    <div className="p-2.5 rounded-full bg-emerald-500 text-zinc-950 shadow-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-100 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-700">
                      Change Photo
                    </span>
                  </button>
                )}
              </div>
              <div className="p-4 bg-zinc-900/90 border-t border-zinc-800/60">
                {isEditMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={profile.rhythm.card3Title || ""}
                      placeholder="Active Living & True Friends"
                      onChange={(e) =>
                        updateField((p) => ({
                          ...p,
                          rhythm: { ...p.rhythm, card3Title: e.target.value },
                        }))
                      }
                      className="w-full text-sm font-semibold text-zinc-200 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                    <textarea
                      rows={2}
                      value={profile.rhythm.card3Desc || ""}
                      placeholder="Coastal trails, fresh sea breezes..."
                      onChange={(e) =>
                        updateField((p) => ({
                          ...p,
                          rhythm: { ...p.rhythm, card3Desc: e.target.value },
                        }))
                      }
                      className="w-full text-xs text-zinc-400 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="text-sm font-semibold text-zinc-200">
                      {profile.rhythm.card3Title || "Active Living & True Friends"}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400">
                      {profile.rhythm.card3Desc || "Coastal trails, fresh sea breezes, and genuine friendships that keep life grounded and fun."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Partner Vision */}
        <section className="py-16 border-t border-zinc-900">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Heart className="w-4 h-4" /> Partnership Vision
            </span>

            {isEditMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={profile.partnerVision.title}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      partnerVision: { ...p.partnerVision, title: e.target.value },
                    }))
                  }
                  className="w-full text-2xl sm:text-3xl font-bold text-zinc-100 bg-zinc-900/40 p-2 rounded-xl border border-dashed border-zinc-700"
                />
                <textarea
                  rows={2}
                  value={profile.partnerVision.subtitle}
                  onChange={(e) =>
                    updateField((p) => ({
                      ...p,
                      partnerVision: { ...p.partnerVision, subtitle: e.target.value },
                    }))
                  }
                  className="w-full text-sm text-zinc-400 bg-zinc-900/40 p-2 rounded-xl border border-dashed border-zinc-700"
                />
              </div>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">
                  {profile.partnerVision.title}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {profile.partnerVision.subtitle}
                </p>
              </>
            )}
          </div>

          {/* Dynamic Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.partnerVision.pillars.map((pillar, idx) => (
              <div key={pillar.num || idx} className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {pillar.num}
                  </div>
                  {isEditMode && profile.partnerVision.pillars.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newPillars = profile.partnerVision.pillars
                          .filter((_, i) => i !== idx)
                          .map((p, i) => ({ ...p, num: String(i + 1).padStart(2, "0") }));
                        updateField((p) => ({
                          ...p,
                          partnerVision: { ...p.partnerVision, pillars: newPillars },
                        }));
                      }}
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Remove pillar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={pillar.title}
                      placeholder="Pillar title / core value"
                      onChange={(e) => {
                        const newPillars = [...profile.partnerVision.pillars];
                        newPillars[idx].title = e.target.value;
                        updateField((p) => ({
                          ...p,
                          partnerVision: { ...p.partnerVision, pillars: newPillars },
                        }));
                      }}
                      className="w-full text-base font-semibold text-zinc-100 bg-transparent border-b border-dashed border-zinc-700 focus:outline-none focus:border-emerald-400"
                    />
                    <textarea
                      rows={3}
                      value={pillar.desc}
                      placeholder="What this pillar represents in a lasting partnership..."
                      onChange={(e) => {
                        const newPillars = [...profile.partnerVision.pillars];
                        newPillars[idx].desc = e.target.value;
                        updateField((p) => ({
                          ...p,
                          partnerVision: { ...p.partnerVision, pillars: newPillars },
                        }));
                      }}
                      className="w-full text-xs text-zinc-400 bg-transparent border border-dashed border-zinc-700 rounded-lg p-2 focus:outline-none focus:border-emerald-400 leading-relaxed"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-zinc-100">{pillar.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{pillar.desc}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {isEditMode && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  const nextNum = String(profile.partnerVision.pillars.length + 1).padStart(2, "0");
                  const newPillars = [
                    ...profile.partnerVision.pillars,
                    {
                      num: nextNum,
                      title: "Core Partnership Value",
                      desc: "What this value means to you and how you wish to experience it in a relationship...",
                    },
                  ];
                  updateField((p) => ({
                    ...p,
                    partnerVision: { ...p.partnerVision, pillars: newPillars },
                  }));
                }}
                className="w-full py-3.5 border border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-2xl text-xs font-semibold text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Partnership Pillar
              </button>
            </div>
          )}
        </section>

        {/* Section 4: Contact Box Mockup */}
        <section className="py-16 border-t border-zinc-900">
          <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 text-center max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl font-bold text-zinc-100 flex items-center justify-center gap-2">
              {profile.contact.title} <Sparkles className="w-5 h-5 text-amber-400" />
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {profile.contact.subtitle}
            </p>
            <div className="pt-4">
              <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                Visitor Contact Form Live on Public Story
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Photo Picker Modal */}
      {activePhotoKey && (
        <PhotoEditorModal
          isOpen={Boolean(activePhotoKey)}
          onClose={() => setActivePhotoKey(null)}
          currentUrl={profile.images[activePhotoKey]}
          photoLabel={photoModalLabel}
          onApply={handleApplyPhoto}
          slug={slug}
          token={token}
        />
      )}

      {/* AI / LLM Import Modal */}
      <ImportFromLLMModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentProfile={profile}
        onImport={handleImportFromLLM}
      />
    </div>
  );
}
