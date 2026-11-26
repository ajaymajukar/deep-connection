"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Lock, Volume2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { VoiceNoteMeta } from "@/lib/profile";

interface VoiceIntroPlayerProps {
  slug: string;
  ownerName: string;
  voiceNote?: VoiceNoteMeta;
  isUnlocked: boolean;
  inviteToken?: string | null;
  unlockToken?: string | null;
  onRequestUnlock: () => void;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VoiceIntroPlayer({
  slug,
  ownerName,
  voiceNote,
  isUnlocked,
  inviteToken,
  unlockToken,
  onRequestUnlock,
}: VoiceIntroPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voiceNote?.durationSec || 0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    return () => {
      if (audioEl) {
        audioEl.pause();
      }
    };
  }, []);

  // Only show live player if voiceNote is enabled and audio actually exists on server
  if (!voiceNote || voiceNote.enabled === false || !voiceNote.hasAudio) {
    return null;
  }

  const isLocked = Boolean(voiceNote.requireUnlock && !isUnlocked);

  const buildAudioSrc = () => {
    const params = new URLSearchParams();
    if (unlockToken) params.set("unlockToken", unlockToken);
    if (inviteToken) params.set("invite", inviteToken);
    const qs = params.toString();
    return `/api/realms/${slug}/voice${qs ? `?${qs}` : ""}`;
  };

  const togglePlay = () => {
    if (isLocked) {
      onRequestUnlock();
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    setAudioError(null);
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Voice playback failed:", err);
        setAudioError("Tap again or complete unlock to listen.");
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const progressPct = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  return (
    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 backdrop-blur-md space-y-3">
      {!isLocked && (
        <audio
          ref={audioRef}
          src={buildAudioSrc()}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (isFinite(d) && d > 0) setDuration(d);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => {
            setIsPlaying(false);
          }}
        />
      )}

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isLocked ? "Unlock voice note" : isPlaying ? "Pause voice note" : "Play voice note"}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition cursor-pointer shadow-lg ${
            isLocked
              ? "bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
              : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
          }`}
        >
          {isLocked ? (
            <Lock className="w-4 h-4" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 truncate">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{voiceNote.title || `Voice Intro from ${ownerName}`}</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">
              {isLocked
                ? "Protected"
                : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </span>
          </div>

          {isLocked ? (
            <button
              type="button"
              onClick={onRequestUnlock}
              className="text-[11px] text-amber-300 hover:text-amber-200 transition text-left cursor-pointer"
            >
              Share your photo via Mutual Reveal to hear {ownerName}&apos;s voice →
            </button>
          ) : (
            <div className="relative flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration || 30}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Seek voice note"
                style={{
                  background: `linear-gradient(to right, #10b981 ${progressPct}%, #27272a ${progressPct}%)`,
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          )}
        </div>
      </div>

      {audioError && <p className="text-[11px] text-rose-400">{audioError}</p>}

      {voiceNote.subtitle && !isLocked && (
        <p className="text-[11px] text-zinc-400 leading-relaxed">{voiceNote.subtitle}</p>
      )}

      {voiceNote.transcript && !isLocked && (
        <div className="pt-1 border-t border-zinc-800/70">
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            className="text-[11px] text-zinc-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3 h-3" />
            <span>{showTranscript ? "Hide transcript" : "Read transcript"}</span>
            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTranscript && (
            <p className="mt-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/70 text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{voiceNote.transcript}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
