import React from 'react';
import { Home, Lightbulb, Megaphone, BookOpen, MoreHorizontal } from './icons';
import { Language } from '../types';
import { translations } from '../utils/i18n';

export type TabKey = 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'more';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  lang: Language;
  opportunitiesCount: number;
  pendingUdhaarCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  lang,
  opportunitiesCount,
  pendingUdhaarCount,
}) => {
  const t = translations[lang] || translations.hinglish;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
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
      label: t.tabMore,
      icon: <MoreHorizontal className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-paper/95 backdrop-blur-md border-t border-soft-line md:hidden px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(7,7,9,0.04)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] py-1 transition-all cursor-pointer ${
                isActive ? 'text-blue' : 'text-charcoal hover:text-ink'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-blue text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-1 truncate ${
                  isActive ? 'font-bold text-blue' : 'text-charcoal'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-1 rounded-full bg-blue" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
