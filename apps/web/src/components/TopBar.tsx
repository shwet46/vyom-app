import React, { useState } from 'react';
import { Bell, Download, Check, Sparkles, Store, ShieldCheck } from './icons';
import { Language } from '../types';
import { SupportedCity } from '../data/cityFestivals';

interface TopBarProps {
  currentLang: Language;
  city: SupportedCity;
  onLanguageChange: (lang: Language) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onOpenOnboarding: () => void;
  isOnline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentLang,
  city,
  onLanguageChange,
  onOpenNotifications,
  unreadCount,
  onOpenOnboarding,
  isOnline = true,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const langNames: { id: Language; label: string; native: string }[] = [
    { id: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
    { id: 'hindi', label: 'Hindi', native: 'हिन्दी' },
    { id: 'marathi', label: 'Marathi', native: 'मराठी' },
    { id: 'english', label: 'English', native: 'English' },
  ];

  const currentLangLabel = langNames.find((l) => l.id === currentLang)?.native || 'Hinglish';

  return (
    <header className="sticky top-0 z-30 bg-paper/80 backdrop-blur-xl border-b border-soft-line px-3 sm:px-6 h-14 flex items-center transition-all">
      <div className="w-full max-w-[1480px] mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-white font-heading font-bold shadow-button flex-shrink-0 text-sm">
            V
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-obsidian text-sm tracking-tight">VYOM</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider bg-lavender/50 text-blue px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> AI Saathi
              </span>
            </div>
            <button
              onClick={onOpenOnboarding}
              className="text-left text-[11px] text-charcoal hover:text-blue flex items-center gap-1 truncate transition-colors"
              title="View / re-configure shop details"
            >
              <span className="font-semibold text-ink truncate font-heading">Sharma Kirana</span>
              <span className="text-[10px] text-slate hidden xs:inline">• {city}</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenOnboarding}
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-cloud/80 border border-line text-obsidian hover:bg-lavender/30 transition-colors cursor-pointer"
            title="Open business profile"
          >
            <Store className="w-3.5 h-3.5 text-blue" />
            <span>Profile</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-cloud/80 border border-line text-[11px] font-semibold text-ink hover:bg-lavender/30 transition cursor-pointer"
              aria-label="Change Language"
            >
              <span className="text-blue font-bold">🌐</span>
              <span className="font-semibold hidden sm:inline">{currentLangLabel}</span>
              <span className="text-[10px] text-slate">▾</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-40 bg-white/95 backdrop-blur-xl rounded-2xl border border-line shadow-feature py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate uppercase tracking-wider">
                    Language
                  </div>
                  {langNames.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        onLanguageChange(l.id);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition cursor-pointer ${
                        currentLang === l.id
                          ? 'bg-lavender/40 text-blue font-semibold'
                          : 'text-ink hover:bg-cloud/50'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-obsidian">{l.native}</span>
                        <span className="text-[10px] text-slate">{l.label}</span>
                      </div>
                      {currentLang === l.id && <Check className="w-3.5 h-3.5 text-blue" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded-xl bg-cloud/80 border border-line flex items-center justify-center text-charcoal hover:text-ink hover:bg-lavender/30 transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* iOS Install Guidance Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-feature border border-line animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-sky flex items-center justify-center text-blue mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-obsidian font-heading">iPhone par Vyom install karein</h3>
            <p className="mt-2 text-xs text-charcoal leading-relaxed">
              1. Safari browser ke neeche <strong>Share (तीर वाला आइकन)</strong> dabayein.<br />
              2. Neeche scroll karke <strong>Add to Home Screen</strong> select karein.<br />
              3. Vyom aapke phone par bina internet ke bhi tez chalega.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-blue py-2.5 text-xs font-bold text-white shadow-button hover:bg-blue-dark transition cursor-pointer"
            >
              Samajh Gaya (Close)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
