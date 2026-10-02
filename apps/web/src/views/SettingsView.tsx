import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Sliders,
  Smartphone,
  Check,
  RefreshCw,
  Bell,
  Globe,
  ArrowRight,
  Download,
  Info,
} from '../components/icons';
import { Guardrails, Language, MemoryItem } from '../types';
import { formatRupee } from '../utils/formatters';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsViewProps {
  guardrails: Guardrails;
  onUpdateGuardrails: (newLimits: Guardrails) => Promise<boolean>;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  memories: MemoryItem[];
  onResetDemoData: () => void;
  onReplayOnboarding: () => void;
  onOpenDemoLab?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  guardrails,
  onUpdateGuardrails,
  lang,
  onLanguageChange,
  memories,
  onResetDemoData,
  onReplayOnboarding,
  onOpenDemoLab,
}) => {
  const [limits, setLimits] = useState<Guardrails>(guardrails);
  const [savedToast, setSavedToast] = useState(false);
  const { isInstallable, install, isIOS } = usePWAInstall();

  useEffect(() => {
    setLimits(guardrails);
  }, [guardrails]);

  const handleSave = async () => {
    const saved = await onUpdateGuardrails(limits);
    if (!saved) return;

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky/40 to-cloud border border-line/70 shadow-feature">
        <div className="flex items-center gap-2 text-[11px] font-bold text-blue uppercase tracking-wider font-google">
          <ShieldCheck className="w-4 h-4" />
          Meri Limits & Guardrails
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-obsidian tracking-tight mt-0.5 font-google">
          Dukaan Ke Suraksha Niyam
        </h1>
        <p className="text-xs text-charcoal mt-1 leading-relaxed font-sans">
          "Vyom in limits ke bahar kuch nahi karega. Har offer se pehle aapki 'haan' zaroori hai."
        </p>
      </div>

      {/* Main Limits Config Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-4">
        {/* Weekly Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-obsidian block">
                Max Campaign Budget (Per Week)
              </span>
              <span className="text-[11px] text-charcoal">
                WhatsApp marketing aur discounts par ek hafte ka maximum kharch
              </span>
            </div>
            <span className="text-sm font-black text-blue">{formatRupee(limits.maxWeeklyBudget)}</span>
          </div>

          <input
            type="range"
            min={500}
            max={5000}
            step={250}
            value={limits.maxWeeklyBudget}
            onChange={(e) => setLimits({ ...limits, maxWeeklyBudget: Number(e.target.value) })}
            className="w-full accent-blue cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate font-medium">
            <span>₹500 (Basic)</span>
            <span>₹1,500 (Recommended)</span>
            <span>₹5,000 (Aggressive)</span>
          </div>
        </div>

        {/* Max Discount % Slider */}
        <div className="space-y-2 pt-3 border-t border-soft-line">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-obsidian block">
                Max Discount % Allowed
              </span>
              <span className="text-[11px] text-charcoal">
                Kisi bhi customer ko isse zyada discount Vyom propose nahi karega
              </span>
            </div>
            <span className="text-sm font-black text-blue">{limits.maxDiscountPercent}%</span>
          </div>

          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={limits.maxDiscountPercent}
            onChange={(e) => setLimits({ ...limits, maxDiscountPercent: Number(e.target.value) })}
            className="w-full accent-blue cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate font-medium">
            <span>0% (No discount)</span>
            <span>15% (Healthy margin)</span>
            <span>30% (Max)</span>
          </div>
        </div>

        {/* Messages Frequency Slider */}
        <div className="space-y-2 pt-3 border-t border-soft-line">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-obsidian block">
                Spam Control (Max Messages Per Customer)
              </span>
              <span className="text-[11px] text-charcoal">
                Ek grahak ko ek hafte mein kitne messages bhejein
              </span>
            </div>
            <span className="text-xs font-black text-ink bg-cloud px-2 py-1 rounded-lg">
              {limits.maxMessagesPerCustomerPerWeek} msg / week
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={limits.maxMessagesPerCustomerPerWeek}
            onChange={(e) =>
              setLimits({ ...limits, maxMessagesPerCustomerPerWeek: Number(e.target.value) })
            }
            className="w-full accent-blue cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate font-medium">
            <span>1 (Polite & Safe)</span>
            <span>3</span>
            <span>5 (Frequent)</span>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-2 pt-3 border-t border-soft-line">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-obsidian block">Quiet Hours (Shanti Samay)</span>
              <span className="text-[11px] text-charcoal">
                Is dauran grahako ko koi notification ya reminder nahi jayega
              </span>
            </div>
            <span className="text-xs font-bold text-ink">9:00 PM – 9:00 AM</span>
          </div>
        </div>

        {/* Save Limits Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-blue text-white font-extrabold text-xs shadow-button hover:bg-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Suraksha Niyam Update Karein</span>
          </button>
          {savedToast && (
            <div className="text-xs font-bold text-emerald-700 text-center mt-2 animate-in fade-in">
              Suraksha Niyam Safalta-purvak Save Hue! ✓
            </div>
          )}
        </div>
      </div>

      {/* Connected Paytm Account Info */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue" />
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
              Connected Paytm Merchant Account
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-google">
            Active Sync
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-cloud border border-soft-line space-y-2 text-xs">
          <div className="flex justify-between text-charcoal">
            <span>Merchant Name:</span>
            <span className="font-bold text-ink">Sharma Kirana Store (Pune)</span>
          </div>
          <div className="flex justify-between text-charcoal">
            <span>Merchant ID:</span>
            <span className="font-mono text-ink">982344192088</span>
          </div>
          <div className="flex justify-between text-charcoal">
            <span>Settlement Account:</span>
            <span className="text-ink">HDFC Bank A/c ending 4402</span>
          </div>
          <div className="flex justify-between text-charcoal">
            <span>Soundbox Audio Sync:</span>
            <span className="text-emerald-700 font-semibold">Enabled (Hindi/Marathi)</span>
          </div>
        </div>
      </div>

      {/* Language Preferences */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue" />
          <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
            App Ki Bhasha (Language)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'hinglish' as Language, label: 'Hinglish (Recommended)' },
            { id: 'hindi' as Language, label: 'हिन्दी (Hindi)' },
            { id: 'marathi' as Language, label: 'मराठी (Marathi)' },
            { id: 'english' as Language, label: 'English' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onLanguageChange(item.id)}
              className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer font-google ${
                lang === item.id
                  ? 'bg-sky/60 border-blue text-blue'
                  : 'bg-cloud border-line/70 text-charcoal hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* App & Demo Controls */}
     

      <div className="text-center text-xs text-slate space-y-1">
        <div>VYOM AI • Version 2.4.0 (PWA Offline Ready)</div>
        <div>Fintech intelligence designed for Indian Kirana merchants</div>
      </div>
    </div>
  );
};
