import React, { useState } from 'react';
import { Bell, Download, Check, Sparkles, Store, ShieldCheck } from './icons';
import { Language } from '../types';
import { SupportedCity } from '../data/cityFestivals';

interface TopBarProps {
  currentLang: Language;
  city: SupportedCity;
  onLanguageChange: (lang: Language) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  onOpenOnboarding: () => void;
  isOnline?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentLang,
  city,
  onLanguageChange,
  onOpenNotifications,
  unreadCount,
  onOpenOnboarding,
  isOnline = true,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const langNames: { id: Language; label: string; native: string }[] = [
    { id: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
    { id: 'hindi', label: 'Hindi', native: 'हिन्दी' },
    { id: 'marathi', label: 'Marathi', native: 'मराठी' },
    { id: 'english', label: 'English', native: 'English' },
  ];

  const currentLangLabel = langNames.find((l) => l.id === currentLang)?.native || 'Hinglish';

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: '#FFFFFF',
        borderBottom: '2px solid var(--shadow-color)',
        padding: '0 12px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="w-full flex items-center justify-between gap-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--ai-text)',
              border: '1px solid var(--outline)',
              boxShadow: '1px 1px 0px var(--shadow-color)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            V
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>VYOM</span>
              <span
                className="inline-flex items-center gap-0.5"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'var(--ai-fill)',
                  color: 'var(--ai-text)',
                  padding: '2px 6px',
                  borderRadius: 999,
                  border: '1.5px solid var(--shadow-color)',
                }}
              >
                <Sparkles className="w-2.5 h-2.5" /> AI Saathi
              </span>
            </div>
            <button
              onClick={onOpenOnboarding}
              className="text-left flex items-center gap-1 truncate"
              style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-ui)', fontWeight: 600 }}
              title="View / re-configure shop details"
            >
              <span style={{ color: 'var(--ink)', fontWeight: 600 }} className="truncate">Sharma Kirana</span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>• {city}</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 cursor-pointer"
              style={{
                padding: '6px 8px',
                borderRadius: 10,
                border: '1px solid var(--outline)',
                background: '#FFFFFF',
                boxShadow: '1px 1px 0px var(--shadow-color)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--ink)',
                fontFamily: 'var(--font-ui)',
                minHeight: 32,
              }}
              aria-label="Change Language"
            >
              <span>🌐</span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>▾</span>
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div
                  className="absolute right-0 z-50"
                  style={{
                    marginTop: 6,
                    width: 160,
                    background: '#FFFFFF',
                    border: '1px solid var(--outline)',
                    borderRadius: 16,
                    boxShadow: '2px 2px 0px var(--shadow-color)',
                    padding: '6px 0',
                  }}
                >
                  <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Language
                  </div>
                  {langNames.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        onLanguageChange(l.id);
                        setShowLangMenu(false);
                      }}
                      className="w-full flex items-center justify-between cursor-pointer"
                      style={{
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: currentLang === l.id ? 700 : 500,
                        background: currentLang === l.id ? 'var(--ai-fill)' : 'transparent',
                        color: currentLang === l.id ? 'var(--ai-text)' : 'var(--shadow-color)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div className="flex flex-col text-left">
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{l.native}</span>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>{l.label}</span>
                      </div>
                      {currentLang === l.id && <Check className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative flex items-center justify-center cursor-pointer"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: '1px solid var(--outline)',
              background: '#FFFFFF',
              boxShadow: '1px 1px 0px var(--shadow-color)',
              color: 'var(--ink)',
            }}
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: '#C62828',
                  color: '#FFFFFF',
                  fontSize: 9,
                  fontWeight: 700,
                  border: '2px solid #FFFFFF',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* iOS Install Guidance Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,41,112,0.35)' }}>
          <div className="w-full comic-card p-6" style={{ maxWidth: 340 }}>
            <div
              className="icon-chip"
              style={{ width: 48, height: 48, borderRadius: 14, background: '#C7E8FF', marginBottom: 16 }}
            >
              <Download className="w-6 h-6" style={{ color: '#1565C0' }} />
            </div>
            <h3 className="text-section" style={{ color: 'var(--ink)' }}>iPhone par Vyom install karein</h3>
            <p className="text-caption" style={{ marginTop: 8, lineHeight: 1.6 }}>
              1. Safari browser ke neeche <strong>Share (तीर वाला आइकन)</strong> dabayein.<br />
              2. Neeche scroll karke <strong>Add to Home Screen</strong> select karein.<br />
              3. Vyom aapke phone par bina internet ke bhi tez chalega.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="comic-btn w-full"
              style={{ marginTop: 20 }}
            >
              Samajh Gaya (Close)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
