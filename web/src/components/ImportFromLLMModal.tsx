"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  X,
  FileJson,
  CheckCircle2,
  Wand2,
  Upload
} from "lucide-react";
import { ProfileConfig } from "@/lib/profile";

interface ImportFromLLMModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: ProfileConfig;
  onImport: (updatedProfile: ProfileConfig) => void;
}

export default function ImportFromLLMModal({
  isOpen,
  onClose,
  currentProfile,
  onImport,
}: ImportFromLLMModalProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "prompt">("paste");
  const [rawInput, setRawInput] = useState("");
  const [parsedData, setParsedData] = useState<Partial<ProfileConfig> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const promptTemplate = `You are an expert personal branding and storytelling consultant. 
Help me craft an authentic, emotionally mature Story Realm profile. 
Here is my raw background, bio, or resume:
[PASTE YOUR RESUME, DATING BIO, OR THOUGHTS HERE]

Please structure your response into this exact JSON format. Focus on emotional maturity, clear craftsmanship, and genuine life values:

{
  "name": "${currentProfile.name || "Your Name"}",
  "tagline": "Brief professional / creative title",
  "headline": "A captivating, intentional 1-line headline about what you're seeking",
  "bio1": "A warm 2-3 sentence introduction sharing your craft, where you're based, and your space.",
  "bio2": "A thoughtful 2-3 sentence reflection on your relationship philosophy, honesty, and values.",
  "specs": {
    "height": "${currentProfile.specs?.height || "5'10\\\" (178 cm)"}",
    "base": "${currentProfile.specs?.base || "City, Region"}",
    "lifestyle": "Non-Smoker • Active",
    "career": "Your Field / Craft"
  },
  "craft": {
    "title": "A headline about your craft or problem-solving approach",
    "subtitle": "A short paragraph describing what drives your daily focus and standards",
    "cards": [
      {
        "id": "craft1",
        "title": "Core Craft",
        "desc": "How you approach your profession and solving complex problems."
      },
      {
        "id": "craft2",
        "title": "Hobbies & Passions",
        "desc": "Projects, physical activities, or creative pursuits outside of work."
      },
      {
        "id": "craft3",
        "title": "Emotional Balance & Mindset",
        "desc": "Your emotional awareness, communication style, or mindfulness."
      }
    ]
  },
  "rhythm": {
    "title": "Daily rhythm, downtime, and weekends",
    "subtitle": "How you balance focused ambition with downtime and hosting",
    "highlightTitle": "Weekend Escapes & Discoveries",
    "highlightDesc": "Specific things you enjoy doing on weekend mornings or road trips."
  },
  "partnerVision": {
    "title": "The partner I hope to build a life with",
    "subtitle": "What you value most in an equal, ambitious life partnership",
    "pillars": [
      {
        "num": "01",
        "title": "Ambition & Her Own Craft",
        "desc": "Someone who has her own career, passions, and intellectual curiosity."
      },
      {
        "num": "02",
        "title": "Open & Mature Communication",
        "desc": "Direct, calm communication without mind games or silent treatments."
      },
      {
        "num": "03",
        "title": "Equal Partnership",
        "desc": "A modern, supportive partnership where decisions and victories are shared."
      },
      {
        "num": "04",
        "title": "Peaceful Sanctuary",
        "desc": "Building a peaceful home grounded in mutual trust, warmth, and boundaries."
      }
    ]
  },
  "contact": {
    "title": "Say Hello to ${currentProfile.name || "Me"}",
    "subtitle": "A warm invite encouraging thoughtful notes from potential matches",
    "notePlaceholder": "What resonated with you? Tell me a little about your world..."
  }
}

IMPORTANT: Output ONLY the valid JSON object, without conversational filler.`.trim();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleParseInput = (text: string) => {
    setRawInput(text);
    setParseError(null);
    setParsedData(null);

    if (!text.trim()) return;

    try {
      // 1. Strip markdown code fences if present
      let cleanText = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

      // 2. Extract outermost JSON object if wrapped in explanatory text
      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      // 3. Remove trailing commas before closing braces/brackets
      cleanText = cleanText.replace(/,\s*([}\]])/g, "$1");

      const parsed = JSON.parse(cleanText) as Partial<ProfileConfig>;

      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Extracted payload is not a valid JSON object.");
      }

      setParsedData(parsed);
    } catch (err: any) {
      setParseError(err.message || "Failed to parse JSON. Please verify the AI output format.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!parsedData) return;

    // Deep merge: preserve existing photos and fields unless explicitly overridden
    const merged: ProfileConfig = {
      ...currentProfile,
      name: parsedData.name?.trim() || currentProfile.name,
      tagline: parsedData.tagline?.trim() || currentProfile.tagline,
      headline: parsedData.headline?.trim() || currentProfile.headline,
      bio1: parsedData.bio1?.trim() || currentProfile.bio1,
      bio2: parsedData.bio2?.trim() || currentProfile.bio2,
      specs: {
        ...currentProfile.specs,
        ...(parsedData.specs || {}),
      },
      images: {
        ...currentProfile.images,
        ...(parsedData.images || {}),
      },
      craft: {
        ...currentProfile.craft,
        ...(parsedData.craft || {}),
        cards:
          Array.isArray(parsedData.craft?.cards) && parsedData.craft.cards.length > 0
            ? parsedData.craft.cards
            : currentProfile.craft.cards,
      },
      rhythm: {
        ...currentProfile.rhythm,
        ...(parsedData.rhythm || {}),
      },
      partnerVision: {
        ...currentProfile.partnerVision,
        ...(parsedData.partnerVision || {}),
        pillars:
          Array.isArray(parsedData.partnerVision?.pillars) && parsedData.partnerVision.pillars.length > 0
            ? parsedData.partnerVision.pillars
            : currentProfile.partnerVision.pillars,
      },
      contact: {
        ...currentProfile.contact,
        ...(parsedData.contact || {}),
      },
      socials: parsedData.socials !== undefined ? parsedData.socials : currentProfile.socials,
    };

    onImport(merged);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Import Story Profile
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Upload a exported JSON file, paste JSON directly, or generate using AI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "paste"
                ? "bg-purple-600 text-white font-bold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileJson className="w-3.5 h-3.5" /> 1. Upload or Paste JSON
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prompt")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "prompt"
                ? "bg-purple-600 text-white font-bold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> 2. AI Prompt Generator
          </button>
        </div>

        {/* Tab 1: Paste Input */}
        {activeTab === "paste" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-zinc-300">
                  Paste JSON or Upload File
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 border border-zinc-700 shadow-sm">
                    <Upload className="w-3 h-3 text-purple-400" />
                    <span>Upload .json</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {rawInput && (
                    <button
                      type="button"
                      onClick={() => handleParseInput("")}
                      className="text-zinc-500 hover:text-zinc-300 text-[11px]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={10}
                value={rawInput}
                onChange={(e) => handleParseInput(e.target.value)}
                placeholder='{\n  "name": "Your Name",\n  "headline": "A quiet space to connect intentionally...",\n  "craft": {\n    "title": "What I build and care about..."\n  }\n}'
                className="w-full p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-700 font-mono text-xs focus:outline-none focus:border-purple-500/60 resize-none leading-relaxed"
              />
            </div>

            {parseError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedData && (
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Valid Story Profile Recognized:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {parsedData.headline && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      ✓ Headline: <span className="text-zinc-100 font-medium">"{parsedData.headline.slice(0, 30)}..."</span>
                    </span>
                  )}
                  {parsedData.tagline && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      ✓ Tagline: <span className="text-zinc-100 font-medium">{parsedData.tagline}</span>
                    </span>
                  )}
                  {parsedData.bio1 && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      ✓ Bio Updated
                    </span>
                  )}
                  {parsedData.specs && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      ✓ Specs ({parsedData.specs.base || "Base"})
                    </span>
                  )}
                  {parsedData.craft?.cards && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      ✓ {parsedData.craft.cards.length} Craft Cards
                    </span>
                  )}
                  {parsedData.partnerVision?.pillars && (
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                      ✓ {parsedData.partnerVision.pillars.length} Partner Vision Pillars
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500">
                  * Note: Your existing photos will be kept untouched unless the AI payload explicitly provided new image URLs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Prompt Generator */}
        {activeTab === "prompt" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" /> Copy this prompt into ChatGPT, Claude, or Gemini:
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Prompt
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
              {promptTemplate}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!parsedData}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" /> Apply to Live Profile <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
