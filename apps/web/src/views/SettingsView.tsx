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
import { SupportedCity } from '../data/cityFestivals';

interface SettingsViewProps {
  guardrails: Guardrails;
  onUpdateGuardrails: (newLimits: Guardrails) => Promise<boolean>;
  lang: Language;
  city: SupportedCity;
  onCityChange: (city: SupportedCity) => void;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  guardrails,
  onUpdateGuardrails,
  lang,
  city,
  onCityChange,
  onLanguageChange,
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
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* 1. Header Banner — Comic Sky Card */}
      <div className="comic-card-sky" style={{ padding: 14 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#1565C0' }} />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1565C0' }}>
            Meri Limits & Guardrails
          </span>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2 }}>
          Dukaan Ke Suraksha Niyam
        </h1>
        <p style={{ fontSize: 12, color: '#1565C0', marginTop: 4, lineHeight: 1.4, fontWeight: 500 }}>
          "Vyom in limits ke bahar kuch nahi karega. Har offer se pehle aapki 'haan' zaroori hai."
        </p>
      </div>

      {/* 2. City Selector — Comic Card */}
      <div className="comic-card" style={{ padding: 14 }}>
        <label htmlFor="city-select" style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', display: 'block', marginBottom: 2 }}>
          Dukaan Ka Shehar
        </label>
        <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>
          Festival Radar aur local signals ke liye apna city chunein.
        </p>
        <select
          id="city-select"
          value={city}
          onChange={(event) => onCityChange(event.target.value as SupportedCity)}
          className="w-full"
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--outline)',
            background: 'var(--canvas)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--ink)',
            boxShadow: '1px 1px 0px var(--shadow-color)',
            outline: 'none',
          }}
        >
          <option value="Pune">Pune (Maharashtra)</option>
          <option value="Delhi">Delhi (NCR)</option>
          <option value="Mumbai">Mumbai (Maharashtra)</option>
          <option value="Bengaluru">Bengaluru (Karnataka)</option>
        </select>
      </div>

      {/* 3. Main Limits Config Card */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 12 }}>
          Campaign & Offer Limits
        </div>

        {/* Weekly Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
                Max Campaign Budget (Per Week)
              </span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>
                WhatsApp marketing par ek hafte ka max kharch
              </span>
            </div>
            <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ai-text)' }}>
              {formatRupee(limits.maxWeeklyBudget)}
            </span>
          </div>

          <input
            type="range"
            min={500}
            max={5000}
            step={250}
            value={limits.maxWeeklyBudget}
            onChange={(e) => setLimits({ ...limits, maxWeeklyBudget: Number(e.target.value) })}
            className="w-full cursor-pointer"
            style={{ accentColor: 'var(--shadow-color)' }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
            <span>₹500 (Basic)</span>
            <span>₹1,500 (Best)</span>
            <span>₹5,000 (Max)</span>
          </div>
        </div>

        {/* Max Discount % Slider */}
        <div className="space-y-2 pt-3" style={{ borderTop: '1.5px solid rgba(148,163,184,0.28)', marginTop: 12 }}>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
                Max Discount % Allowed
              </span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>
                Kisi bhi grahak ko isse zyada discount nahi milega
              </span>
            </div>
            <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 800, color: 'var(--ai-text)' }}>
              {limits.maxDiscountPercent}%
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={limits.maxDiscountPercent}
            onChange={(e) => setLimits({ ...limits, maxDiscountPercent: Number(e.target.value) })}
            className="w-full cursor-pointer"
            style={{ accentColor: 'var(--shadow-color)' }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
            <span>0%</span>
            <span>15% (Healthy)</span>
            <span>30%</span>
          </div>
        </div>

        {/* Messages Frequency Slider */}
        <div className="space-y-2 pt-3" style={{ borderTop: '1.5px solid rgba(148,163,184,0.28)', marginTop: 12 }}>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
                Spam Control (Max Messages)
              </span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>
                Ek grahak ko ek hafte mein kitne messages
              </span>
            </div>
            <span
              className="comic-badge tabular-nums"
              style={{ background: 'var(--canvas)', color: 'var(--ink)', fontSize: 11 }}
            >
              {limits.maxMessagesPerCustomerPerWeek} msg / wk
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
            className="w-full cursor-pointer"
            style={{ accentColor: 'var(--shadow-color)' }}
          />
          <div className="flex justify-between" style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
            <span>1 (Safe)</span>
            <span>3</span>
            <span>5 (Max)</span>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="pt-3" style={{ borderTop: '1.5px solid rgba(148,163,184,0.28)', marginTop: 12 }}>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block' }}>
                Quiet Hours (Shanti Samay)
              </span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>
                Is dauran koi notification nahi bheja jayega
              </span>
            </div>
            <span
              className="comic-badge"
              style={{ background: 'var(--canvas)', color: 'var(--ink)', fontSize: 10 }}
            >
              9 PM – 9 AM
            </span>
          </div>
        </div>

        {/* Save Limits Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            className="comic-btn w-full"
          >
            <Check className="w-4 h-4" />
            <span>Suraksha Niyam Update Karein</span>
          </button>
          {savedToast && (
            <div
              className="comic-card-mint text-center mt-2"
              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#0E7A50', borderRadius: 8 }}
            >
              Suraksha Niyam Safalta-purvak Save Hue! ✓
            </div>
          )}
        </div>
      </div>

      {/* 4. Connected Paytm Account Info — Comic Card */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
              Connected Paytm Account
            </h3>
          </div>
          <span className="comic-badge" style={{ background: '#BEF0D8', color: '#0E7A50', fontSize: 9 }}>
            ● Active Sync
          </span>
        </div>

        <div
          style={{
            padding: 10,
            background: 'var(--canvas)',
            border: '1.5px solid var(--shadow-color)',
            borderRadius: 12,
            fontSize: 12,
          }}
          className="space-y-2"
        >
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Merchant:</span>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Sharma Kirana Store ({city})</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Merchant ID:</span>
            <span className="font-mono tabular-nums" style={{ fontWeight: 600, color: 'var(--ink)' }}>982344192088</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Settlement:</span>
            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>HDFC Bank ending 4402</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#6B7280' }}>Soundbox Sync:</span>
            <span style={{ fontWeight: 700, color: '#0E7A50' }}>Enabled (Hindi/Marathi)</span>
          </div>
        </div>
      </div>

      {/* 5. Language Preferences */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <Globe className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
            App Ki Bhasha (Language)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'hinglish' as Language, label: 'Hinglish (Recommended)' },
            { id: 'hindi' as Language, label: 'हिन्दी (Hindi)' },
            { id: 'marathi' as Language, label: 'मराठी (Marathi)' },
            { id: 'english' as Language, label: 'English' },
          ].map((item) => {
            const isSelected = lang === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onLanguageChange(item.id)}
                className="text-left cursor-pointer"
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--outline)',
                  background: isSelected ? 'var(--shadow-color)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--shadow-color)',
                  boxShadow: isSelected ? '2px 2px 0px var(--shadow-color)' : '2px 2px 0px var(--shadow-color)',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'all 0.1s ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center" style={{ fontSize: 11, color: '#6B7280', paddingTop: 8, paddingBottom: 16 }}>
        <div>VYOM AI • Version 2.4.0 (PWA Offline Ready)</div>
        <div>Fintech intelligence designed for Indian Kirana merchants</div>
      </div>
    </div>
  );
};
