import React, { useState } from 'react';
import {
  Smartphone,
  Camera,
  Mic,
  Download,
  Copy,
  Check,
  Zap,
  Globe,
  Share2,
} from './icons';

interface DesktopPwaAsideProps {
  onOpenKhataScan?: () => void;
  onOpenVoice?: () => void;
  onShowToast?: (msg: string) => void;
}

export const DesktopPwaAside: React.FC<DesktopPwaAsideProps> = ({
  onOpenKhataScan,
  onOpenVoice,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (onShowToast) {
        onShowToast('Phone link copied! Apne phone pe WhatsApp/Telegram se bhejein ✓');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <aside
      className="hidden xl:flex flex-col fixed z-30 animate-fade-slide-up"
      style={{
        left: 'calc(50% + 228px)',
        top: '24px',
        width: '360px',
        maxHeight: 'calc(100vh - 48px)',
        overflowY: 'auto',
      }}
      aria-label="PWA Information"
    >
      <div
        className="bg-surface rounded-2xl border-2 border-ink p-4 space-y-4 text-ink"
        style={{ boxShadow: '3px 3px 0px var(--shadow-color)' }}
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-ink/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue text-white flex items-center justify-center font-bold shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue bg-sky px-2 py-0.5 rounded-full">
                Progressive Web App (PWA)
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Mobile-First
          </span>
        </div>

        {/* Main Pitch */}
        <div>
          <h3 className="font-extrabold text-sm text-obsidian tracking-tight leading-snug">
            Made Specially for Smartphones & Kirana Counters
          </h3>
          <p className="text-[11px] text-charcoal mt-1 leading-relaxed">
            Vyom is designed as an installable <strong>Progressive Web App (PWA)</strong> for mobile screens.
            Dukaan counter par grahak ke samne 1-hand operation, camera photo se bahi-khata scan, aur bol kar baat karne ke liye banaya gaya hai.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-950">Mobile Camera Bahi-Khata OCR</div>
              <div className="text-[10px] text-amber-900/80 mt-0.5">
                Phone ke camera se register ki photo khinchein aur Devanagari/Hindi ledger seedha digitize karein.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-50/70 border border-purple-200/80">
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-950">Counter Voice AI Saathi</div>
              <div className="text-[10px] text-purple-900/80 mt-0.5">
                Bina typing ke Hindi, Hinglish ya Marathi mein bol kar bikri aur baki udhaar poochhein.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-950">Offline & Fast PWA Caching</div>
              <div className="text-[10px] text-emerald-900/80 mt-0.5">
                Bina App Store download kiye seedha browser se install karein, kharab network mein bhi kaam karta hai.
              </div>
            </div>
          </div>
        </div>

        {/* Installation Instructions for Phone */}
        <div className="p-2.5 rounded-xl border border-line bg-cloud/60 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-obsidian">
            <Globe className="w-3.5 h-3.5 text-blue" />
            <span>Phone par kaise chalayein?</span>
          </div>
          <ol className="text-[10px] text-charcoal space-y-1 pl-4 list-decimal">
            <li>Apne phone browser (Chrome ya Safari) mein yeh link kholein.</li>
            <li>Browser menu <strong>(⋮)</strong> ya Share button par click karein.</li>
            <li><strong>&quot;Add to Home Screen&quot;</strong> / <strong>&quot;Install App&quot;</strong> select karein.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2 px-3 rounded-xl border-2 border-ink bg-white hover:bg-cloud font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue" />
                <span>Phone ke liye Link Copy Karein</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            {onOpenKhataScan && (
              <button
                type="button"
                onClick={onOpenKhataScan}
                className="flex-1 py-1.5 px-2 rounded-xl bg-blue/10 hover:bg-blue/20 text-blue font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Test OCR Scan</span>
              </button>
            )}
            {onOpenVoice && (
              <button
                type="button"
                onClick={onOpenVoice}
                className="flex-1 py-1.5 px-2 rounded-xl bg-purple-100/80 hover:bg-purple-200 text-purple-900 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Mic className="w-3 h-3" />
                <span>Test Voice Bot</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
