"use client";

import React from "react";
import { useT, formatRupees } from "../../lib/i18n";
import {
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  Check,
  Eye,
  QrCode,
  Calendar,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

interface HomeTabProps {
  homeData: any;
  onSelectOpportunity: (opp: any) => void;
  onApproveOpportunity: (oppId: string) => void;
  onDismissOpportunity: (oppId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export function HomeTab({
  homeData,
  onSelectOpportunity,
  onApproveOpportunity,
  onDismissOpportunity,
  onNavigateTab,
}: HomeTabProps) {
  const { t } = useT();

  const recoveredPaise = homeData?.summary?.recovered_this_week_paise || 1845000;
  const opportunities = homeData?.top_opportunities || [];
  const festBanner = homeData?.festival_banner;
  const udhaarSummary = homeData?.udhaar_strip || {
    total_outstanding_paise: 3820000,
    overdue_count: 8,
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Impact Hero */}
      <div className="card-cloud rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-paper via-cloud to-sky/20 border border-soft-line">
        <div className="flex items-center justify-between pb-3 border-b border-soft-line">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal font-ui">
              {t("home.impact.title")}
            </span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky text-blue border border-line">
            Soundbox Sync
          </span>
        </div>

        <div className="pt-4 pb-2">
          <p className="text-xs font-medium text-charcoal">{t("home.impact.recovered")}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-obsidian tracking-tight tabular-nums">
              {formatRupees(recoveredPaise)}
            </h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +28% this cycle
            </span>
          </div>
        </div>

        {/* 3 Mini Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-soft-line">
          <div
            onClick={() => onNavigateTab("grow")}
            className="p-3 rounded-2xl bg-paper border border-soft-line hover:border-blue transition-colors cursor-pointer text-center"
          >
            <p className="text-[10px] text-charcoal font-semibold uppercase">{t("home.impact.growth_pipeline")}</p>
            <p className="font-display font-bold text-lg text-obsidian tabular-nums mt-0.5">
              {opportunities.length || 4}
            </p>
          </div>

          <div
            onClick={() => onNavigateTab("udhaar")}
            className="p-3 rounded-2xl bg-paper border border-soft-line hover:border-blue transition-colors cursor-pointer text-center"
          >
            <p className="text-[10px] text-charcoal font-semibold uppercase">{t("home.impact.active_udhaar")}</p>
            <p className="font-display font-bold text-lg text-error tabular-nums mt-0.5">
              {formatRupees(udhaarSummary.total_outstanding_paise)}
            </p>
          </div>

          <div
            onClick={() => onNavigateTab("festivals")}
            className="p-3 rounded-2xl bg-paper border border-soft-line hover:border-blue transition-colors cursor-pointer text-center"
          >
            <p className="text-[10px] text-charcoal font-semibold uppercase">{t("home.impact.fasting_orders")}</p>
            <p className="font-display font-bold text-lg text-festive-amber tabular-nums mt-0.5">
              7 Kits
            </p>
          </div>
        </div>
      </div>

      {/* 2. Festival Context Banner */}
      <div
        onClick={() => onNavigateTab("festivals")}
        className="rounded-3xl p-4 sm:p-5 bg-festive-cream/80 border border-festive-amber/30 cursor-pointer hover:border-festive-amber transition-all shadow-feature"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-festive-amber/20 text-festive-sacred border border-festive-amber/40">
                🙏 {festBanner?.active_label || "Pitru Paksha (Solemn Period)"}
              </span>
              <span className="text-[11px] text-charcoal font-medium">Day 4 of 14</span>
            </div>
            <h3 className="font-display font-bold text-base text-obsidian pt-1">
              Navratri starts in 11 days (11 Oct)
            </h3>
            <p className="text-xs text-charcoal leading-relaxed max-w-lg">
              Shraddha samagri convenience messaging active. Fasting (vrat) pantry stock advisor ready.
            </p>
          </div>
          <div className="shrink-0 p-2.5 rounded-2xl bg-paper border border-line shadow-button text-festive-amber">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Top Actionable Opportunities Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-obsidian flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue" />
            {t("home.approvals.title")}
          </h3>
          <button
            onClick={() => onNavigateTab("grow")}
            className="text-xs font-semibold text-blue hover:underline"
          >
            {t("common.view_all")} ({opportunities.length || 3})
          </button>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-6 rounded-3xl bg-cloud border border-soft-line text-center text-xs text-charcoal">
            {t("home.approvals.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {opportunities.slice(0, 3).map((opp: any) => {
              const netPaise = Math.max(0, (opp.est_return_paise || 0) - (opp.est_cost_paise || 0));
              return (
                <div
                  key={opp.id || opp._id}
                  className="rounded-3xl p-4 bg-paper border border-soft-line shadow-feature hover:shadow-elevated transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky text-blue border border-line">
                        {opp.type?.replace("_", " ") || "Opportunity"}
                      </span>
                      <span className="text-xs font-bold text-obsidian tabular-nums">
                        {formatRupees(netPaise)} net
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-obsidian line-clamp-1">
                      {opp.evidence?.reason || "Win-back lapsed customer visits"}
                    </h4>
                    <p className="text-xs text-charcoal line-clamp-2 leading-relaxed">
                      {opp.audience_customer_ids?.length || 12} customers eligible. Projected 82% confidence.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-soft-line flex items-center gap-2">
                    <button
                      onClick={() => onSelectOpportunity(opp)}
                      className="flex-1 py-1.5 px-2 rounded-xl border border-line hover:bg-cloud text-xs font-semibold text-obsidian flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-charcoal" />
                      <span>{t("home.approvals.preview_btn")}</span>
                    </button>
                    <button
                      onClick={() => onApproveOpportunity(opp.id || opp._id)}
                      className="py-1.5 px-3 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Autonomous Udhaar Sweep Banner */}
      <div
        onClick={() => onNavigateTab("udhaar")}
        className="rounded-3xl p-4 bg-cloud border border-soft-line flex items-center justify-between gap-4 cursor-pointer hover:bg-cloud/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-paper border border-line flex items-center justify-center text-error shadow-button">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-obsidian">
              {t("home.udhaar_strip.title")}
            </h4>
            <p className="text-xs text-charcoal">
              {udhaarSummary.overdue_count || 8} overdue entries. Polite tier reminders active.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-display font-bold text-base text-error tabular-nums">
            {formatRupees(udhaarSummary.total_outstanding_paise)}
          </span>
          <p className="text-[10px] text-charcoal font-semibold uppercase">Pending</p>
        </div>
      </div>

      {/* 5. Customer Telegram Invite Banner */}
      <div className="rounded-3xl p-5 bg-gradient-to-r from-obsidian to-ink text-paper shadow-elevated flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-festive-amber/20 text-festive-amber border border-festive-amber/30">
            Digital Kirana Shop
          </span>
          <h4 className="font-display font-bold text-base sm:text-lg text-paper">
            {t("home.invite.title")}
          </h4>
          <p className="text-xs text-slate max-w-md leading-relaxed">
            Customers can pre-order Navratri kits, check udhaar balance, and receive instant digital bills.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-paper text-obsidian shadow-button flex items-center justify-center">
            <QrCode className="w-7 h-7" />
          </div>
          <a
            href="https://t.me/vyom_shop_bot?start=SHARMA01"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button"
          >
            Open Bot Link
          </a>
        </div>
      </div>
    </div>
  );
}
