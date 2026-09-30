"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not dismissed previously in this session
      if (!sessionStorage.getItem("vyom_pwa_dismissed")) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install VYOM on your device, tap 'Share' or browser menu (⋮) and select 'Add to Home Screen'.");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("vyom_pwa_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 p-3.5 rounded-2xl bg-obsidian text-paper shadow-elevated border border-line flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky/20 text-blue flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-paper">Install VYOM App</p>
          <p className="text-[11px] text-slate">Fast offline access & instant soundbox alerts</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="py-1.5 px-3 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate hover:text-paper"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
