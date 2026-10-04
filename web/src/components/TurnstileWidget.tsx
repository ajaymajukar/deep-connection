"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (error: any) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export default function TurnstileWidget({ onVerify, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAFNp6ag9sIL7YDzb";

  useEffect(() => {
    // If turnstile script is not already injected, inject it
    const existingScript = document.getElementById("turnstile-script");

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            callback: (token: string) => {
              onVerify(token);
            },
            "error-callback": (err: any) => {
              console.warn("Turnstile widget error:", err);
              if (onError) onError("Verification challenge failed.");
            },
          });
          setIsLoaded(true);
        } catch (e) {
          console.error("Failed to render Turnstile widget:", e);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else if (!existingScript) {
      window.onloadTurnstileCallback = () => {
        renderWidget();
      };

      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setLoadError(true);
        if (onError) onError("Could not load bot protection script.");
      };
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 200);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch {
          // Ignore unmount error
        }
      }
    };
  }, [siteKey, onVerify, onError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70px]">
      <div ref={containerRef} className="my-2" />
      {loadError && (
        <p className="text-xs text-rose-400 mt-2">
          Unable to load verification widget. Please disable strict ad-blockers for this page.
        </p>
      )}
    </div>
  );
}
