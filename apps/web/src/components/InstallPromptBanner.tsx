import React, { useState } from 'react';
import { Download, X, Sparkles, Smartphone, CheckCircle2, Share } from './icons';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallPromptBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || dismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <div className="fixed top-16 left-3 right-3 sm:top-auto sm:bottom-5 sm:left-68 lg:sm:left-72 sm:right-auto sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-obsidian text-white rounded-2xl p-3.5 sm:p-4 shadow-feature border border-line flex items-center justify-between gap-3 relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue/30 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-blue flex items-center justify-center text-white font-google font-black text-xl flex-shrink-0 shadow-button">
              V
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-google font-black text-sm text-white tracking-tight">
                  Vyom App Install Karein
                </span>
                <span className="text-[10px] font-bold bg-sky/20 text-sky px-1.5 py-0.2 rounded-full uppercase">
                  PWA Ready
                </span>
              </div>
              <p className="text-[11px] text-slate line-clamp-1 mt-0.5">
                1-Tap Soundbox sync • Offline hisaab & voice assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="py-2 px-3 rounded-xl bg-blue hover:bg-[#1a85b9] text-white text-xs font-google font-extrabold flex items-center gap-1 shadow-button transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate hover:text-white transition cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-paper text-obsidian rounded-3xl p-6 max-w-sm w-full border border-line shadow-feature space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue" />
                <h3 className="font-google font-black text-base">iPhone Par Install Karein</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-cloud flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal leading-relaxed">
              Safari browser mein Vyom ko homescreen par add karein taaki full screen app ki tarah chale:
            </p>

            <div className="space-y-3 bg-cloud/70 p-3.5 rounded-2xl text-xs text-ink font-medium">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Neeche <strong>Share</strong> button par tap karein (<Share className="w-3.5 h-3.5 inline text-blue" />)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>List scroll karke <strong>Add to Home Screen</strong> chunein</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Upar daayein kone mein <strong>Add</strong> dabayein</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue text-white text-xs font-google font-bold shadow-button cursor-pointer"
            >
              Samajh Gaya ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
};
