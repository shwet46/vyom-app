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
    <nav
      className="bottom-nav fixed bottom-0 left-1/2 z-30 safe-bottom"
      aria-label="Primary navigation"
    >
      <div
        style={{
          background: '#FFFFFF',
          borderTop: '2px solid var(--shadow-color)',
          boxShadow: '0 -1px 0 var(--outline)',
          minHeight: '60px',
        }}
      >
        <div className="flex items-center justify-around" style={{ height: 60 }}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className="relative flex flex-col items-center justify-center flex-1 cursor-pointer"
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  color: isActive ? 'var(--ai-text)' : '#6B7280',
                  transition: 'color 0.15s ease',
                }}
                aria-label={tab.label}
              >
                <div className="relative">
                  <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s ease' }}>
                    {tab.icon}
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className="absolute flex items-center justify-center"
                      style={{
                        top: -6,
                        right: -10,
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        borderRadius: 999,
                        background: 'var(--shadow-color)',
                        color: '#FFFFFF',
                        fontSize: 9,
                        fontWeight: 700,
                        border: '2px solid #FFFFFF',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 500,
                    marginTop: 2,
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    className="absolute"
                    style={{
                      bottom: 4,
                      width: 16,
                      height: 3,
                      borderRadius: 999,
                      background: 'var(--ai-text)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
