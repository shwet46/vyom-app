"use client";

import React, { useState } from "react";
import { useVyomStore } from "../lib/store";
import { useT, Language } from "../lib/i18n";
import {
  Globe,
  Bell,
  Sparkles,
  Sliders,
  RotateCcw,
  HelpCircle,
  CreditCard,
  ChevronDown,
  Check,
} from "lucide-react";

interface HeaderProps {
  onOpenDemoLab: () => void;
}

export function Header({ onOpenDemoLab }: HeaderProps) {
  const {
    restartOnboarding,
    resetAllDemoData,
    activityFeed,
    setVoiceOpen,
  } = useVyomStore();
  const { lang, setLang, t } = useT();

  const [langOpen, setLangOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: "hinglish", label: "Hinglish" },
    { code: "mr", label: "मराठी" },
    { code: "hi", label: "हिन्दी" },
    { code: "en", label: "English" },
  ];

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-soft-line px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand / Shop Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-obsidian flex items-center justify-center text-paper font-display font-extrabold text-lg shadow-button">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-sm sm:text-base text-obsidian tracking-tight">
                Sharma Kirana Store
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky text-blue border border-line">
                <Sparkles className="w-3 h-3 mr-1" />
                Vyom AI
              </span>
            </div>
            <p className="text-[11px] text-charcoal flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pune, MH · Soundbox Active</span>
            </p>
          </div>
        </div>

        {/* Right: Controls (Language Switcher, Bell, Demo Menu) */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setLangOpen(!langOpen);
                setBellOpen(false);
                setQuickMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-paper hover:bg-cloud text-xs font-bold text-obsidian shadow-button transition-colors"
              aria-label="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue" />
              <span className="capitalize">{lang}</span>
              <ChevronDown className="w-3 h-3 text-charcoal" />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-paper rounded-2xl shadow-elevated border border-soft-line py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-charcoal border-b border-soft-line mb-1">
                  Bhasha Chunein
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-cloud transition-colors ${
                      lang === l.code ? "text-blue bg-sky/30 font-bold" : "text-obsidian"
                    }`}
                  >
                    <span>{l.label}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-blue" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setBellOpen(!bellOpen);
                setLangOpen(false);
                setQuickMenuOpen(false);
              }}
              className="relative p-2 rounded-xl border border-line bg-paper hover:bg-cloud text-charcoal hover:text-obsidian shadow-button transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue" />
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-paper rounded-2xl shadow-elevated border border-soft-line py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-1.5 flex items-center justify-between border-b border-soft-line">
                  <span className="text-xs font-bold text-obsidian">Vyom Activity & Alerts</span>
                  <span className="text-[10px] font-bold text-blue bg-sky px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-soft-line p-1">
                  {activityFeed.slice(0, 5).map((act) => (
                    <div key={act.id} className="p-2.5 hover:bg-cloud/50 rounded-xl transition-colors text-xs space-y-0.5">
                      <p className="text-obsidian font-medium leading-tight">{act.text}</p>
                      <span className="text-[10px] text-slate">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Demo Controls / Lab Button */}
          <div className="relative">
            <button
              onClick={() => {
                setQuickMenuOpen(!quickMenuOpen);
                setLangOpen(false);
                setBellOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button transition-all"
              title="Demo Actions & Controls"
            >
              <Sliders className="w-3.5 h-3.5 text-sky" />
              <span className="hidden sm:inline">Demo Lab</span>
            </button>

            {quickMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-paper rounded-2xl shadow-elevated border border-soft-line py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-charcoal border-b border-soft-line mb-1">
                  Interactive Demo Options
                </div>

                <button
                  onClick={() => {
                    restartOnboarding();
                    setQuickMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-obsidian hover:bg-cloud font-medium flex items-center gap-2"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue" />
                  <span>Restart Onboarding Tour</span>
                </button>

                <button
                  onClick={() => {
                    onOpenDemoLab();
                    setQuickMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-obsidian hover:bg-cloud font-medium flex items-center gap-2"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Simulate Events & Payments</span>
                </button>

                <button
                  onClick={() => {
                    resetAllDemoData();
                    setQuickMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-error hover:bg-red-50 font-medium flex items-center gap-2 border-t border-soft-line mt-1 pt-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Mock Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
