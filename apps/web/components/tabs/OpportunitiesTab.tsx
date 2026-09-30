"use client";

import React, { useState } from "react";
import { useVyomStore } from "../../lib/store";
import { useT, formatRupees } from "../../lib/i18n";
import { Opportunity } from "../../lib/mockData";
import { Confetti } from "../Confetti";
import {
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  Check,
  Eye,
  Trash2,
  ShieldCheck,
  Filter,
} from "lucide-react";

export function OpportunitiesTab() {
  const {
    opportunities,
    setSelectedOpportunity,
    approveOpportunity,
    rejectOpportunity,
  } = useVyomStore();
  const { t } = useT();

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  const filters = [
    { key: "all", labelKey: "opps.filter.all" },
    { key: "winback", labelKey: "opps.filter.winback" },
    { key: "dead_hours", labelKey: "opps.filter.dead_hours" },
    { key: "festival", labelKey: "opps.filter.festival" },
    { key: "falling_sales", labelKey: "opps.filter.falling_sales" },
  ];

  const filteredOpps = opportunities.filter((opp) => {
    if (activeFilter === "all") return true;
    return opp.type === activeFilter;
  });

  const handleQuickApprove = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfettiTrigger(true);
    setTimeout(() => {
      approveOpportunity(opp.id);
    }, 300);
  };

  const handleQuickReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    rejectOpportunity(id);
  };

  return (
    <div className="space-y-5 pb-24">
      <Confetti trigger={confettiTrigger} />

      {/* Header & Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-obsidian tracking-tight">
              {t("opps.title")}
            </h2>
            <p className="text-xs text-charcoal">
              Vyom detected these high-return opportunities for your shop.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky text-blue">
            {opportunities.length} Available
          </span>
        </div>

        {/* Filter Chips Carousel */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all min-h-[38px] ${
                activeFilter === f.key
                  ? "bg-obsidian text-paper shadow-button"
                  : "bg-cloud text-charcoal hover:text-obsidian border border-line"
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      {filteredOpps.length === 0 ? (
        <div className="p-10 rounded-3xl bg-cloud border border-soft-line text-center space-y-3">
          <Sparkles className="w-10 h-10 text-blue mx-auto" />
          <h3 className="font-display font-bold text-base text-obsidian">
            No pending opportunities in this category
          </h3>
          <p className="text-xs text-charcoal max-w-sm mx-auto">
            Vyom continuously evaluates Paytm transaction velocity and festival dates to find new money recovery moments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpps.map((opp) => (
            <div
              key={opp.id}
              onClick={() => setSelectedOpportunity(opp)}
              className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature hover:shadow-elevated transition-all space-y-4 cursor-pointer"
            >
              {/* Top Row: Type tag & Return */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky text-blue border border-line">
                      {opp.type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-medium text-charcoal">
                      Confidence: {Math.round(opp.confidence * 100)}%
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-obsidian tracking-tight pt-0.5">
                    {opp.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-charcoal font-semibold uppercase block">
                    {t("opps.potential")}
                  </span>
                  <span className="font-display font-extrabold text-lg sm:text-xl text-blue tabular-nums">
                    {formatRupees(opp.estReturn)}
                  </span>
                </div>
              </div>

              {/* Summary Description */}
              <p className="text-xs text-charcoal leading-relaxed">
                {opp.summary}
              </p>

              {/* Mini Details Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-cloud/70 text-xs border border-soft-line">
                <div>
                  <span className="text-[10px] text-charcoal uppercase block font-semibold">
                    Audience
                  </span>
                  <span className="font-bold text-obsidian">
                    {opp.audienceCount} Grahak
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-charcoal uppercase block font-semibold">
                    Est. Cost
                  </span>
                  <span className="font-bold text-obsidian">
                    {formatRupees(opp.estCost)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-charcoal uppercase block font-semibold">
                    Expected ROI
                  </span>
                  <span className="font-bold text-emerald-600">
                    {opp.expectedROI}
                  </span>
                </div>
              </div>

              {/* Guardrails Checked Badge */}
              <div className="flex items-center gap-2 text-[11px] text-charcoal">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Guardrails checked: within budget, discount & frequency limits</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-soft-line flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOpportunity(opp);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-line hover:bg-cloud text-xs font-semibold text-obsidian flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                >
                  <Eye className="w-3.5 h-3.5 text-charcoal" />
                  <span>Preview & Rationale</span>
                </button>

                <button
                  onClick={(e) => handleQuickReject(opp.id, e)}
                  className="py-2 px-3 rounded-xl border border-line text-xs font-semibold text-charcoal hover:text-error hover:bg-red-50 transition-colors min-h-[44px]"
                  title="Dismiss Opportunity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleQuickApprove(opp, e)}
                  className="py-2 px-5 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button flex items-center gap-1.5 transition-transform active:scale-95 min-h-[44px]"
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>{t("opps.modal.approve")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
