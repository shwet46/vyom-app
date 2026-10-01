import React, { useState } from 'react';
import { Bell, Download, Check, Sparkles, Store, ShieldCheck } from './icons';
import { Language } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onOpenOnboarding: () => void;
  onOpenDemo?: () => void;
  isOnline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentLang,
  onLanguageChange,
  onOpenNotifications,
  unreadCount,
  onOpenOnboarding,
  onOpenDemo,
  isOnline = true,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const langNames: { id: Language; label: string; native: string }[] = [
    { id: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
    { id: 'hindi', label: 'Hindi', native: 'हिन्दी' },
    { id: 'marathi', label: 'Marathi', native: 'मराठी' },
    { id: 'english', label: 'English', native: 'English' },
  ];

  const currentLangLabel = langNames.find((l) => l.id === currentLang)?.native || 'Hinglish';

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-md border-b border-soft-line px-3.5 sm:px-6 h-[57px] flex items-center transition-all">
      <div className="w-full max-w-[1480px] mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand & Shop Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-blue flex items-center justify-center text-white font-google font-black shadow-button flex-shrink-0 tracking-tight text-lg">
            V
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-google font-black text-obsidian text-base tracking-tight">VYOM</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-google font-bold uppercase tracking-wider bg-sky text-blue px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> AI Saathi
              </span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Paytm Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Offline Mode
                </span>
              )}
            </div>
            <button
              onClick={onOpenOnboarding}
              className="text-left text-xs text-charcoal hover:text-blue flex items-center gap-1 truncate transition-colors"
              title="View / re-configure shop details"
            >
              <Store className="w-3 h-3 flex-shrink-0 text-slate" />
              <span className="font-bold text-ink truncate font-google">Sharma Kirana</span>
              <span className="text-[11px] text-slate hidden xs:inline">• Pune</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Demo Lab, Language Selector, Install PWA, Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Demo Lab Simulation Button */}
          {onOpenDemo && (
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-cloud border border-line text-obsidian hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
              title="Open Interactive Demo Lab"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue" />
              <span className="hidden sm:inline">Demo Lab</span>
            </button>
          )}

          {/* PWA Install Button if available */}
          {(isInstallable || isIOS) && (
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-sky text-blue hover:bg-sky/80 transition-colors shadow-button cursor-pointer"
              title="Install Vyom on your phone"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">App Install</span>
            </button>
          )}

          {/* Persistent Language Switcher Chip */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cloud border border-line text-xs font-semibold text-ink hover:bg-slate-100 transition shadow-sm cursor-pointer"
              aria-label="Change Language"
            >
              <span className="text-blue font-bold">🌐</span>
              <span className="font-semibold">{currentLangLabel}</span>
              <span className="text-[10px] text-slate">▾</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl border border-line shadow-feature py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate uppercase tracking-wider">
                    Select Language
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
                          ? 'bg-sky/50 text-blue font-semibold'
                          : 'text-ink hover:bg-cloud'
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
            className="relative w-9 h-9 rounded-full bg-cloud border border-soft-line flex items-center justify-center text-charcoal hover:text-ink hover:bg-slate-100 transition shadow-button cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* iOS Install Guidance Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-feature border border-line animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-sky flex items-center justify-center text-blue mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-obsidian">iPhone par Vyom install karein</h3>
            <p className="mt-2 text-xs text-charcoal leading-relaxed">
              1. Safari browser ke neeche <strong>Share (तीर वाला आइकन)</strong> dabayein.<br />
              2. Neeche scroll karke <strong>Add to Home Screen</strong> select karein.<br />
              3. Vyom aapke phone par bina internet ke bhi tez chalega.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-blue py-2.5 text-xs font-bold text-white shadow-button hover:bg-blue/90"
            >
              Samajh Gaya (Close)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
