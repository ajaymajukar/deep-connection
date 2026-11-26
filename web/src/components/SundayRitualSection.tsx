"use client";

import { useState } from "react";
import { Sun, Clock, Utensils, Compass, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { SundayMoment } from "@/lib/profile";

interface SundayRitualSectionProps {
  ownerName: string;
  title?: string;
  subtitle?: string;
  moments: SundayMoment[];
}

export default function SundayRitualSection({
  ownerName,
  title = "The Sunday Test: A Day in My World",
  subtitle = "Adjectives rarely show what daily life with someone feels like. Here is how a favorite unhurried Sunday unfolds.",
  moments,
}: SundayRitualSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!moments || moments.length === 0) return null;

  const safeIndex = activeIndex >= moments.length ? 0 : activeIndex;
  const activeMoment = moments[safeIndex];

  const getMomentIcon = (idx: number) => {
    if (idx === 0) return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
    if (idx === 1) return <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />;
    return <Compass className="w-4 h-4 text-cyan-400 shrink-0" />;
  };

  return (
    <section data-section="sunday" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-zinc-900">
      <div className="max-w-2xl mb-10">
        <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
          <Clock className="w-4 h-4" /> A Day in {ownerName}&apos;s World
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">{title}</h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">{subtitle}</p>
      </div>

      {/* Interactive Time-of-Day Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {moments.map((moment, idx) => {
          const isActive = idx === safeIndex;
          return (
            <button
              key={moment.id || idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer group ${
                isActive
                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isActive
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                  }`}
                >
                  {moment.time}
                </span>
                {getMomentIcon(idx)}
              </div>
              <div className="text-sm font-semibold text-zinc-100 truncate">{moment.label}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{moment.atmosphere}</div>
            </button>
          );
        })}
      </div>

      {/* Focused Moment Spotlight Card */}
      <div className="relative rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold">
                <Clock className="w-3.5 h-3.5" /> {activeMoment.time} • {activeMoment.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-[11px] font-medium">
                <Sparkles className="w-3 h-3 text-amber-400" /> {activeMoment.atmosphere}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 leading-snug">
              {activeMoment.title}
            </h3>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {activeMoment.desc}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : moments.length - 1))}
              aria-label="Previous Sunday moment"
              className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-500 px-1.5">
              {safeIndex + 1} / {moments.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev < moments.length - 1 ? prev + 1 : 0))}
              aria-label="Next Sunday moment"
              className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
