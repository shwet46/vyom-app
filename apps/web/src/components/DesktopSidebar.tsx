import React from 'react';
import { Home, Lightbulb, Megaphone, BookOpen, BarChart3, Sliders, Shield, Zap, Sparkles } from './icons';
import { Language } from '../types';
import { translations } from '../utils/i18n';
import { TabKey } from './BottomNav';

interface DesktopSidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  lang: Language;
  opportunitiesCount: number;
  pendingUdhaarCount: number;
  onOpenVoice: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onSelectTab,
  lang,
  opportunitiesCount,
  pendingUdhaarCount,
  onOpenVoice,
}) => {
  const t = translations[lang] || translations.hinglish;

  const navItems: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: 'home',
      label: t.tabHome,
      icon: <Home className="w-5 h-5" />,
    },
    {
      key: 'opportunities',
      label: t.tabOpportunities,
      icon: <Lightbulb className="w-5 h-5" />,
      badge: opportunitiesCount,
    },
    {
      key: 'campaigns',
      label: t.tabCampaigns,
      icon: <Megaphone className="w-5 h-5" />,
    },
    {
      key: 'udhaar',
      label: t.tabUdhaar,
      icon: <BookOpen className="w-5 h-5" />,
      badge: pendingUdhaarCount > 0 ? pendingUdhaarCount : undefined,
    },
    {
      key: 'more',
      label: 'Dukaan & Settings',
      icon: <Sliders className="w-5 h-5" />,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-soft-line bg-paper h-[calc(100vh-57px)] sticky top-[57px] p-4 justify-between flex-shrink-0">
      <div className="space-y-6">
        {/* Merchant Card */}
        <div className="p-3.5 rounded-2xl bg-cloud border border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue/15 text-blue font-bold flex items-center justify-center text-sm">
              RS
            </div>
            <div className="min-w-0">
              <div className="font-bold text-obsidian text-sm truncate">Ramesh Sharma</div>
              <div className="text-xs text-charcoal truncate">Sharma Kirana Store</div>
              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Paytm Connected
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-sky/60 text-blue font-bold shadow-sm'
                    : 'text-charcoal hover:bg-cloud hover:text-obsidian'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue' : 'text-slate'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Voice Trigger Banner */}
        <button
          onClick={onOpenVoice}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-blue to-[#1881b5] text-white flex items-center gap-3 shadow-button hover:opacity-95 transition cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-bold leading-tight">Vyom Voice Bolke</div>
            <div className="text-[11px] text-sky leading-tight truncate">"Aaj dhanda kaisa hai?"</div>
          </div>
        </button>
      </div>

      {/* Footer System Status */}
      <div className="p-3 rounded-2xl bg-cloud/80 border border-soft-line text-xs space-y-1.5">
        <div className="flex items-center justify-between font-semibold text-ink">
          <span className="flex items-center gap-1.5 text-charcoal">
            <Shield className="w-3.5 h-3.5 text-blue" /> Guardrails
          </span>
          <span className="text-emerald-700 text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">Active</span>
        </div>
        <p className="text-[11px] text-slate leading-relaxed">
          Vyom aapki limits ke bahar bina ijaazat ke koi offer nahi bhejta.
        </p>
      </div>
    </aside>
  );
};
