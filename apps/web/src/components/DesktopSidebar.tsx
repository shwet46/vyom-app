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
      icon: <Home className="w-[18px] h-[18px]" />,
    },
    {
      key: 'opportunities',
      label: t.tabOpportunities,
      icon: <Lightbulb className="w-[18px] h-[18px]" />,
      badge: opportunitiesCount,
    },
    {
      key: 'campaigns',
      label: t.tabCampaigns,
      icon: <Megaphone className="w-[18px] h-[18px]" />,
    },
    {
      key: 'udhaar',
      label: t.tabUdhaar,
      icon: <BookOpen className="w-[18px] h-[18px]" />,
      badge: pendingUdhaarCount > 0 ? pendingUdhaarCount : undefined,
    },
    {
      key: 'more',
      label: 'Dukaan & Settings',
      icon: <Sliders className="w-[18px] h-[18px]" />,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-60 border-r border-soft-line bg-paper/40 backdrop-blur-sm h-[calc(100vh-56px)] sticky top-14 p-3.5 justify-between flex-shrink-0 overflow-y-auto no-scrollbar">
      <div className="space-y-4">
        {/* Merchant Card */}
        <div className="p-2.5 rounded-2xl bg-cloud/60 border border-line/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue/20 to-lavender/50 text-blue font-bold flex items-center justify-center text-[11px] font-heading">
              RS
            </div>
            <div className="min-w-0">
              <div className="font-bold text-obsidian text-[11px] truncate font-heading">Ramesh Sharma</div>
              <div className="text-[10px] text-charcoal truncate">Sharma Kirana Store</div>
              <div className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Paytm Connected
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 cursor-pointer font-heading ${
                  isActive
                    ? 'bg-lavender/40 text-blue font-bold shadow-xs'
                    : 'text-charcoal hover:bg-cloud/50 hover:text-obsidian'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`transition-colors ${isActive ? 'text-blue' : 'text-slate'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-blue text-white font-bold font-heading">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Voice Trigger */}
        <button
          onClick={onOpenVoice}
          className="w-full p-2.5 rounded-2xl bg-gradient-to-br from-blue to-blue-dark text-white flex items-center gap-2 shadow-button hover:shadow-glow-blue transition-all cursor-pointer active:scale-[0.98]"
        >
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[11px] font-bold leading-tight font-heading">Vyom Voice AI</div>
            <div className="text-[9px] text-white/60 leading-tight truncate">"Aaj dhanda kaisa hai?"</div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="p-2 rounded-xl bg-cloud/50 border border-soft-line text-[10px] space-y-0.5">
        <div className="flex items-center justify-between font-semibold text-ink">
          <span className="flex items-center gap-1 text-charcoal font-heading">
            <Shield className="w-2.5 h-2.5 text-blue" /> Guardrails
          </span>
          <span className="text-emerald-700 text-[9px] bg-emerald-100/60 px-1.5 py-0.5 rounded font-bold">Active</span>
        </div>
        <p className="text-[9px] text-slate leading-relaxed">
          Limits ke bahar bina ijaazat koi action nahi.
        </p>
      </div>
    </aside>
  );
};
