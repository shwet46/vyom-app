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
    <div className="space-y-4 sm:space-y-5 pb-8 animate-fade-slide-up">
      {/* 1. Compact Greeting + AI Voice CTA */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-heading font-bold text-obsidian tracking-tight leading-tight">
            {t.greeting}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] font-semibold text-charcoal">Sharma Kirana</span>
            <span className="text-slate text-[10px]">•</span>
            <span className="text-[10px] text-slate">{city}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Voice CTA pill */}
        <button
          onClick={onOpenVoice}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-blue to-blue-dark text-white shadow-button hover:shadow-glow-blue transition-all active:scale-95 cursor-pointer"
          aria-label="Open Vyom Voice"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-0.5 rounded-full bg-white/25 animate-ping opacity-50" />
            <Mic className="w-4 h-4 text-white relative z-10" />
          </div>
          <span className="text-xs font-bold tracking-tight hidden xs:inline">Vyom AI</span>
        </button>
      </div>

      {/* 2. KPI Grid — 4 Compact Visual Cards with pastel gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Recovered */}
        <div className="p-3 sm:p-3.5 rounded-2xl card-pastel-lavender border border-lavender/40 shadow-card hover-lift flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-blue/12 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-blue" />
            </div>
            <span className="text-[10px] font-bold text-charcoal uppercase tracking-wider">Recovered</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-obsidian tracking-tight font-heading">
            {formatRupee(animatedRecovered)}
          </div>
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-lavender/30">
            <span className="flex items-center gap-1 text-[10px] text-blue font-medium">
              <Users className="w-2.5 h-2.5" /> {wonBackVal} Won Back
            </span>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded-full">12.8x ROI</span>
          </div>
        </div>

        {/* Card 2: Today Sales */}
        <div className="p-3 sm:p-3.5 rounded-2xl card-pastel-mint border border-mint/40 shadow-card hover-lift flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/12 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-charcoal uppercase tracking-wider">{t.todaySales}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-obsidian tracking-tight font-heading">
            {formatRupee(todaySalesVal)}
          </div>
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-mint/30">
            <span className="text-[10px] text-slate font-medium">Kal: {formatRupee(yesterdaySalesVal)}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              salesDelta >= 0
                ? 'text-emerald-700 bg-emerald-50/80'
                : 'text-amber-700 bg-amber-50/80'
            }`}>
              {salesDelta >= 0 ? `+${formatRupee(salesDelta)}` : formatRupee(salesDelta)}
            </span>
          </div>
        </div>

        {/* Card 3: Udhaar Collected */}
        <div className="p-3 sm:p-3.5 rounded-2xl card-pastel-peach border border-peach/40 shadow-card hover-lift flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-orange-500/12 flex items-center justify-center">
              <IndianRupee className="w-3 h-3 text-orange-600" />
            </div>
            <span className="text-[10px] font-bold text-charcoal uppercase tracking-wider">{t.udhaarCollected}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight font-heading">
            {formatRupee(udhaarCollectedVal)}
          </div>
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-peach/30">
            <span className="text-[10px] text-charcoal font-medium">Vasool</span>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded-full">
              {udhaarStrip?.overdueCount ?? 2} Overdue
            </span>
          </div>
        </div>

        {/* Card 4: Campaign Spend */}
        <div className="p-3 sm:p-3.5 rounded-2xl card-pastel-blush border border-blush/40 shadow-card hover-lift flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/12 flex items-center justify-center">
              <Zap className="w-3 h-3 text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-charcoal uppercase tracking-wider">{t.campaignSpend}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-obsidian tracking-tight font-heading">
            {formatRupee(campaignSpendVal)}
          </div>
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-blush/30">
            <span className="text-[10px] text-slate font-medium">Kharch</span>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50/80 px-1.5 py-0.5 rounded-full">₹14.2k return</span>
          </div>
        </div>
      </div>

      {/* 3. Festival Signal Banner (Compact Pill) */}
      {festivalBanner && (
        <div
          onClick={() => onNavigateToTab('festivals')}
          className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 via-cream/40 to-transparent border border-amber-200/50 shadow-card flex items-center justify-between gap-3 cursor-pointer hover:border-amber-300 transition-all hover-lift"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded-full">
                  {festivalBanner.phase}
                </span>
                {festivalBanner.daysToStart !== undefined && (
                  <span className="text-[10px] text-amber-700 font-semibold">
                    {festivalBanner.daysToStart}d left
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-obsidian mt-0.5 line-clamp-1">
                {festivalBanner.headline}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
        </div>
      )}

      {/* 4. Main Dashboard — 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Opportunities */}
        <div className="lg:col-span-7 space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-bold text-obsidian tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue" />
              {t.opportunitiesTitle}
            </h2>
            <button
              onClick={() => onNavigateToTab('opportunities')}
              className="text-[11px] font-bold text-blue hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>All ({activeOpportunities.length})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {activeOpportunities.length > 0 ? (
            <div className="space-y-2.5">
              {activeOpportunities.slice(0, 3).map((opp, idx) => {
                const cardStyles = [
                  'card-pastel-lavender border-lavender/30',
                  'card-pastel-mint border-mint/30',
                  'card-pastel-peach border-peach/30',
                ];
                return (
                  <div
                    key={opp.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border shadow-card hover-lift transition-all flex flex-col gap-2.5 group ${cardStyles[idx % 3]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue/8 text-blue inline-block mb-1">
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
                          className="font-heading font-bold text-sm text-obsidian leading-snug cursor-pointer group-hover:text-blue transition-colors"
                        >
                          {opp.title[lang] || opp.title.hinglish}
                        </h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm sm:text-base font-bold text-blue font-heading">
                          {formatRupee(opp.potentialRevenue)}
                        </div>
                        <div className="text-[9px] text-slate">potential</div>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectOpportunity(opp)}
                        className="py-1.5 px-3 rounded-xl border border-line/60 text-[11px] font-semibold text-charcoal hover:bg-cloud/50 transition cursor-pointer"
                      >
                        {t.laterBtn}
                      </button>
                      <button
                        onClick={() => onQuickApproveOpportunity(opp)}
                        className="py-1.5 px-3.5 rounded-xl bg-blue hover:bg-blue-dark text-white text-[11px] font-bold shadow-button flex items-center gap-1 transition cursor-pointer active:scale-95"
                      >
                        <Check className="w-3 h-3" />
                        <span>{t.approveBtn}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-5 rounded-2xl glass-card text-center text-xs text-charcoal">
              Sabhi mauke approve ho chuke hain! Naye transactions aate hi Vyom naye mauke dhoondega.
            </div>
          )}
        </div>

        {/* Right Column: Chart + Udhaar Quick Strip */}
        <div className="lg:col-span-5 space-y-3 min-w-0">
          {/* Sales Velocity Chart */}
          <div className="p-3.5 sm:p-4 rounded-2xl glass-card space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-charcoal uppercase tracking-wider font-heading">
                  Sales Velocity
                </div>
                <div className="text-lg font-bold text-obsidian tracking-tight font-heading mt-0.5">
                  {formatRupee(todaySalesVal)}
                </div>
              </div>
              <span className="text-[9px] text-blue font-bold bg-sky/60 px-2 py-0.5 rounded-full">
                Peak 6–8 PM
              </span>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="todayGradHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatRupee(Number(val)), 'Sales']}
                    contentStyle={{
                      backgroundColor: '#111827',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '11px',
                      border: 'none',
                      padding: '6px 10px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="today"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#todayGradHome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="yesterday"
                    stroke="#6B7280"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate pt-1.5 border-t border-soft-line">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-blue rounded-full" /> Today
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-slate/50 rounded-full" /> Yesterday
              </span>
              <span className="text-emerald-700 font-semibold">{salesDelta >= 0 ? `+${formatRupee(salesDelta)}` : ''}</span>
            </div>
          </div>

          {/* Udhaar Quick Strip */}
          <div
            onClick={() => onNavigateToTab('udhaar')}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-sky/30 via-paper to-lavender/20 border border-blue/10 hover:border-blue/30 shadow-card transition cursor-pointer flex items-center justify-between gap-3 group hover-lift"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue/10 border border-blue/15 flex items-center justify-center text-blue flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-[11px] text-obsidian block truncate font-heading">
                  {udhaarStrip?.recommendedAction || t.autonomousStrip}
                </span>
                <span className="text-[10px] text-charcoal">
                  {udhaarStrip ? `${formatRupee(udhaarStrip.totalOutstanding)} pending` : 'Soundbox Synced'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {udhaarStrip && udhaarStrip.overdueCount > 0 && (
                <span className="text-[9px] bg-amber-100/80 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                  {udhaarStrip.overdueCount}
                </span>
              )}
              <ArrowRight className="w-3.5 h-3.5 text-blue group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Voice Copilot Quick Suggestions (mobile compact) */}
          <div className="p-3 rounded-2xl glass-card lg:hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue animate-pulse" />
              <span className="text-[11px] font-bold text-obsidian font-heading">Ask Vyom</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { label: '📊 Aaj Ki Bikri' },
                { label: '⚠️ Overdue' },
                { label: '🎉 Festival Stock' },
                { label: '💡 Naye Mauke' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={onOpenVoice}
                  className="px-2.5 py-1 rounded-lg bg-sky/40 hover:bg-sky text-[10px] font-medium text-charcoal hover:text-blue border border-soft-line whitespace-nowrap transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
