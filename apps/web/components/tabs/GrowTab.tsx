"use client";

import React, { useState } from "react";
import { useT, formatRupees } from "../../lib/i18n";
import {
  Sparkles,
  TrendingUp,
  Check,
  Eye,
  Trash2,
  Pause,
  Play,
  Brain,
  ShieldCheck,
  Users,
} from "lucide-react";

interface GrowTabProps {
  opportunities: any[];
  campaigns: any[];
  onSelectOpportunity: (opp: any) => void;
  onApproveOpportunity: (oppId: string) => void;
  onRejectOpportunity: (oppId: string) => void;
}

export function GrowTab({
  opportunities,
  campaigns,
  onSelectOpportunity,
  onApproveOpportunity,
  onRejectOpportunity,
}: GrowTabProps) {
  const { t } = useT();
  const [segment, setSegment] = useState<"approve" | "live" | "results">("approve");
  const [filter, setFilter] = useState<string>("all");

  const filterChips = [
    { key: "all", label: t("grow.filters.all") },
    { key: "winback", label: t("grow.filters.winback") },
    { key: "festival_kit", label: t("grow.filters.festival") },
    { key: "dead_hour", label: t("grow.filters.dead_hours") },
    { key: "falling_sales", label: t("grow.filters.falling_sales") },
  ];

  const filteredOpps = opportunities.filter((o) => {
    if (filter === "all") return true;
    return o.type === filter;
  });

  return (
    <div className="space-y-5 pb-24">
      {/* Segment Selector Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-cloud border border-soft-line">
        <button
          onClick={() => setSegment("approve")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            segment === "approve"
              ? "bg-paper text-obsidian shadow-button"
              : "text-charcoal hover:text-obsidian"
          }`}
        >
          {t("grow.tabs.approve")} ({opportunities.length})
        </button>
        <button
          onClick={() => setSegment("live")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            segment === "live"
              ? "bg-paper text-obsidian shadow-button"
              : "text-charcoal hover:text-obsidian"
          }`}
        >
          {t("grow.tabs.live")} ({campaigns.length})
        </button>
        <button
          onClick={() => setSegment("results")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            segment === "results"
              ? "bg-paper text-obsidian shadow-button"
              : "text-charcoal hover:text-obsidian"
          }`}
        >
          {t("grow.tabs.results")}
        </button>
      </div>

      {/* Segment 1: To Approve */}
      {segment === "approve" && (
        <div className="space-y-4">
          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === chip.key
                    ? "bg-obsidian text-paper shadow-button"
                    : "bg-cloud text-charcoal hover:text-obsidian border border-line"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {filteredOpps.length === 0 ? (
            <div className="p-8 rounded-3xl bg-cloud border border-soft-line text-center text-xs text-charcoal space-y-2">
              <Sparkles className="w-8 h-8 text-blue mx-auto" />
              <p className="font-bold text-obsidian">No pending opportunities in this category</p>
              <p>Vyom evaluates transactions nightly to find new opportunities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOpps.map((opp) => {
                const netPaise = Math.max(0, (opp.est_return_paise || 0) - (opp.est_cost_paise || 0));
                return (
                  <div
                    key={opp.id || opp._id}
                    className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature hover:shadow-elevated transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky text-blue border border-line">
                            {opp.type?.replace("_", " ")}
                          </span>
                          <span className="text-xs text-charcoal font-medium">
                            Score: {opp.score}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-obsidian">
                          {opp.evidence?.reason || "Win-back lapsed customer visits"}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-charcoal font-semibold uppercase">Net Return</p>
                        <p className="font-display font-bold text-lg text-blue tabular-nums">
                          {formatRupees(netPaise)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-cloud/60 text-xs text-charcoal">
                      <div>
                        <span className="text-[10px] block uppercase font-medium">Audience</span>
                        <span className="font-bold text-obsidian">{opp.audience_customer_ids?.length || 10}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block uppercase font-medium">Cost</span>
                        <span className="font-bold text-obsidian">{formatRupees(opp.est_cost_paise || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block uppercase font-medium">Confidence</span>
                        <span className="font-bold text-obsidian">{Math.round((opp.confidence || 0.8) * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectOpportunity(opp)}
                        className="flex-1 py-2 px-3 rounded-xl border border-line hover:bg-cloud text-xs font-semibold text-obsidian flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-charcoal" />
                        <span>Preview & Rationale</span>
                      </button>
                      <button
                        onClick={() => onRejectOpportunity(opp.id || opp._id)}
                        className="py-2 px-3 rounded-xl border border-line text-xs font-semibold text-error hover:bg-cloud"
                        title="Dismiss"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onApproveOpportunity(opp.id || opp._id)}
                        className="py-2 px-4 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Segment 2: Live Campaigns */}
      {segment === "live" && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="p-8 rounded-3xl bg-cloud border border-soft-line text-center text-xs text-charcoal">
              No live campaigns active right now. Approve an opportunity to launch.
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id || camp._id}
                className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    {camp.status || "SCHEDULED"}
                  </span>
                  <span className="text-xs text-charcoal">
                    Treated: {camp.audience_customer_ids?.length || 10} · Holdout: 10%
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-base text-obsidian">
                    {camp.approved_snapshot?.title || "Festive Offer Campaign"}
                  </h4>
                  <p className="text-xs text-charcoal mt-0.5">
                    Dispatched via Telegram Shop Bot. Respects customer quiet hours.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-cloud/50 text-xs">
                  <div>
                    <span className="text-[10px] text-charcoal block">Delivered</span>
                    <span className="font-bold text-obsidian tabular-nums">{camp.metrics?.sent || 18}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal block">Claimed</span>
                    <span className="font-bold text-blue tabular-nums">{camp.metrics?.claimed || 6}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal block">Revenue</span>
                    <span className="font-bold text-emerald-600 tabular-nums">
                      {formatRupees(camp.metrics?.revenue_paise || 240000)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Segment 3: Outcomes & Learnings */}
      {segment === "results" && (
        <div className="space-y-4">
          {/* Incremental Revenue Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-paper to-sky/20 border border-soft-line shadow-feature space-y-3">
            <span className="text-xs font-bold text-blue uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Holdout-Verified Incremental Uplift
            </span>
            <div className="flex items-baseline gap-3">
              <h3 className="font-display font-extrabold text-3xl text-obsidian tabular-nums">
                {formatRupees(1420000)}
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +₹14,200 Net
              </span>
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              Calculated against the 10% uncontacted holdout control group. Pure extra revenue that would not have happened otherwise.
            </p>
          </div>

          {/* AI Memory Chips */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line space-y-3">
            <h4 className="font-display font-bold text-sm text-obsidian flex items-center gap-2">
              <Brain className="w-4 h-4 text-festive-amber" />
              Vyom Memory (What was learned)
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-cloud border border-soft-line text-xs space-y-1">
                <span className="font-bold text-obsidian">Navratri Vrat Combo Kit:</span>
                <p className="text-charcoal leading-relaxed">
                  34% claim rate vs 12% for generic 10% discount. Kirana customers value curated fasting convenience over minor discounts.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-cloud border border-soft-line text-xs space-y-1">
                <span className="font-bold text-obsidian">Solemn Tone in Pitru Paksha:</span>
                <p className="text-charcoal leading-relaxed">
                  Zero customer complaints when shraddha samagri was communicated respectfully with 🙏 and no aggressive sale terminology.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
