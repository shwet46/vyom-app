"use client";

import React from "react";
import { useT } from "../lib/i18n";
import { Home, TrendingUp, Sparkles, BookOpen, Store } from "lucide-react";

export type TabKey = "home" | "grow" | "festivals" | "udhaar" | "shop";

interface BottomNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  pendingApprovalsCount?: number;
}

export function BottomNav({
  activeTab,
  onChangeTab,
  pendingApprovalsCount = 0,
}: BottomNavProps) {
  const { t } = useT();

  const tabs: { key: TabKey; labelKey: string; icon: React.ElementType; badge?: number }[] = [
    { key: "home", labelKey: "nav.home", icon: Home },
    { key: "grow", labelKey: "nav.grow", icon: TrendingUp, badge: pendingApprovalsCount },
    { key: "festivals", labelKey: "nav.festivals", icon: Sparkles },
    { key: "udhaar", labelKey: "nav.udhaar", icon: BookOpen },
    { key: "shop", labelKey: "nav.shop", icon: Store },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 glass-panel border-t border-soft-line pb-[env(safe-area-inset-bottom)] sm:pb-2">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "text-blue font-bold scale-105"
                  : "text-charcoal hover:text-obsidian font-medium"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-festive-vermilion text-paper text-[10px] font-bold flex items-center justify-center shadow-button animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-1 tracking-tight font-ui">
                {t(tab.labelKey)}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 rounded-full bg-blue" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
