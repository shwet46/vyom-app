"use client";

import React, { useState } from "react";
import { useT, formatRupees } from "../../lib/i18n";
import { generateFestivalOpportunities } from "../../lib/api";
import {
  Sparkles,
  Calendar,
  Package,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Flame,
} from "lucide-react";

interface FestivalsTabProps {
  festivalContext: any;
  onNavigateTab: (tab: any) => void;
}

export function FestivalsTab({ festivalContext, onNavigateTab }: FestivalsTabProps) {
  const { t } = useT();
  const [selectedFestival, setSelectedFestival] = useState<string>("navratri");
  const [generating, setGenerating] = useState(false);

  const festivals = [
    {
      key: "pitru_paksha",
      name: "Pitru Paksha",
      dates: "27 Sep – 10 Oct 2026",
      phase: "ACTIVE (Solemn)",
      tone: "solemn",
      desc: "Shraddha essentials: til, jau, ghee, rice. Excluded from promotion: onion, garlic, non-veg.",
      color: "bg-festive-cream border-festive-amber/40 text-festive-sacred",
    },
    {
      key: "navratri",
      name: "Sharad Navratri",
      dates: "11 Oct – 19 Oct 2026",
      phase: "PREP (11 days left)",
      tone: "observant",
      desc: "Vrat fasting staples: sabudana, rajgira, sendha namak, makhana, ghee. Ghatasthapana puja items.",
      color: "bg-sky/30 border-blue/30 text-blue",
    },
    {
      key: "dussehra",
      name: "Dussehra / Vijayadashami",
      dates: "20 Oct 2026",
      phase: "UPCOMING (20 days)",
      tone: "festive",
      desc: "Apta leaves, marigold garlands, sweets (shrikhand, jalebi), tool worship.",
      color: "bg-cloud border-line text-obsidian",
    },
    {
      key: "diwali",
      name: "Diwali Cluster",
      dates: "5 Nov – 11 Nov 2026",
      phase: "UPCOMING (39 days)",
      tone: "festive",
      desc: "Faral/sweets ingredients: rava, besan, poha, ghee, oil, dry fruits, diyas, lights.",
      color: "bg-cloud border-line text-obsidian",
    },
  ];

  const stockItems = [
    { name: "Sabudana 500g", role: "Vrat Staple", uplift: "+240%", current: 18, suggested: 65, status: "Low Stock" },
    { name: "Rajgira Atta 500g", role: "Vrat Flour", uplift: "+180%", current: 8, suggested: 40, status: "Reorder" },
    { name: "Sendha Namak 1kg", role: "Fasting Salt", uplift: "+150%", current: 12, suggested: 35, status: "Low Stock" },
    { name: "Pure Cow Ghee 1L", role: "Puja & Cooking", uplift: "+95%", current: 14, suggested: 28, status: "Adequate" },
    { name: "Makhana 250g", role: "Vrat Snack", uplift: "+210%", current: 6, suggested: 30, status: "Reorder" },
  ];

  const handleGenerateKits = async () => {
    setGenerating(true);
    try {
      await generateFestivalOpportunities(selectedFestival);
      onNavigateTab("grow");
    } catch {
      onNavigateTab("grow");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-paper via-cloud to-sky/20 border border-soft-line shadow-feature space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-festive-amber"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
            {t("festivals.title")}
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-obsidian tracking-tight">
          Pune Regional Festival Engine
        </h2>
        <p className="text-xs text-charcoal max-w-xl leading-relaxed">
          Deterministic dates verified with Drik Panchang. Culture tone guidelines enforced automatically in all customer messaging.
        </p>
      </div>

      {/* 2. Timeline Cards */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-sm text-obsidian uppercase tracking-wider text-charcoal">
          {t("festivals.upcoming")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {festivals.map((fest) => {
            const isSelected = selectedFestival === fest.key;
            return (
              <div
                key={fest.key}
                onClick={() => setSelectedFestival(fest.key)}
                className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-paper ring-2 ring-blue border-transparent shadow-elevated"
                    : "bg-paper hover:bg-cloud/60 border-soft-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${fest.color}`}>
                    {fest.phase}
                  </span>
                  <span className="text-xs text-charcoal font-medium">{fest.dates}</span>
                </div>
                <h4 className="font-display font-bold text-base text-obsidian mt-2">{fest.name}</h4>
                <p className="text-xs text-charcoal mt-1 line-clamp-2 leading-relaxed">{fest.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Stock Advisor for Navratri */}
      <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-soft-line">
          <div>
            <h3 className="font-display font-bold text-base text-obsidian flex items-center gap-2">
              <Package className="w-5 h-5 text-blue" />
              {t("festivals.stock_advisor")} · Navratri Vrat
            </h3>
            <p className="text-xs text-charcoal mt-0.5">
              Based on last year&apos;s Pune sales velocity blended with regional priors.
            </p>
          </div>
          <button
            onClick={handleGenerateKits}
            disabled={generating}
            className="py-2 px-3.5 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center gap-1.5 self-start"
          >
            <Sparkles className="w-3.5 h-3.5 text-festive-amber" />
            <span>{generating ? "Generating..." : "Generate Vrat Kits"}</span>
          </button>
        </div>

        {/* Stock Advice Table */}
        <div className="border border-soft-line rounded-2xl overflow-hidden divide-y divide-soft-line">
          {stockItems.map((item, idx) => (
            <div key={idx} className="p-3 bg-paper flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-obsidian">{item.name}</span>
                <span className="text-[11px] text-charcoal block">{item.role}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {item.uplift}
                </span>

                <div className="text-right">
                  <span className="font-bold text-obsidian tabular-nums">
                    {item.current} in stock
                  </span>
                  <span className="text-[10px] text-charcoal block">
                    Target: {item.suggested}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === "Reorder"
                      ? "bg-red-100 text-red-800"
                      : item.status === "Low Stock"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
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
        <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
          <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Cultural DO&apos;s (Vyom Enforced)
          </span>
          <ul className="text-xs text-charcoal space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Highlight fasting (vrat) staples together as convenient pantry packs.</li>
            <li>Offer Ghatasthapana puja kits (kalash items, kumkum, akshat, supari).</li>
            <li>Use respectful, warm wording (&quot;aam taur par&quot;, &quot;vrat samagri&quot;).</li>
          </ul>
        </div>

        <div className="p-4 rounded-3xl bg-red-50/60 border border-red-200/60 space-y-2">
          <span className="text-xs font-bold text-red-800 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Cultural DON&apos;Ts (Code-Banned)
          </span>
          <ul className="text-xs text-charcoal space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Never promote onion/garlic, egg, or non-veg during Navratri or Pitru Paksha.</li>
            <li>No aggressive &quot;Mega Sale&quot; or &quot;Dhamaka&quot; copy in solemn Pitru Paksha.</li>
            <li>Never infer customer caste or religion from their names.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
