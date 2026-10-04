"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Image as ImageIcon, Link as LinkIcon, Upload, Check, Loader2, Sparkles } from "lucide-react";

interface PhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  photoLabel: string;
  onApply: (newUrl: string) => void;
  slug?: string;
  token?: string;
}

const CURATED_PRESETS = [
  { label: "Modern Portrait", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80" },
  { label: "Workspace / Engineering", url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80" },
  { label: "Friends & Outing", url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80" },
  { label: "Classic Formal", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80" },
  { label: "Outdoor Trail / Travel", url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80" },
  { label: "Casual Coffee & Cafe", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80" },
  { label: "Coastline & Sun", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80" },
  { label: "Studio Clean", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" },
];

export default function PhotoEditorModal({
  isOpen,
  onClose,
  currentUrl,
  photoLabel,
  onApply,
  slug = "realm",
  token = "",
}: PhotoEditorModalProps) {
  const [selectedUrl, setSelectedUrl] = useState(currentUrl);
  const [customInputUrl, setCustomInputUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"preset" | "url" | "upload">("preset");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = CURATED_PRESETS;

  // Helper function to compress image on client-side using HTML5 Canvas
  const compressClientSide = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1400; // ample resolution for crisp retina display
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Export high-quality JPEG at 82% quality (shrinks 10MB -> ~180KB)
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadStatus("Optimizing photo for fast web loading...");

    try {
      const origSizeMb = (file.size / (1024 * 1024)).toFixed(1);

      // Attempt server upload first if token is available
      if (token) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch(`/api/realms/${slug}/upload?key=${encodeURIComponent(token)}`, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setSelectedUrl(data.url);
              const newSizeKb = Math.round((data.sizeBytes || 0) / 1024);
              setUploadStatus(`Photo optimized & uploaded (${origSizeMb} MB → ${newSizeKb} KB)`);
              setIsProcessing(false);
              return;
            }
          }
        } catch (serverErr) {
          console.warn("Server upload fallback to client compression:", serverErr);
        }
      }

      // Fallback: compress in browser to ~180KB base64
      const compressedDataUrl = await compressClientSide(file);
      setSelectedUrl(compressedDataUrl);
      const estKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
      setUploadStatus(`Photo compressed (${origSizeMb} MB → ~${estKb} KB, ready to save)`);
    } catch (err) {
      console.error("Compression error:", err);
      setUploadStatus("Could not process this image file. Please try another.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (activeTab === "url" && customInputUrl.trim()) {
      onApply(customInputUrl.trim());
    } else {
      onApply(selectedUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" /> Change {photoLabel}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select an optimized preset, paste any public image link, or upload from your device.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("preset")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === "preset"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Portfolio Presets ({presets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === "url"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Paste URL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeTab === "upload"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Upload Any Photo
          </button>
        </div>

        {/* Presets Tab */}
        {activeTab === "preset" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
            {presets.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => setSelectedUrl(preset.url)}
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 transition text-left cursor-pointer group ${
                  selectedUrl === preset.url
                    ? "border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Image
                  src={preset.url}
                  alt={preset.label}
                  fill
                  sizes="150px"
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-[10px] font-medium text-zinc-200 truncate">
                  {preset.label}
                </span>
                {selectedUrl === preset.url && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* URL Input Tab */}
        {activeTab === "url" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400">
              Paste Direct Public Image Link
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={customInputUrl}
                onChange={(e) => {
                  setCustomInputUrl(e.target.value);
                  setSelectedUrl(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Supports links from Imgur, Cloudinary, AWS S3, GitHub raw, etc.
            </p>
          </div>
        )}

        {/* Upload Tab with Auto-Optimization */}
        {activeTab === "upload" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-400">
              Upload from your phone or computer
            </label>
            <label className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-zinc-950/40 group">
              {isProcessing ? (
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
              ) : (
                <Upload className="w-6 h-6 text-zinc-400 group-hover:text-emerald-400 transition mb-2" />
              )}
              <span className="text-xs font-medium text-zinc-300">
                {isProcessing ? "Optimizing image..." : "Click to choose high-res photo"}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">
                Auto-compressed to ultra-fast web dimensions (max 1400px)
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={isProcessing}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadStatus && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Preview of Chosen Image */}
        {selectedUrl && (
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-800">
              <Image src={selectedUrl} alt="Preview" fill sizes="48px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-zinc-300">Selected Image Preview</span>
              <span className="block text-[11px] text-zinc-500 truncate">{selectedUrl}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Apply Photo
          </button>
        </div>
      </div>
    </div>
  );
}
