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
} from '../components/icons';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Language, Opportunity } from '../types';
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
  const animatedRecovered = useCountUp(recoveredTarget, 1200);

  const todaySalesVal = metrics?.todaySales ?? 7420;
  const yesterdaySalesVal = metrics?.yesterdaySales ?? 6880;
  const salesDelta = todaySalesVal - yesterdaySalesVal;

  const wonBackVal = metrics?.wonBackCount ?? 14;
  const udhaarCollectedVal = metrics?.udhaarCollected ?? 9200;
  const campaignSpendVal = metrics?.campaignSpend ?? 1150;

  const chartData = hourlySalesData && hourlySalesData.length > 0 ? hourlySalesData : todaySalesHourly;

  // Active new opportunities
  const activeOpportunities = opportunities.filter((o) => o.status === 'new');

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* Merchant Greeting & Shop header */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-google font-black text-obsidian tracking-tight leading-tight">
          {t.greeting}
        </h1>
        <p className="text-xs text-charcoal mt-1 font-lora italic">
          Vyom 24/7 silent loss track kar raha hai • Sharma Kirana Store (Pune)
        </p>
      </div>

      {/* Festival Alert Banner if active or upcoming */}
      {festivalBanner && (
        <div
          onClick={() => onNavigateToTab('festivals')}
          className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-google font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  {festivalBanner.phase || 'Festival Signal'}
                </span>
                {festivalBanner.daysToStart !== undefined && (
                  <span className="text-[11px] text-amber-800 font-semibold">
                    {festivalBanner.daysToStart} din bache hain
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-obsidian mt-1 truncate">
                {festivalBanner.headline}
              </p>
            </div>
          </div>
          <button className="text-xs font-google font-bold text-amber-900 flex items-center gap-1 shrink-0 bg-white/80 px-2.5 py-1.5 rounded-xl border border-amber-200">
            <span>{festivalBanner.actionLabel || 'Stock Check'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Card: Recovered Revenue Count-Up */}
      <div className="relative rounded-3xl bg-gradient-to-b from-sky/40 via-cloud to-paper p-5 sm:p-7 border border-line shadow-feature overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-blue/15 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-google font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue" />
            {t.heroCardTitle}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-google font-bold bg-emerald-100/90 text-emerald-800 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            {t.deltaText}
          </span>
        </div>

        {/* Giant ₹ count */}
        <div className="mt-3 mb-5">
          <div className="text-4xl sm:text-6xl font-black text-obsidian tracking-tight font-google">
            {formatRupee(animatedRecovered)}
          </div>
          <div className="text-xs text-charcoal font-medium mt-1 font-sans">
            Pehle yeh paisa bina pata chale chhoot raha tha • Paytm Soundbox Synced
          </div>
        </div>

        {/* 3 Mini Stats Underneath */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-soft-line">
          <div className="p-3 rounded-2xl bg-white/90 border border-soft-line text-left shadow-xs">
            <div className="text-[11px] text-slate font-medium truncate flex items-center gap-1">
              <Users className="w-3 h-3 text-blue" /> Won Back
            </div>
            <div className="text-base sm:text-lg font-google font-black text-obsidian mt-0.5">
              {wonBackVal}
            </div>
            <div className="text-[10px] text-charcoal truncate">customers wapas</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-soft-line text-left shadow-xs">
            <div className="text-[11px] text-slate font-medium truncate flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-emerald-600" /> {t.udhaarCollected}
            </div>
            <div className="text-base sm:text-lg font-google font-black text-emerald-700 mt-0.5">
              {formatRupee(udhaarCollectedVal)}
            </div>
            <div className="text-[10px] text-charcoal truncate">vasool hua</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/90 border border-soft-line text-left shadow-xs">
            <div className="text-[11px] text-slate font-medium truncate flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-600" /> {t.campaignSpend}
            </div>
            <div className="text-base sm:text-lg font-google font-black text-obsidian mt-0.5">
              {formatRupee(campaignSpendVal)}
            </div>
            <div className="text-[10px] text-charcoal truncate">WhatsApp kharch</div>
          </div>
        </div>
      </div>

      {/* CENTRAL VOICE ORB (Prominent) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-sky/20 to-cloud border border-line shadow-feature text-center flex flex-col items-center relative overflow-hidden">
        <div className="relative mb-3 flex items-center justify-center">
          {/* Concentric pulsing rings */}
          <div className="absolute w-24 h-24 rounded-full border border-blue/40 animate-voice-ring-1 pointer-events-none" />
          <div className="absolute w-32 h-32 rounded-full border border-sky animate-voice-ring-2 pointer-events-none" />

          {/* Central Blue Mic Button */}
          <button
            onClick={onOpenVoice}
            className="w-20 h-20 rounded-full bg-blue hover:bg-[#1a85b9] text-white flex items-center justify-center shadow-feature transition-transform transform active:scale-95 cursor-pointer relative z-10 shadow-glow-blue"
            aria-label="Bolke poochhein"
          >
            <Mic className="w-9 h-9" />
          </button>
        </div>

        <h3 className="text-base font-google font-black text-obsidian tracking-tight">
          {t.voiceOrbCaption}
        </h3>
        <p className="text-xs text-charcoal mt-1 max-w-xs font-sans">
          Type karne ki zaroorat nahi — seedha Hindi, Marathi ya Hinglish mein bolein
        </p>

        {/* Live Audio Assistant pill */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-line text-[11px] font-google font-bold text-blue shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Vyom Copilot Engine Online</span>
        </div>
      </div>

      {/* "Vyom ne kuch dhoonda hai" (Opportunities to Approve) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-google font-black text-obsidian tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue" />
              {t.opportunitiesTitle}
            </h2>
            <p className="text-xs text-charcoal font-sans">{t.opportunitiesSubtitle}</p>
          </div>
          <button
            onClick={() => onNavigateToTab('opportunities')}
            className="text-xs font-google font-bold text-blue hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Sabhi ({activeOpportunities.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontally swipeable cards */}
        {activeOpportunities.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0">
            {activeOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="w-72 sm:w-80 flex-shrink-0 bg-white rounded-3xl p-4 sm:p-5 border border-line shadow-feature flex flex-col justify-between hover:border-blue transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
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
                      <div className="text-[10px] text-slate font-medium">Bikri Mauka</div>
                      <div className="text-base sm:text-lg font-google font-black text-blue">
                        {formatRupee(opp.potentialRevenue)}
                      </div>
                    </div>
                  </div>

                  <h3
                    onClick={() => onSelectOpportunity(opp)}
                    className="font-google font-extrabold text-sm sm:text-base text-obsidian leading-snug line-clamp-2 cursor-pointer hover:text-blue transition-colors"
                  >
                    {opp.title[lang] || opp.title.hinglish}
                  </h3>

                  <p className="text-xs text-charcoal mt-1 line-clamp-2 leading-relaxed font-sans">
                    {opp.description[lang] || opp.description.hinglish}
                  </p>
                </div>

                {/* Card Action Buttons: Big "Haan ✓" and "Baad mein" */}
                <div className="mt-4 pt-3 border-t border-soft-line flex items-center gap-2">
                  <button
                    onClick={() => onSelectOpportunity(opp)}
                    className="flex-1 py-2.5 px-2 rounded-xl border border-line text-xs font-google font-bold text-charcoal hover:bg-cloud transition cursor-pointer text-center"
                  >
                    {t.laterBtn}
                  </button>

                  <button
                    onClick={() => onQuickApproveOpportunity(opp)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue hover:bg-blue/90 text-white text-xs font-google font-black shadow-button flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.approveBtn}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-cloud border border-line text-center text-xs text-charcoal font-sans">
            Sabhi mauke approve ho chuke hain! Naye transactions aate hi Vyom naye mauke dhoondega.
          </div>
        )}
      </div>

      {/* Autonomous Udhaar Auto-Pilot Strip */}
      <div
        onClick={() => onNavigateToTab('udhaar')}
        className="p-4 rounded-3xl bg-sky/30 border border-sky/70 hover:border-blue transition cursor-pointer flex items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white border border-sky flex items-center justify-center text-blue font-bold flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-obsidian truncate">
                {udhaarStrip?.recommendedAction || t.autonomousStrip}
              </span>
              {udhaarStrip && udhaarStrip.overdueCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                  {udhaarStrip.overdueCount} Overdue
                </span>
              )}
            </div>
            <div className="text-[11px] text-charcoal mt-0.5">
              <span className="font-semibold text-blue">{t.autonomousTag}</span> • {udhaarStrip ? `${formatRupee(udhaarStrip.totalOutstanding)} baaki hisaab` : 'WhatsApp link through Paytm'}
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-blue flex-shrink-0" />
      </div>

      {/* Today's Sales Mini Sparkline vs Yesterday */}
      <div className="p-4 rounded-3xl bg-white border border-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-charcoal uppercase tracking-wider">
              {t.todaySales}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-obsidian tracking-tight">
                {formatRupee(todaySalesVal)}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {salesDelta >= 0 ? `+${formatRupee(salesDelta)} zyada` : t.salesComparison}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-slate">
            <div>Kal: {formatRupee(yesterdaySalesVal)}</div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              {metrics ? `${metrics.todayOrders} Orders Total` : '+₹540 zyada'}
            </div>
          </div>
        </div>

        {/* Mini hourly area chart */}
        <div className="h-28 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2597d0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2597d0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8b8b8b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [formatRupee(Number(val)), 'Sales']}
                contentStyle={{
                  backgroundColor: '#070709',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '11px',
                }}
              />
              <Area
                type="monotone"
                dataKey="today"
                stroke="#2597d0"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#todayGrad)"
              />
              <Area
                type="monotone"
                dataKey="yesterday"
                stroke="#8b8b8b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate pt-1 border-t border-soft-line">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-blue rounded-full" /> Aaj (Solid)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate rounded-full border-dashed" /> Kal (Dashed)
          </span>
          <span className="text-blue font-semibold">Peak 6 PM – 8 PM</span>
        </div>
      </div>
    </div>
  );
};
