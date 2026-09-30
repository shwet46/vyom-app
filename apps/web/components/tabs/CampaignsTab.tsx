"use client";

import React, { useState } from "react";
import { useVyomStore } from "../../lib/store";
import { useT, formatRupees } from "../../lib/i18n";
import {
  TrendingUp,
  Brain,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

export function CampaignsTab() {
  const {
    campaigns,
    memoryChips,
    forgetMemory,
    stats,
  } = useVyomStore();
  const { t } = useT();

  const [activeSegment, setActiveSegment] = useState<"Running" | "Completed">("Running");
  const [expandedCampaignId, setExpandedCampaignId] = useState<string>("camp_comp_02");

  const monthlyImpactData = [
    { week: "Week 1", revenue: 6400 },
    { week: "Week 2", revenue: 7800 },
    { week: "Week 3", revenue: 8620 },
    { week: "Week 4", revenue: 9640 },
  ];

  const filteredCampaigns = campaigns.filter((c) => c.status === activeSegment);

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Top Summary: "Total Impact This Month" Card */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-paper via-cloud to-sky/25 border border-soft-line shadow-feature space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue" />
              {t("campaigns.impact.title")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display font-extrabold text-3xl sm:text-4xl text-obsidian tabular-nums">
                ₹32,460
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                10% Holdout Verified
              </span>
            </div>
          </div>

          <span className="hidden sm:inline-block text-xs font-bold text-blue bg-sky px-3 py-1 rounded-full border border-line">
            Pure Incremental Lift
          </span>
        </div>

        {/* Compact Weekly Bar Chart */}
        <div className="pt-2">
          <p className="text-[11px] text-charcoal font-semibold mb-1">
            Weekly Recovery Trend (₹)
          </p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyImpactData}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#60606c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString("en-IN")}`, "Recovered"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid rgba(7,7,9,0.12)",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
                <Bar dataKey="revenue" fill="#2597d0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. "Vyom ne seekha" (AI Memory) Card */}
      <div className="rounded-3xl p-5 bg-paper border border-soft-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-obsidian flex items-center gap-2">
            <Brain className="w-4 h-4 text-festive-amber" />
            <span>{t("campaigns.memory.title")}</span>
          </h3>
          <span className="text-[11px] text-charcoal">
            {memoryChips.length} active rules
          </span>
        </div>

        <p className="text-xs text-charcoal leading-relaxed">
          Vyom continuously learns which message timings and combos generate maximum profit for your shop.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {memoryChips.map((chip, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cloud border border-line text-xs font-semibold text-obsidian shadow-sm hover:border-blue transition-colors"
            >
              <span>{chip}</span>
              <button
                onClick={() => forgetMemory(chip)}
                className="w-4 h-4 rounded-full hover:bg-red-100 hover:text-error flex items-center justify-center text-charcoal ml-0.5"
                title="Forget this rule"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Running / Completed Segmented Tabs */}
      <div className="space-y-4">
        <div className="flex p-1.5 rounded-2xl bg-cloud border border-soft-line">
          <button
            onClick={() => setActiveSegment("Running")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeSegment === "Running"
                ? "bg-paper text-obsidian shadow-button"
                : "text-charcoal hover:text-obsidian"
            }`}
          >
            {t("campaigns.tab.running")} (
            {campaigns.filter((c) => c.status === "Running").length})
          </button>

          <button
            onClick={() => setActiveSegment("Completed")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              activeSegment === "Completed"
                ? "bg-paper text-obsidian shadow-button"
                : "text-charcoal hover:text-obsidian"
            }`}
          >
            {t("campaigns.tab.completed")} (
            {campaigns.filter((c) => c.status === "Completed").length})
          </button>
        </div>

        {/* Campaign Cards List */}
        {filteredCampaigns.length === 0 ? (
          <div className="p-8 rounded-3xl bg-cloud border border-soft-line text-center text-xs text-charcoal space-y-1">
            <p className="font-bold text-obsidian">No {activeSegment.toLowerCase()} campaigns</p>
            <p>Approve an opportunity from Mauke tab to launch a new campaign.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((camp) => {
              const isExpanded = expandedCampaignId === camp.id;
              return (
                <div
                  key={camp.id}
                  className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            camp.status === "Running"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-sky text-blue"
                          }`}
                        >
                          {camp.status}
                        </span>
                        <span className="text-xs text-charcoal font-medium">
                          {camp.timeline}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base sm:text-lg text-obsidian mt-1.5">
                        {camp.name}
                      </h3>
                    </div>

                    {camp.status === "Completed" && (
                      <button
                        onClick={() =>
                          setExpandedCampaignId(isExpanded ? "" : camp.id)
                        }
                        className="p-2 rounded-xl border border-line hover:bg-cloud text-charcoal text-xs font-semibold flex items-center gap-1"
                      >
                        <span>{isExpanded ? "Hide Chart" : "View Chart"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Progress Funnel (Sent -> Delivered -> Replied -> Visited/Redeemed) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-charcoal tracking-wider">
                      Progress Funnel
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-2.5 rounded-2xl bg-cloud border border-soft-line">
                        <span className="text-[10px] text-charcoal block">Sent</span>
                        <span className="font-display font-bold text-xs sm:text-sm text-obsidian tabular-nums">
                          {camp.funnel.sent}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-cloud border border-soft-line">
                        <span className="text-[10px] text-charcoal block">Delivered</span>
                        <span className="font-display font-bold text-xs sm:text-sm text-obsidian tabular-nums">
                          {camp.funnel.delivered}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-cloud border border-soft-line">
                        <span className="text-[10px] text-charcoal block">Replied</span>
                        <span className="font-display font-bold text-xs sm:text-sm text-blue tabular-nums">
                          {camp.funnel.replied}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-sky/30 border border-line">
                        <span className="text-[10px] text-blue block font-bold">Redeemed</span>
                        <span className="font-display font-bold text-xs sm:text-sm text-blue tabular-nums">
                          {camp.funnel.redeemed}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ₹ Outcome Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-cloud/50 border border-soft-line text-xs">
                    <div>
                      <span className="text-[10px] text-charcoal uppercase block">
                        {t("campaigns.outcome.revenue")}
                      </span>
                      <span className="font-display font-bold text-sm sm:text-base text-emerald-600 tabular-nums">
                        {formatRupees(camp.outcome.revenue)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-charcoal uppercase block">
                        {t("campaigns.outcome.recovered")}
                      </span>
                      <span className="font-display font-bold text-sm sm:text-base text-obsidian tabular-nums">
                        {camp.outcome.recoveredCustomers} Grahak
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-charcoal uppercase block">
                        {t("campaigns.outcome.cost")}
                      </span>
                      <span className="font-display font-bold text-sm sm:text-base text-charcoal tabular-nums">
                        {formatRupees(camp.outcome.cost)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-charcoal uppercase block">
                        {t("campaigns.outcome.roi")}
                      </span>
                      <span className="font-display font-bold text-sm sm:text-base text-blue tabular-nums">
                        {camp.outcome.roi}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Recharts Revenue Chart for Completed Campaign */}
                  {isExpanded && camp.chartData && (
                    <div className="pt-2 space-y-2 border-t border-soft-line animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-obsidian block">
                        Campaign Revenue Duration Chart
                      </span>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={camp.chartData}>
                            <defs>
                              <linearGradient id={`campGrad_${camp.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2597d0" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2597d0" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="day"
                              tick={{ fontSize: 10, fill: "#60606c" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis hide />
                            <Tooltip
                              formatter={(val: any) => [`₹${val}`, "Revenue"]}
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
                              dataKey="revenue"
                              stroke="#2597d0"
                              strokeWidth={2}
                              fill={`url(#campGrad_${camp.id})`}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
