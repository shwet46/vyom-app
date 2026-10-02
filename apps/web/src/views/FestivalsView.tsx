import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Check,
  Store,
} from '../components/icons';
import { Language } from '../types';
import { translations } from '../utils/i18n';
import { formatRupee } from '../utils/formatters';
import { getFestivalContext, FestivalContextResponse } from '../services/api';
import { cityFestivalProfiles, SupportedCity } from '../data/cityFestivals';

interface FestivalsViewProps {
  lang: Language;
  city: SupportedCity;
  onNavigateToTab: (tab: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'festivals' | 'more') => void;
  onApproveVratKit?: () => void;
}

export const FestivalsView: React.FC<FestivalsViewProps> = ({
  lang,
  city,
  onNavigateToTab,
  onApproveVratKit,
}) => {
  const cityProfile = cityFestivalProfiles[city];
  const [selectedFestival, setSelectedFestival] = useState(cityProfile.festivals[0]?.key || '');
  const [generatingKit, setGeneratingKit] = useState(false);
  const [kitGenerated, setKitGenerated] = useState(false);
  const [festivalData, setFestivalData] = useState<FestivalContextResponse | null>(null);

  useEffect(() => {
    getFestivalContext()
      .then((data) => setFestivalData(data))
      .catch(() => {});
  }, []);

  const festivals = cityProfile.festivals;
  const stockItems = cityProfile.stockItems;

  const handleCreateVratKit = () => {
    setGeneratingKit(true);
    setTimeout(() => {
      setGeneratingKit(false);
      setKitGenerated(true);
      if (onApproveVratKit) onApproveVratKit();
    }, 1200);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-sky/30 to-cloud border border-line/70 shadow-feature space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] font-google font-extrabold uppercase tracking-wider text-charcoal">
            Cultural Intelligence Engine
          </span>
        </div>
        <h1 className="font-google font-black text-xl sm:text-2xl text-obsidian tracking-tight">
          {cityProfile.radarTitle}
        </h1>
        <p className="text-xs text-charcoal max-w-xl leading-relaxed font-sans">
          Drik Panchang verified calendar. Vyom auto-adjusts customer messages with respectful regional tone and stock advisor.
        </p>
      </div>

      {/* 2. Festival Timeline Cards */}
      <div className="space-y-2.5">
        <h2 className="font-google font-black text-xs text-obsidian uppercase tracking-wider">
          {cityProfile.timelineTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {festivals.map((fest) => {
            const isSelected = selectedFestival === fest.key;
            return (
              <div
                key={fest.key}
                onClick={() => setSelectedFestival(fest.key)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white ring-2 ring-blue border-transparent shadow-feature'
                    : 'bg-white hover:bg-cloud border-line/70 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-google font-extrabold uppercase ${fest.color}`}>
                    {fest.phase}
                  </span>
                  <span className="text-xs text-slate font-medium">{fest.dates}</span>
                </div>
                <h3 className="font-google font-black text-base text-obsidian mt-2">{fest.name}</h3>
                <p className="text-xs text-charcoal mt-1 line-clamp-2 leading-relaxed font-sans">{fest.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Stock Advisor for Navratri */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-soft-line">
          <div>
            <h3 className="font-google font-black text-base text-obsidian flex items-center gap-2">
              <Package className="w-5 h-5 text-blue" />
              {cityProfile.stockAdvisorTitle}
            </h3>
            <p className="text-xs text-charcoal mt-0.5 font-sans">
              {cityProfile.stockAdvisorSubtitle}
            </p>
          </div>

          <button
            onClick={handleCreateVratKit}
            disabled={generatingKit || kitGenerated}
            className={`py-2 px-3.5 rounded-xl text-xs font-google font-extrabold shadow-button flex items-center gap-1.5 self-start cursor-pointer transition ${
              kitGenerated
                ? 'bg-emerald-600 text-white'
                : 'bg-blue hover:bg-[#1a85b9] text-white'
            }`}
          >
            {kitGenerated ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Vrat Kit Ready ✓</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generatingKit ? 'Tayyar kar rahe hain...' : 'Generate 9-Day Vrat Kit'}</span>
              </>
            )}
          </button>
        </div>

        {/* Stock Advice Table */}
        <div className="border border-soft-line rounded-2xl overflow-hidden divide-y divide-soft-line">
          {stockItems.map((item, idx) => (
            <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-obsidian">{item.name}</span>
                <span className="text-[11px] text-charcoal block">{item.role}</span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {item.uplift}
                </span>

                <div className="text-right">
                  <span className="font-bold text-obsidian tabular-nums">
                    {item.current} in stock
                  </span>
                  <span className="text-[10px] text-slate block">
                    Target: {item.suggested}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'Reorder'
                      ? 'bg-red-100 text-red-800'
                      : item.status === 'Low Stock'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Cultural Do's & Don'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
          <span className="text-xs font-google font-extrabold text-emerald-900 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Cultural DO's (Vyom Enforced)
          </span>
          <ul className="text-xs text-charcoal space-y-1.5 list-disc pl-4 leading-relaxed font-sans">
            <li>Highlight fasting (vrat) staples together as convenient pantry bundles.</li>
            <li>Offer Ghatasthapana puja kits (kalash items, kumkum, akshat, supari).</li>
            <li>Use respectful, warm wording ("Vrat Samagri", "Upvas Special").</li>
          </ul>
        </div>

        <div className="p-4 rounded-3xl bg-red-50/70 border border-red-200/80 space-y-2">
          <span className="text-xs font-google font-extrabold text-red-900 uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Cultural DON'Ts (Code-Banned)
          </span>
          <ul className="text-xs text-charcoal space-y-1.5 list-disc pl-4 leading-relaxed font-sans">
            <li>Never promote onion/garlic, egg, or non-veg during Navratri or Pitru Paksha.</li>
            <li>No aggressive "Mega Dhamaka" discount noise during solemn periods.</li>
            <li>Never infer customer caste or religion from their names.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
