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
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* 1. Merchant Greeting & Live Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-google font-black text-obsidian tracking-tight">
              {t.greeting}
            </h1>
            {/* <span className="text-lg">👋</span> */}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-charcoal">
            <span className="font-semibold text-ink">Sharma Kirana Store</span>
            <span>•</span>
            <span className="text-slate">{city}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Paytm Synced
            </span>
          </div>
        </div>

        {/* Quiet Hours & Protection Pill */}
        {/* <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-cloud border border-soft-line text-xs font-medium text-charcoal">
          <ShieldCheck className="w-3.5 h-3.5 text-blue" />
          <span>Silent Leak Protection: <strong className="text-emerald-700 font-bold">Active 24/7</strong></span>
        </div> */}
      </div>

      {/* 2. Festival Signal Banner (Compact & Non-intrusive) */}
      {festivalBanner && (
        <div
          onClick={() => onNavigateToTab('festivals')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-300/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-google font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {festivalBanner.phase || 'Festival Signal'}
                </span>
                {festivalBanner.daysToStart !== undefined && (
                  <span className="text-xs text-amber-800 font-bold">
                    {festivalBanner.daysToStart} din bache hain
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-obsidian mt-0.5 whitespace-normal break-words">
                {festivalBanner.headline}
              </p>
            </div>
          </div>
          <button className="self-end sm:self-auto text-xs font-google font-bold text-amber-900 flex items-center gap-1 shrink-0 bg-white/90 px-3 py-1.5 rounded-xl border border-amber-200/80 hover:bg-white shadow-xs">
            <span>{festivalBanner.actionLabel || 'Stock Check'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. Sleek AI Voice Copilot Bar (Modern conversational pill replacing bulky orb) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky/60 via-paper to-cloud border border-blue/20 shadow-feature">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={onOpenVoice}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue/15 text-blue flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-blue animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-google font-black text-obsidian">Vyom Copilot</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-700 font-medium">Ready</span>
              </div>
              <p className="text-xs text-charcoal font-sans truncate mt-0.5 group-hover:text-blue transition-colors">
                Bolke poochhein: <span className="italic font-medium text-ink">"Aaj dhanda kaisa hai?" ya "Kiska udhaar overdue hai?"</span>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenVoice}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue hover:bg-blue-dark text-white flex items-center justify-center shadow-button shadow-glow-blue transition-all transform active:scale-95 flex-shrink-0 cursor-pointer"
            aria-label="Bolke poochhein"
            title="Open Voice Assistant"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-soft-line overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate whitespace-nowrap font-google">Poochhein:</span>
          {[
            { label: '📊 Aaj Ki Bikri', query: 'Aaj ki bikri kitni hui?' },
            { label: '⚠️ Overdue Udhaar', query: 'Kiska udhaar 30 din se overdue hai?' },
            { label: '🎉 Navratri Stock', query: 'Navratri ke liye kya stock karna chahiye?' },
            { label: '💡 Naye Mauke', query: 'Vyom ne naye kya mauke dhoonde hain?' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={onOpenVoice}
              className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[11px] font-medium text-charcoal hover:text-blue border border-soft-line whitespace-nowrap transition cursor-pointer shadow-xs"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Unified KPI Business Performance Grid (4 Balanced Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Silent Leak Recovered */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-line/70 shadow-feature flex flex-col justify-between hover:border-blue/40 transition min-w-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-0">
              <span className="text-[11px] font-google font-extrabold text-charcoal uppercase tracking-wider flex items-start gap-1 min-w-0 leading-tight">
                <Sparkles className="w-3 h-3 text-blue shrink-0" />
                <span className="whitespace-normal">Recovered</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 shrink-0">
                12.8x ROI
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-obsidian tracking-tight font-google mt-2 truncate">
              {formatRupee(animatedRecovered)}
            </div>
          </div>
          <div className="text-[11px] text-charcoal mt-2 pt-2 border-t border-soft-line flex items-start sm:items-center justify-between gap-1">
            <span className="flex items-center gap-1 text-blue font-semibold min-w-0">
              <Users className="w-3 h-3 shrink-0" /> <span className="whitespace-normal">{wonBackVal} Won Back</span>
            </span>
            <span className="text-slate text-[10px] shrink-0">30 din</span>
          </div>
        </div>

        {/* Card 2: Today's Sales */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-line/70 shadow-feature flex flex-col justify-between hover:border-blue/40 transition min-w-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-0">
              <span className="text-[11px] font-google font-extrabold text-charcoal uppercase tracking-wider flex items-start gap-1 min-w-0 leading-tight">
                <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="whitespace-normal">{t.todaySales}</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                salesDelta >= 0
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-100'
                  : 'text-amber-800 bg-amber-50 border-amber-100'
              }`}>
                {salesDelta >= 0 ? `+${formatRupee(salesDelta)}` : formatRupee(salesDelta)}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-obsidian tracking-tight font-google mt-2 truncate">
              {formatRupee(todaySalesVal)}
            </div>
          </div>
          <div className="text-[11px] text-charcoal mt-2 pt-2 border-t border-soft-line flex items-center justify-between gap-1">
            <span className="text-slate font-medium truncate">Kal: {formatRupee(yesterdaySalesVal)}</span>
            <span className="text-emerald-700 font-bold text-[10px] shrink-0">{metrics?.todayOrders ?? 24} Orders</span>
          </div>
        </div>

        {/* Card 3: Udhaar Collected */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-line/70 shadow-feature flex flex-col justify-between hover:border-blue/40 transition min-w-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-0">
              <span className="text-[11px] font-google font-extrabold text-charcoal uppercase tracking-wider flex items-start gap-1 min-w-0 leading-tight">
                <IndianRupee className="w-3 h-3 text-blue shrink-0" />
                <span className="whitespace-normal">{t.udhaarCollected}</span>
              </span>
              <span className="text-[10px] font-bold text-blue bg-sky px-1.5 py-0.5 rounded-full shrink-0">
                Soundbox ✓
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight font-google mt-2 truncate">
              {formatRupee(udhaarCollectedVal)}
            </div>
          </div>
          <div className="text-[11px] text-charcoal mt-2 pt-2 border-t border-soft-line flex items-center justify-between gap-1">
            <span className="text-charcoal font-medium truncate">Vasool hua</span>
            <span className="text-amber-700 font-bold text-[10px] shrink-0">
              {udhaarStrip?.overdueCount ?? 2} Overdue
            </span>
          </div>
        </div>

        {/* Card 4: Marketing & Campaign ROI */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-line/70 shadow-feature flex flex-col justify-between hover:border-blue/40 transition min-w-0">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-0">
              <span className="text-[11px] font-google font-extrabold text-charcoal uppercase tracking-wider flex items-start gap-1 min-w-0 leading-tight">
                <Zap className="w-3 h-3 text-purple-600 shrink-0" />
                <span className="whitespace-normal">{t.campaignSpend}</span>
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100 shrink-0">
                WhatsApp
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-obsidian tracking-tight font-google mt-2 truncate">
              {formatRupee(campaignSpendVal)}
            </div>
          </div>
          <div className="text-[11px] text-charcoal mt-2 pt-2 border-t border-soft-line flex items-center justify-between gap-1">
            <span className="text-slate font-medium truncate">Kharch</span>
            <span className="text-purple-700 font-bold text-[10px] shrink-0">₹14.2k return</span>
          </div>
        </div>
      </div>

      {/* 5. Main Dashboard Content (Balanced 2-Column Grid on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Opportunities Action Radar */}
        <div className="lg:col-span-7 space-y-3.5 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-google font-black text-obsidian tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue" />
                {t.opportunitiesTitle}
              </h2>
              <p className="text-xs text-charcoal font-sans">{t.opportunitiesSubtitle}</p>
            </div>
            <button
              onClick={() => onNavigateToTab('opportunities')}
              className="text-xs font-google font-bold text-blue hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Sabhi Dekhein ({activeOpportunities.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeOpportunities.length > 0 ? (
            <div className="space-y-3">
              {activeOpportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature hover:border-blue/50 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-google font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky text-blue">
                        {opp.type === 'winback'
                          ? 'Win-back'
                          : opp.type === 'deadhours'
                          ? 'Dead hours'
                          : opp.type === 'festival'
                          ? 'Festival'
                          : 'Sales drop'}
                      </span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate font-medium">Potential: </span>
                        <span className="text-sm sm:text-base font-google font-black text-blue">
                          {formatRupee(opp.potentialRevenue)}
                        </span>
                      </div>
                    </div>

                    <h3
                      onClick={() => onSelectOpportunity(opp)}
                      className="font-google font-extrabold text-sm sm:text-base text-obsidian leading-snug cursor-pointer group-hover:text-blue transition-colors"
                    >
                      {opp.title[lang] || opp.title.hinglish}
                    </h3>

                    <p className="text-xs text-charcoal mt-1 line-clamp-2 leading-relaxed font-sans">
                      {opp.description[lang] || opp.description.hinglish}
                    </p>
                  </div>

                  {/* Card Action Row */}
                  <div className="pt-3 border-t border-soft-line flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectOpportunity(opp)}
                      className="py-2 px-3 rounded-xl border border-line/80 text-xs font-google font-bold text-charcoal hover:bg-cloud transition cursor-pointer"
                    >
                      {t.laterBtn}
                    </button>

                    <button
                      onClick={() => onQuickApproveOpportunity(opp)}
                      className="py-2 px-3.5 rounded-xl bg-blue hover:bg-blue-dark text-white text-xs font-google font-black shadow-button flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.approveBtn}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-cloud border border-line/60 text-center text-xs text-charcoal font-sans">
              Sabhi mauke approve ho chuke hain! Naye transactions aate hi Vyom naye mauke dhoondega.
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Velocity Chart & Udhaar Quick Strip */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
          {/* Today's Sales Velocity Hourly Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-charcoal uppercase tracking-wider font-google">
                  Hourly Sales Velocity
                </div>
                <div className="text-lg font-black text-obsidian tracking-tight font-google mt-0.5">
                  {formatRupee(todaySalesVal)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue font-bold bg-sky px-2 py-0.5 rounded-full font-google">
                  Peak 6 PM – 8 PM
                </span>
              </div>
            </div>

            {/* Hourly Area Chart */}
            <div className="h-32 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="todayGradHome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2597d0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2597d0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatRupee(Number(val)), 'Sales']}
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="today"
                    stroke="#2597d0"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#todayGradHome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="yesterday"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate pt-2 border-t border-soft-line">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-blue rounded-full" /> Aaj (Solid)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-slate rounded-full border-dashed" /> Kal (Dashed)
              </span>
              <span className="text-emerald-700 font-semibold">{salesDelta >= 0 ? `+${formatRupee(salesDelta)}` : ''}</span>
            </div>
          </div>

          {/* Autonomous Udhaar Auto-Pilot Card */}
          <div
            onClick={() => onNavigateToTab('udhaar')}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky/40 via-paper to-white border border-blue/20 hover:border-blue shadow-feature transition cursor-pointer flex flex-col justify-between gap-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white border border-sky flex items-center justify-center text-blue font-bold flex-shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-blue" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-obsidian block truncate font-google">
                    {udhaarStrip?.recommendedAction || t.autonomousStrip}
                  </span>
                  <span className="text-[11px] text-charcoal font-medium">
                    {udhaarStrip ? `${formatRupee(udhaarStrip.totalOutstanding)} baaki hisaab` : 'Paytm Soundbox Synced'}
                  </span>
                </div>
              </div>

              {udhaarStrip && udhaarStrip.overdueCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full shrink-0">
                  {udhaarStrip.overdueCount} Overdue
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-soft-line flex items-center justify-between text-xs font-google font-bold text-blue group-hover:underline">
              <span>Khata Dekhein & Takada Bhejein</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
