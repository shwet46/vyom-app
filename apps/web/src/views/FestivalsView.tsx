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
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* 1. Header Banner — Comic peach card */}
      <div className="comic-card-peach" style={{ padding: 14 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#B5610E',
              display: 'inline-block',
            }}
            className="animate-pulse-gentle"
          />
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#B5610E' }}>
            Cultural Intelligence Engine
          </span>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2 }}>
          {cityProfile.radarTitle}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4, lineHeight: 1.4 }}>
          Drik Panchang verified calendar. Vyom auto-adjusts customer messages with respectful regional tone and stock advisor.
        </p>
      </div>

      {/* 2. Festival Timeline Cards — Single column phone layout */}
      <div className="space-y-2">
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {cityProfile.timelineTitle}
        </div>
        <div className="space-y-2.5">
          {festivals.map((fest) => {
            const isSelected = selectedFestival === fest.key;
            return (
              <div
                key={fest.key}
                onClick={() => setSelectedFestival(fest.key)}
                className={isSelected ? 'comic-card' : 'comic-card'}
                style={{
                  padding: 12,
                  background: isSelected ? 'var(--canvas)' : '#FFFFFF',
                  borderColor: isSelected ? 'var(--ai-text)' : 'var(--shadow-color)',
                  boxShadow: isSelected ? '4px 4px 0px var(--ai-text)' : '4px 4px 0px var(--shadow-color)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <span
                    className="comic-badge"
                    style={{
                      background: fest.phase === 'UPCOMING' ? '#FFE4B8' : 'var(--canvas)',
                      color: fest.phase === 'UPCOMING' ? '#B5610E' : '#6B7280',
                    }}
                  >
                    {fest.phase}
                  </span>
                  <span className="tabular-nums" style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
                    {fest.dates}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3 }}>
                  {fest.name}
                </h3>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.4 }}>
                  {fest.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Fasting & Puja Stock Kits Advice */}
  

      {/* 4. Cultural Do's & Don'ts — Comic semantic cards stacked */}
      <div className="space-y-3">
        {/* DO's: Mint card */}
        <div className="comic-card-mint" style={{ padding: 14 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: '#0E7A50' }} />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0E7A50' }}>
              Cultural DO's (Vyom Enforced)
            </span>
          </div>
          <ul className="space-y-1.5 pl-4 list-disc" style={{ fontSize: 12, color: '#0E7A50', lineHeight: 1.4 }}>
            <li>Highlight fasting (vrat) staples together as convenient pantry bundles.</li>
            <li>Offer Ghatasthapana puja kits (kalash items, kumkum, akshat, supari).</li>
            <li>Use respectful, warm wording ("Vrat Samagri", "Upvas Special").</li>
          </ul>
        </div>

        {/* DON'Ts: Coral card */}
        <div className="comic-card-coral" style={{ padding: 14 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#C62828' }} />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#C62828' }}>
              Cultural DON'Ts (Code-Banned)
            </span>
          </div>
          <ul className="space-y-1.5 pl-4 list-disc" style={{ fontSize: 12, color: '#C62828', lineHeight: 1.4 }}>
            <li>Never promote onion/garlic, egg, or non-veg during Navratri or Pitru Paksha.</li>
            <li>No aggressive "Mega Dhamaka" discount noise during solemn periods.</li>
            <li>Never infer customer caste or religion from their names.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
