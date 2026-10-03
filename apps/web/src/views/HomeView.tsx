import React from 'react';
import {
  Mic,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  Users,
  IndianRupee,
  ShieldCheck,
  Zap,
  ChevronRight,
  Clock,
  Calendar,
  Store,
  MessageSquare,
} from '../components/icons';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Language, Opportunity } from '../types';
import { SupportedCity } from '../data/cityFestivals';
import { formatRupee } from '../utils/formatters';
import { translations } from '../utils/i18n';
import { useCountUp } from '../hooks/useCountUp';
import { todaySalesHourly } from '../data/mockData';

export interface DynamicHomeMetrics {
  recoveredThisMonth: number;
  todaySales: number;
  yesterdaySales: number;
  wonBackCount: number;
  udhaarCollected: number;
  campaignSpend: number;
  todayOrders: number;
}

interface HomeViewProps {
  lang: Language;
  city: SupportedCity;
  opportunities: Opportunity[];
  metrics?: DynamicHomeMetrics;
  festivalBanner?: {
    headline: string;
    actionLabel: string;
    phase: string;
    daysToStart?: number;
  } | null;
  udhaarStrip?: {
    totalOutstanding: number;
    overdueCount: number;
    recommendedAction: string;
  } | null;
  hourlySalesData?: { hour: string; today: number; yesterday: number }[];
  onOpenVoice: () => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  onQuickApproveOpportunity: (opp: Opportunity) => void;
  onNavigateToTab: (tab: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'festivals' | 'more') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  lang,
  city,
  opportunities,
  metrics,
  festivalBanner,
  udhaarStrip,
  hourlySalesData,
  onOpenVoice,
  onSelectOpportunity,
  onQuickApproveOpportunity,
  onNavigateToTab,
}) => {
  const t = translations[lang] || translations.hinglish;

  const recoveredTarget = metrics?.recoveredThisMonth ?? 18640;
  const animatedRecovered = useCountUp(recoveredTarget, 1000);

  const todaySalesVal = metrics?.todaySales ?? 7420;
  const yesterdaySalesVal = metrics?.yesterdaySales ?? 6880;
  const salesDelta = todaySalesVal - yesterdaySalesVal;

  const wonBackVal = metrics?.wonBackCount ?? 14;
  const udhaarCollectedVal = metrics?.udhaarCollected ?? 9200;
  const campaignSpendVal = metrics?.campaignSpend ?? 1150;

  const chartData = hourlySalesData && hourlySalesData.length > 0 ? hourlySalesData : todaySalesHourly;
  const activeOpportunities = opportunities.filter((o) => o.status === 'new');

  return (
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* 1. Compact Identity Row: Avatar + Name + Live Dot */}
      <div className="flex items-center justify-between gap-3" style={{ paddingTop: 4 }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'var(--ai-fill)',
              border: '1px solid var(--outline)',
              boxShadow: '1px 1px 0px var(--shadow-color)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--ink)',
            }}
          >
            RS
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
              {t.greeting}
            </div>
            <div className="flex items-center gap-1.5" style={{ marginTop: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>Sharma Kirana</span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>•</span>
              <span style={{ fontSize: 10, color: '#6B7280' }}>{city}</span>
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#0E7A50',
                  background: '#BEF0D8',
                  padding: '1px 6px',
                  borderRadius: 999,
                  border: '1.5px solid var(--shadow-color)',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: 999, background: '#0E7A50', display: 'inline-block' }} className="animate-pulse-gentle" />
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero ₹ Recovered — Instrument Serif on lavender comic card */}
      <div className="comic-card-lavender" style={{ padding: '16px 16px 14px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
              <div className="icon-chip" style={{ background: '#FFFFFF', width: 28, height: 28, borderRadius: 8 }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.recovered}</span>
            </div>
            <div className="text-hero tabular-nums" style={{ color: 'var(--ink)' }}>
              {formatRupee(animatedRecovered)}
            </div>
          </div>
          <div className="text-right">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              <Users className="w-3 h-3 inline" style={{ marginRight: 4 }} />{wonBackVal} {t.wonBack}
            </div>
            <span
              className="comic-badge"
              style={{ background: '#BEF0D8', color: '#0E7A50', marginTop: 4, display: 'inline-flex' }}
            >
              12.8x ROI
            </span>
          </div>
        </div>
      </div>

      {/* 3. 2×2 Stat Grid — white cards, colored icon chips, comic shadow */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Today Sales */}
        <div className="comic-card" style={{ padding: 12 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <div className="icon-chip" style={{ background: '#BEF0D8' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#0E7A50' }} />
            </div>
            <span className="text-caption" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>{t.todaySales}</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
            {formatRupee(todaySalesVal)}
          </div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.28)' }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{t.yesterday}: {formatRupee(yesterdaySalesVal)}</span>
            <span
              style={{
                float: 'right',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: salesDelta >= 0 ? '#BEF0D8' : '#FFE4B8',
                color: salesDelta >= 0 ? '#0E7A50' : '#B5610E',
              }}
            >
              {salesDelta >= 0 ? `+${formatRupee(salesDelta)}` : formatRupee(salesDelta)}
            </span>
          </div>
        </div>

        {/* Udhaar Collected */}
        <div className="comic-card" style={{ padding: 12 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <div className="icon-chip" style={{ background: '#FFE4B8' }}>
              <IndianRupee className="w-3.5 h-3.5" style={{ color: '#B5610E' }} />
            </div>
            <span className="text-caption" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>{t.udhaarCollected}</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: '#0E7A50', fontFamily: 'var(--font-ui)' }}>
            {formatRupee(udhaarCollectedVal)}
          </div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.28)' }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{t.vasool}</span>
            <span
              style={{
                float: 'right',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: '#FFC9C9',
                color: '#C62828',
              }}
            >
              {udhaarStrip?.overdueCount ?? 2} {t.overdue}
            </span>
          </div>
        </div>

        {/* Campaign Spend */}
        <div className="comic-card" style={{ padding: 12 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <div className="icon-chip" style={{ background: 'var(--ai-fill)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
            </div>
            <span className="text-caption" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>{t.campaignSpend}</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
            {formatRupee(campaignSpendVal)}
          </div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.28)' }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{t.kharch}</span>
            <span
              style={{
                float: 'right',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                background: '#BEF0D8',
                color: '#0E7A50',
              }}
            >
              ₹14.2k {t.return}
            </span>
          </div>
        </div>

        {/* Today Orders */}
        <div className="comic-card" style={{ padding: 12 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <div className="icon-chip" style={{ background: '#C7E8FF' }}>
              <Store className="w-3.5 h-3.5" style={{ color: '#1565C0' }} />
            </div>
            <span className="text-caption" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280' }}>{t.orders}</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
            {metrics?.todayOrders ?? 24}
          </div>
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(148,163,184,0.28)' }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{t.todayOrders}</span>
          </div>
        </div>
      </div>

      {/* 4. Festival Signal Banner (never truncated) */}
      {festivalBanner && (
        <div
          onClick={() => onNavigateToTab('festivals')}
          className="comic-card-peach cursor-pointer"
          style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="icon-chip" style={{ background: '#FFFFFF', width: 36, height: 36, borderRadius: 12 }}>
              <Calendar className="w-4 h-4" style={{ color: '#B5610E' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="comic-badge"
                  style={{ background: '#FFFFFF', color: '#B5610E', fontSize: 9 }}
                >
                  {festivalBanner.phase}
                </span>
                {festivalBanner.daysToStart !== undefined && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#B5610E' }}>
                    {festivalBanner.daysToStart} {t.daysLeft}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 4, lineHeight: 1.4 }}>
                {festivalBanner.headline}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#B5610E' }} />
        </div>
      )}

      {/* 6. Opportunity Cards with Rule-Tag Evidence Chips */}
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="text-section" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
            {t.opportunitiesTitle}
          </div>
          <button
            onClick={() => onNavigateToTab('opportunities')}
            className="flex items-center gap-0.5 cursor-pointer"
            style={{ fontSize: 13, fontWeight: 700, color: 'var(--ai-text)' }}
          >
            <span>{t.allCount} ({activeOpportunities.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeOpportunities.length > 0 ? (
          <div className="space-y-3">
            {activeOpportunities.slice(0, 2).map((opp) => (
              <div key={opp.id} className="comic-card" style={{ padding: 14 }}>
                <div className="flex items-start justify-between gap-2" style={{ marginBottom: 8 }}>
                  <div className="min-w-0 flex-1">
                    <span
                      className="comic-badge"
                      style={{
                        background: 'var(--ai-fill)',
                        color: 'var(--ai-text)',
                        fontSize: 9,
                        marginBottom: 6,
                        display: 'inline-flex',
                      }}
                    >
                      {opp.type === 'winback'
                        ? 'Win-back'
                        : opp.type === 'deadhours'
                        ? 'Dead hours'
                        : opp.type === 'festival'
                        ? 'Festival'
                        : 'Sales drop'}
                    </span>
                    <h3
                      onClick={() => onSelectOpportunity(opp)}
                      className="cursor-pointer"
                      style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3, fontFamily: 'var(--font-ui)' }}
                    >
                      {opp.title[lang] || opp.title.hinglish}
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ai-text)' }}>
                      {formatRupee(opp.potentialRevenue)}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{t.potential}</div>
                  </div>
                </div>

                {/* Rule-Tag Evidence Chips */}
                <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: 'var(--canvas)',
                      border: '1.5px solid rgba(148,163,184,0.40)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    📅 {t.dayPattern}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: 'var(--canvas)',
                      border: '1.5px solid rgba(148,163,184,0.40)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    📍 {opp.customerCount} {t.customers}
                  </span>
                  {opp.type === 'festival' && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: 'var(--canvas)',
                        border: '1.5px solid rgba(148,163,184,0.40)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      🎉 {festivalBanner?.headline?.split('.')[0] || 'Festival'}
                    </span>
                  )}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectOpportunity(opp)}
                    className="comic-btn-outline comic-btn-sm"
                    style={{ fontSize: 13 }}
                  >
                    {t.laterBtn}
                  </button>
                  <button
                    onClick={() => onQuickApproveOpportunity(opp)}
                    className="comic-btn comic-btn-sm"
                    style={{ fontSize: 13 }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.approveBtn}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="comic-card" style={{ padding: 20, textAlign: 'center' }}>
            <p className="text-caption">
              {t.noOpportunities}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
