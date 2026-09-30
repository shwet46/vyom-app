"use client";

import React from "react";
import { Mic, Camera } from "lucide-react";

interface GlobalFABsProps {
  onOpenVoice: () => void;
  onOpenCamera: () => void;
  isListening?: boolean;
}

export function GlobalFABs({
  onOpenVoice,
  onOpenCamera,
  isListening = false,
}: GlobalFABsProps) {
  return (
    <div
      className="fixed right-5 z-20 flex flex-col items-center gap-3"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
    >
      {/* 📷 Camera FAB (48px, obsidian/paper with hairline border) */}
      <button
        onClick={onOpenCamera}
        className="w-12 h-12 rounded-full bg-paper border border-line text-obsidian shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
        aria-label="Scan Handwritten Khata Ledger"
        title="Scan Handwritten Khata Page"
      >
        <Camera className="w-5 h-5 text-obsidian group-hover:text-blue transition-colors" />
      </button>

      {/* 🎙 Voice FAB (64px, blue background, mic icon) */}
      <button
        onClick={onOpenVoice}
        className={`w-16 h-16 rounded-full bg-blue text-paper shadow-fab flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative ${
          isListening ? "animate-pulse ring-4 ring-blue/40" : ""
        }`}
        aria-label="Talk to Vyom AI Copilot"
        title="Talk to Vyom Copilot"
      >
        <Mic className="w-7 h-7 stroke-[2.2px]" />
        {isListening && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-festive-vermilion border-2 border-paper animate-ping" />
        )}
      </button>
    </div>
  );
}
