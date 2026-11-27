"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Upload,
  Trash2,
  Save,
  Check,
  Volume2,
  Lock,
  Loader2,
  FileText,
  Sparkles,
} from "lucide-react";
import { VoiceNoteMeta } from "@/lib/profile";

interface VoiceNoteStudioProps {
  slug: string;
  token: string;
  ownerName: string;
  voiceNote?: VoiceNoteMeta;
  onVoiceUpdated: (nextVoiceMeta: VoiceNoteMeta) => void;
}

export default function VoiceNoteStudio({
  slug,
  token,
  ownerName,
  voiceNote,
  onVoiceUpdated,
}: VoiceNoteStudioProps) {
  const [title, setTitle] = useState(voiceNote?.title || `A Quick Voice Intro from ${ownerName}`);
  const [subtitle, setSubtitle] = useState(
    voiceNote?.subtitle || "Text does not always get tone across, so here is 30 seconds in my own voice."
  );
  const [transcript, setTranscript] = useState(voiceNote?.transcript || "");
  const [requireUnlock, setRequireUnlock] = useState(Boolean(voiceNote?.requireUnlock));
  const [enabled, setEnabled] = useState(voiceNote?.enabled !== false);
  const [hasServerAudio, setHasServerAudio] = useState(Boolean(voiceNote?.hasAudio));

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
  const [pendingMimeType, setPendingMimeType] = useState<string>("audio/webm");
  const [pendingDuration, setPendingDuration] = useState<number | undefined>(voiceNote?.durationSec);

  const [isSaving, setIsSaving] = useState(false);
  const [audioVersion, setAudioVersion] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = timerRef;
    const recorder = mediaRecorderRef;
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (recorder.current && recorder.current.state !== "inactive") {
        recorder.current.stop();
      }
    };
  }, []);

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const supportedMime = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime, audioBitsPerSecond: 48000 })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      let seconds = 0;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const mime = recorder.mimeType || supportedMime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPendingAudioUrl(reader.result as string);
          setPendingMimeType(mime);
          setPendingDuration(Math.max(1, seconds));
          setStatusMsg(`Recorded ${Math.max(1, seconds)}s voice preview. Click "Publish Voice Note" to save.`);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        seconds += 1;
        setRecordSeconds(seconds);
        if (seconds >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      setErrorMsg("Could not access microphone. Allow mic permission in browser or upload an audio file instead.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setStatusMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setErrorMsg("Please choose an audio file (MP3, M4A, WAV, or WebM).");
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setErrorMsg("Audio file is over 2.5MB. Keep voice notes concise (under 60 seconds).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const audioEl = new Audio(dataUrl);
      audioEl.onloadedmetadata = () => {
        setPendingAudioUrl(dataUrl);
        setPendingMimeType(file.type || "audio/mpeg");
        setPendingDuration(isFinite(audioEl.duration) ? Math.round(audioEl.duration) : undefined);
        setStatusMsg(`Loaded "${file.name}". Click "Publish Voice Note" to save live.`);
      };
      audioEl.onerror = () => {
        setPendingAudioUrl(dataUrl);
        setPendingMimeType(file.type || "audio/mpeg");
        setStatusMsg(`Loaded "${file.name}". Click "Publish Voice Note" to save live.`);
      };
    };
    reader.readAsDataURL(file);
  };

  const handlePublishVoice = async () => {
    setErrorMsg(null);
    setStatusMsg(null);

    if (!pendingAudioUrl && !hasServerAudio) {
      setErrorMsg("Record a quick voice clip or upload an audio file first.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/realms/${slug}/voice?key=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl: pendingAudioUrl || undefined,
          mimeType: pendingAudioUrl ? pendingMimeType : undefined,
          durationSec: pendingDuration,
          title: title.trim() || `A Quick Voice Intro from ${ownerName}`,
          subtitle: subtitle.trim(),
          transcript: transcript.trim(),
          requireUnlock,
          enabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to publish voice note.");
      }

      setHasServerAudio(Boolean(data.voiceNote?.hasAudio));
      setPendingAudioUrl(null);
      setAudioVersion((v) => v + 1);
      onVoiceUpdated(data.voiceNote);
      setStatusMsg("Voice note published live on your Story Realm!");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving voice note.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVoice = async () => {
    if (!confirm("Remove the recorded voice note from your realm?")) return;
    setIsSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/realms/${slug}/voice?key=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove voice note.");
      setHasServerAudio(false);
      setPendingAudioUrl(null);
      onVoiceUpdated({
        enabled,
        title,
        subtitle,
        transcript,
        requireUnlock,
        hasAudio: false,
      });
      setStatusMsg("Voice note removed.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error removing voice note.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-zinc-900/70 border border-emerald-500/25 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              Voice Intro Studio <Sparkles className="w-3 h-3 text-amber-400" />
            </h4>
            <p className="text-[11px] text-zinc-400">
              {hasServerAudio
                ? "Audio is live. A short voice clip makes a first impression much warmer."
                : "Optional 20 to 45s voice note (hidden on public page until recorded)."}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
            hasServerAudio
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          {hasServerAudio ? "Audio Live" : "Not Recorded Yet"}
        </span>
      </div>

      {/* Record or Upload Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Stop Recording ({recordSeconds}s / 60s)
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            {pendingAudioUrl || hasServerAudio ? "Re-record Mic Clip" : "Record from Mic (30s)"}
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          Upload Audio
        </button>

        {hasServerAudio && (
          <button
            type="button"
            onClick={handleDeleteVoice}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Audio
          </button>
        )}
      </div>

      {/* Preview Player */}
      {(pendingAudioUrl || hasServerAudio) && (
        <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
          <audio
            controls
            src={pendingAudioUrl || `/api/realms/${slug}/voice?key=${encodeURIComponent(token)}&v=${audioVersion}`}
            className="w-full h-9"
          />
        </div>
      )}

      {/* Title, Transcript & Privacy Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Player Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`A Quick Voice Intro from ${ownerName}`}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Why I built this quiet space..."
            className="w-full px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Optional Transcript
        </label>
        <textarea
          rows={2}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Optional caption for visitors browsing silently on mute..."
          className="w-full px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/60"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-zinc-700 text-emerald-500"
            />
            <span>Show on Story</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={requireUnlock}
              onChange={(e) => setRequireUnlock(e.target.checked)}
              className="rounded border-zinc-700 text-amber-500"
            />
            <span className="flex items-center gap-1 text-zinc-300">
              <Lock className="w-3 h-3 text-amber-400" />
              Require Mutual Reveal to Listen
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={handlePublishVoice}
          disabled={isSaving || (!pendingAudioUrl && !hasServerAudio)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/15"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" /> Publish Voice Note
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 shrink-0" /> {statusMsg}
        </p>
      )}
      {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
    </div>
  );
}
