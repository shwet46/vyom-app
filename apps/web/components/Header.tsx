"use client";

import React, { useState } from "react";
import { useT, Language } from "../lib/i18n";
import { Sparkles, Calendar, Wifi, Sliders, Globe } from "lucide-react";

interface HeaderProps {
  onOpenDemo: () => void;
}

export function Header({ onOpenDemo }: HeaderProps) {
  const { lang, setLang, t } = useT();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: "hinglish", label: "Hinglish" },
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "mr", label: "मराठी" },
  ];

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-soft-line px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Store identity & Vyom badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-obsidian flex items-center justify-center text-paper font-display font-bold text-lg shadow-button">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base sm:text-lg text-obsidian tracking-tight">
                Sharma Kirana Store
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky text-blue border border-line">
                <Sparkles className="w-3 h-3 mr-1" />
                Vyom AI
              </span>
            </div>
            <p className="text-xs text-charcoal flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Pune, MH · Soundbox Active
            </p>
          </div>
        </div>

        {/* Right: Date badge, Language picker & Demo controls */}
        <div className="flex items-center gap-2">
          {/* Demo Date Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cloud border border-line text-xs font-medium text-charcoal">
            <Calendar className="w-3.5 h-3.5 text-blue" />
            <span>30 Sep 2026 (Demo IST)</span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line hover:bg-cloud text-xs font-semibold text-obsidian transition-colors shadow-button"
              aria-label="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue" />
              <span className="uppercase">{lang}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-paper rounded-2xl shadow-elevated border border-soft-line py-1 z-50 animate-in fade-in duration-150">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-cloud transition-colors ${
                      lang === l.code ? "text-blue font-bold bg-sky/30" : "text-obsidian"
                    }`}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <span className="w-1.5 h-1.5 rounded-full bg-blue"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Demo Controls Button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-semibold shadow-button transition-all"
            title="Open Interactive Demo Actions"
          >
            <Sliders className="w-3.5 h-3.5 text-festive-amber" />
            <span className="hidden sm:inline">Demo Lab</span>
          </button>
        </div>
      </div>
    </header>
  );
}
