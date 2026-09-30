"use client";

import React from "react";
import { useVyomStore, TabKey } from "../lib/store";
import { useT } from "../lib/i18n";
import {
  Home,
  Sparkles,
  TrendingUp,
  BookOpen,
  MoreHorizontal,
  Mic,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function DesktopSidebar() {
  const {
    activeTab,
    setActiveTab,
    opportunities,
    setVoiceOpen,
    guardrails,
  } = useVyomStore();
  const { t } = useT();

  const navItems: { key: TabKey; labelKey: string; icon: React.ElementType; badge?: number }[] = [
    { key: "aaj", labelKey: "nav.aaj", icon: Home },
    { key: "mauke", labelKey: "nav.mauke", icon: Sparkles, badge: opportunities.length },
    { key: "campaigns", labelKey: "nav.campaigns", icon: TrendingUp },
    { key: "udhaar", labelKey: "nav.udhaar", icon: BookOpen },
    { key: "aur", labelKey: "nav.aur", icon: MoreHorizontal },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-soft-line bg-paper min-h-[calc(100vh-65px)] sticky top-[65px] p-4 justify-between">
      {/* Top Nav Items */}
      <div className="space-y-4">
        {/* Navigation Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all min-h-[48px] ${
                  isActive
                    ? "bg-sky/50 text-blue border border-line shadow-sm"
                    : "text-charcoal hover:bg-cloud hover:text-obsidian"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "stroke-[2.5px] text-blue" : "stroke-[1.8px]"
                    }`}
                  />
                  <span>{t(item.labelKey)}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue text-paper text-[10px] font-bold shadow-button">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Quick Voice Assistant Trigger Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-sky/30 to-cloud border border-line shadow-feature space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-obsidian">
              Voice Assistant
            </span>
          </div>

          <p className="text-xs text-charcoal leading-relaxed">
            Bolke poochho — &quot;aaj dhanda kaisa hai?&quot;
          </p>

          <button
            onClick={() => setVoiceOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Sahayak Kholein</span>
          </button>
        </div>
      </div>

      {/* Bottom Guardrail Active Summary */}
      <div className="p-3.5 rounded-2xl bg-cloud border border-soft-line text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Guardrails Active</span>
        </div>
        <p className="text-[11px] text-charcoal leading-tight">
          Max ₹{guardrails.weeklyBudget}/wk · Max {guardrails.maxDiscountPct}% discount
        </p>
      </div>
    </aside>
  );
}
