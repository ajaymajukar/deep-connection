"use client";

import { useState } from "react";
import { Compass, CheckCircle2, Sparkles, ArrowDown, MessageSquareHeart } from "lucide-react";
import { ValuesMirrorScenario } from "@/lib/profile";

interface ValuesMirrorSectionProps {
  ownerName: string;
  title?: string;
  subtitle?: string;
  scenarios: ValuesMirrorScenario[];
  onBringToNote?: (reflectionSummary: string) => void;
}

const HARMONY_BADGES: Record<string, { label: string; className: string }> = {
  aligned: {
    label: "Aligned Wavelength",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  complementary: {
    label: "Complementary Balance",
    className: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  distinct: {
    label: "Honest Perspective",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
};

export default function ValuesMirrorSection({
  ownerName,
  title = "Values & Communication Mirror",
  subtitle = "No matchmaking scores or gimmicks—explore how our instincts harmonize across everyday relationship scenarios.",
  scenarios,
  onBringToNote,
}: ValuesMirrorSectionProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  if (!scenarios || scenarios.length === 0) return null;

  const exploredCount = Object.keys(selections).length;

  const handleSelectOption = (scenarioId: string, optionId: string) => {
    setSelections((prev) => ({
      ...prev,
      [scenarioId]: optionId,
    }));
  };

  const handleBringReflections = () => {
    if (!onBringToNote) return;
    const lines = scenarios
      .map((s) => {
        const chosenId = selections[s.id];
        const chosenOpt = s.options.find((o) => o.id === chosenId);
        if (!chosenOpt) return null;
        return `• ${s.topic}: "${chosenOpt.shortTag}" — ${chosenOpt.label}`;
      })
      .filter(Boolean);

    if (lines.length === 0) return;

    const summary = `I explored your Values Mirror and here's how I naturally approach things:\n${lines.join("\n")}\n\nWhat caught my attention most: `;
    onBringToNote(summary);
  };

  return (
    <section data-section="mirror" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
            <Compass className="w-4 h-4" /> Alignment Check
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">{title}</h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">{subtitle}</p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 shrink-0 self-start sm:self-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              exploredCount > 0 ? "bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          <span>
            {exploredCount} of {scenarios.length} explored
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {scenarios.map((scenario, idx) => {
          const selectedOptId = selections[scenario.id];
          const selectedOpt = scenario.options.find((o) => o.id === selectedOptId);
          const badge = selectedOpt
            ? HARMONY_BADGES[selectedOpt.harmonyLevel] || HARMONY_BADGES.aligned
            : null;

          return (
            <div
              key={scenario.id || idx}
              className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  0{idx + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {scenario.topic}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 leading-snug">
                {scenario.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {scenario.options.map((opt) => {
                  const isSelected = selectedOptId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(scenario.id, opt.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                          : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isSelected
                              ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`}
                        >
                          {opt.shortTag}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed ${isSelected ? "text-zinc-100" : "text-zinc-300"}`}>
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Revealed Reflection from Owner */}
              {selectedOpt && badge && (
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-emerald-500/25 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <MessageSquareHeart className="w-4 h-4 text-emerald-400" />
                      {ownerName}&apos;s Perspective
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {selectedOpt.ownerReflection}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transparent Optional Action: Pre-fill Contact Note */}
      {exploredCount > 0 && onBringToNote && (
        <div className="mt-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-zinc-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-zinc-100 flex items-center justify-center sm:justify-start gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Skip the awkward &ldquo;Hey, how are you?&rdquo; opener
            </p>
            <p className="text-xs text-zinc-400">
              Optionally pre-fill your note box below with the {exploredCount} reflection{exploredCount > 1 ? "s" : ""} you picked—you can edit every word before sending.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBringReflections}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <span>Include in My Note</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
