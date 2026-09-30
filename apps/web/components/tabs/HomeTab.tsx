"use client";

import React, { useState } from "react";
import { useVyomStore } from "../../lib/store";
import { useT, formatRupees } from "../../lib/i18n";
import { CountUp } from "../CountUp";
import { Confetti } from "../Confetti";
import {
  Mic,
  TrendingUp,
  Users,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { initialSparklineSales } from "../../lib/mockData";

export function HomeTab() {
  const {
    recoveredPaise,
    deltaPercentage,
    stats,
    opportunities,
    approveOpportunity,
    rejectOpportunity,
    setSelectedOpportunity,
    setVoiceOpen,
    setActiveTab,
  } = useVyomStore();

  const { t } = useT();
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  const handleQuickApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfettiTrigger(true);
    setTimeout(() => {
      approveOpportunity(id);
    }, 300);
  };

  const handleQuickDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    rejectOpportunity(id);
  };

  return (
    <div className="space-y-6 pb-24">
      <Confetti trigger={confettiTrigger} />

      {/* 1. Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-obsidian tracking-tight">
            {t("home.greeting")}
          </h2>
          <p className="text-xs sm:text-sm text-charcoal font-medium">
            {t("home.question")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky/40 text-blue border border-line">
            <span className="w-2 h-2 rounded-full bg-blue mr-1.5 animate-pulse" />
            Pune Store Live
          </span>
        </div>
      </div>

      {/* 2. Hero Recovery Card */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-paper via-cloud to-sky/25 border border-soft-line shadow-feature space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-soft-line">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
              {t("home.hero.title")}
            </span>
          </div>

          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {t("home.hero.delta")}
          </span>
        </div>

        {/* Big Animated Count-Up Number */}
        <div className="pt-1 pb-1">
          <div className="font-display font-extrabold text-3xl sm:text-5xl text-obsidian tracking-tight">
            <CountUp end={Math.round(recoveredPaise / 100)} durationMs={1400} />
          </div>
          <p className="text-xs text-charcoal mt-1">
            Silent leakage recovered across lapsed customers & credit ledger
          </p>
        </div>

        {/* 3 Mini Stats */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-soft-line">
          <div
            onClick={() => setActiveTab("campaigns")}
            className="p-3 rounded-2xl bg-paper border border-soft-line hover:border-blue transition-colors cursor-pointer text-center"
          >
            <p className="text-[10px] text-charcoal font-semibold uppercase">
              {t("home.stat.customers_won")}
            </p>
            <p className="font-display font-bold text-base sm:text-lg text-obsidian mt-0.5 tabular-nums">
              {stats.customersWonBack}
            </p>
          </div>

          <div
            onClick={() => setActiveTab("udhaar")}
            className="p-3 rounded-2xl bg-paper border border-soft-line hover:border-blue transition-colors cursor-pointer text-center"
          >
            <p className="text-[10px] text-charcoal font-semibold uppercase">
              {t("home.stat.udhaar_collected")}
            </p>
            <p className="font-display font-bold text-base sm:text-lg text-emerald-600 mt-0.5 tabular-nums">
              {formatRupees(stats.udhaarCollected)}
            </p>
          </div>

          <div
            onClick={() => setActiveTab("campaigns")}
            className="p-3 rounded-2xl bg-paper border border-soft-line hover:border-blue transition-colors cursor-pointer text-center"
          >
            <p className="text-[10px] text-charcoal font-semibold uppercase">
              {t("home.stat.campaign_spend")}
            </p>
            <p className="font-display font-bold text-base sm:text-lg text-charcoal mt-0.5 tabular-nums">
              {formatRupees(stats.campaignSpend)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Central Prominent Voice Orb */}
      <div className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature flex flex-col items-center justify-center text-center space-y-3">
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Pulsing Rings */}
          <div className="absolute w-28 h-28 rounded-full bg-sky/50 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full bg-sky animate-pulse" />

          {/* Voice Mic Orb Button */}
          <button
            onClick={() => setVoiceOpen(true)}
            className="relative z-10 w-16 h-16 rounded-full bg-blue text-paper hover:bg-blue/90 hover:scale-105 transition-all shadow-elevated flex items-center justify-center active:scale-95"
            aria-label="Open Voice Assistant"
          >
            <Mic className="w-7 h-7 stroke-[2.2px]" />
          </button>
        </div>

        <div>
          <h3 className="font-display font-bold text-sm sm:text-base text-obsidian">
            {t("home.voice.prompt")}
          </h3>
          <p className="text-xs text-charcoal mt-0.5">
            {t("home.voice.tap")}
          </p>
        </div>
      </div>

      {/* 4. "Vyom ne kuch dhoonda hai" (Opportunities Carousel / Swipeable List) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue" />
            <h3 className="font-display font-bold text-base text-obsidian">
              {t("home.opps.title")}
            </h3>
          </div>

          <button
            onClick={() => setActiveTab("mauke")}
            className="text-xs font-bold text-blue hover:underline flex items-center gap-1"
          >
            <span>Sabhi Dekhein</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-8 rounded-3xl bg-cloud border border-soft-line text-center space-y-2">
            <Sparkles className="w-8 h-8 text-blue mx-auto" />
            <p className="font-bold text-sm text-obsidian">
              {t("home.opps.empty")}
            </p>
            <p className="text-xs text-charcoal">
              Vyom is actively analyzing tonight&apos;s transactions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => setSelectedOpportunity(opp)}
                className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature hover:shadow-elevated transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky text-blue border border-line">
                      {opp.type.replace("_", " ")}
                    </span>
                    <span className="font-display font-extrabold text-base text-blue tabular-nums">
                      est. {formatRupees(opp.estReturn)}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-sm sm:text-base text-obsidian group-hover:text-blue transition-colors">
                    {opp.title}
                  </h4>

                  <p className="text-xs text-charcoal leading-relaxed line-clamp-2">
                    {opp.summary}
                  </p>
                </div>

                {/* Card Action Buttons (Haan ✓ / Baad Mein) */}
                <div className="pt-2 border-t border-soft-line flex items-center gap-2">
                  <button
                    onClick={(e) => handleQuickDismiss(opp.id, e)}
                    className="flex-1 py-2 px-3 rounded-xl border border-line text-xs font-semibold text-charcoal hover:bg-cloud transition-colors"
                  >
                    {t("home.btn.later")}
                  </button>

                  <button
                    onClick={(e) => handleQuickApprove(opp.id, e)}
                    className="flex-1 py-2 px-4 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>{t("home.btn.yes")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Udhaar Auto-Pilot Strip */}
      <div
        onClick={() => setActiveTab("udhaar")}
        className="rounded-3xl p-4 sm:p-5 bg-cloud border border-soft-line flex items-center justify-between gap-4 cursor-pointer hover:bg-cloud/80 transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-paper border border-line flex items-center justify-center text-blue shadow-button shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-xs sm:text-sm text-obsidian">
                {t("home.udhaar.strip")}
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {t("home.udhaar.badge")}
            </span>
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-charcoal shrink-0" />
      </div>

      {/* 6. Today's Sales Mini Sparkline vs. Yesterday */}
      <div className="rounded-3xl p-5 bg-paper border border-soft-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-charcoal font-semibold uppercase block">
              {t("home.sales.today")} vs {t("home.sales.yesterday")}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-display font-extrabold text-xl text-obsidian tabular-nums">
                ₹7,420
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {t("home.sales.compare")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue" />
              <span className="text-obsidian font-semibold">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate" />
              <span className="text-charcoal font-medium">Yesterday</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-36 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={initialSparklineSales}>
              <defs>
                <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2597d0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2597d0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#60606c" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                formatter={(val: any) => [`₹${val}`, ""]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid rgba(7,7,9,0.12)",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              />
              <Area
                type="monotone"
                dataKey="yesterday"
                stroke="#8b8b8b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fill="none"
              />
              <Area
                type="monotone"
                dataKey="today"
                stroke="#2597d0"
                strokeWidth={2.5}
                fill="url(#todayGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
