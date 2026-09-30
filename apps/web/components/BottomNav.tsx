"use client";

import React from "react";
import { useVyomStore, TabKey } from "../lib/store";
import { useT } from "../lib/i18n";
import { Home, Sparkles, TrendingUp, BookOpen, MoreHorizontal } from "lucide-react";

export function BottomNav() {
  const { activeTab, setActiveTab, opportunities } = useVyomStore();
  const { t } = useT();

  const navItems: { key: TabKey; labelKey: string; icon: React.ElementType; badge?: number }[] = [
    { key: "aaj", labelKey: "nav.aaj", icon: Home },
    { key: "mauke", labelKey: "nav.mauke", icon: Sparkles, badge: opportunities.length },
    { key: "campaigns", labelKey: "nav.campaigns", icon: TrendingUp },
    { key: "udhaar", labelKey: "nav.udhaar", icon: BookOpen },
    { key: "aur", labelKey: "nav.aur", icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden glass-panel border-t border-soft-line pb-[env(safe-area-inset-bottom)] sm:pb-1 shadow-elevated">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 min-h-[48px] ${
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
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-blue text-paper text-[10px] font-bold flex items-center justify-center shadow-button animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              <span className="text-[11px] mt-1 tracking-tight">
                {t(item.labelKey)}
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
