import React, { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area } from 'recharts';
import {
  Sparkles,
  Megaphone,
  CheckCircle2,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  IndianRupee,
  ArrowUpRight,
  Brain,
} from '../components/icons';
import { Campaign, Language, MemoryItem } from '../types';
import { formatRupee } from '../utils/formatters';
import { translations } from '../utils/i18n';
import { weeklyImpactData } from '../data/mockData';

interface CampaignsViewProps {
  lang: Language;
  campaigns: Campaign[];
  memories: MemoryItem[];
  onForgetMemory: (id: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  lang,
  campaigns,
  memories,
  onForgetMemory,
}) => {
  const t = translations[lang] || translations.hinglish;
  const [activeTab, setActiveTab] = useState<'running' | 'completed'>('running');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string>('camp-2');

  const runningCampaigns = campaigns.filter((c) => c.status === 'running');
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');

  const currentList = activeTab === 'running' ? runningCampaigns : completedCampaigns;

  const totalMonthlyImpact = campaigns.reduce((sum, c) => sum + c.outcome.revenue, 0);

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* Top Summary: Total Impact This Month Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-sky/40 via-cloud to-paper border border-line/70 shadow-feature space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-google font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue" />
              {t.totalImpactMonth}
            </span>
            <div className="text-3xl sm:text-4xl font-google font-black text-obsidian tracking-tight mt-1">
              {formatRupee(totalMonthlyImpact)}
            </div>
            <div className="text-xs text-charcoal font-medium mt-0.5 font-sans">
              Net ROI: 12.8x • WhatsApp spend ₹2,140 • <span className="font-sans font-medium text-blue">Paytm AI Tracked</span>
            </div>
          </div>
          <span className="text-xs font-google font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full shadow-xs">
            Profitable
          </span>
        </div>

        {/* Compact Bar Chart by Week */}
        <div className="pt-2 border-t border-soft-line">
          <div className="text-[11px] font-semibold text-slate mb-1">
            Weekly Recovery Trend (Bachat):
          </div>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyImpactData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8b8b8b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatRupee(Number(val)), 'Recovered']}
                  contentStyle={{
                    backgroundColor: '#070709',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="recovered" fill="#2597d0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* "Vyom ne seekha" (Shop Memory) Card */}
      <div className="p-4 rounded-2xl bg-white border border-line/70 shadow-feature space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue" />
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
              {t.memoryTitle}
            </h3>
          </div>
          <span className="text-[10px] text-slate font-medium">Click × to forget</span>
        </div>
        <p className="text-xs text-charcoal">{t.memorySub}</p>

        {/* Removable chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {memories.map((m) => (
            <div
              key={m.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cloud border border-line text-xs font-semibold text-ink group hover:border-slate transition"
            >
              <span>{m.text[lang] || m.text.hinglish}</span>
              <button
                onClick={() => onForgetMemory(m.id)}
                className="w-4 h-4 rounded-full bg-slate/20 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                title={t.forgetBtn}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs: Running / Completed */}
      <div className="flex items-center p-1 rounded-2xl bg-cloud border border-line">
        <button
          onClick={() => setActiveTab('running')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer font-google ${
            activeTab === 'running'
              ? 'bg-white text-blue shadow-xs font-extrabold'
              : 'text-charcoal hover:text-ink'
          }`}
        >
          {t.tabRunning} ({runningCampaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer font-google ${
            activeTab === 'completed'
              ? 'bg-white text-blue shadow-xs font-extrabold'
              : 'text-charcoal hover:text-ink'
          }`}
        >
          {t.tabCompleted} ({completedCampaigns.length})
        </button>
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-4">
        {currentList.length > 0 ? (
          currentList.map((camp) => {
            const isExpanded = expandedCampaignId === camp.id;

            return (
              <div
                key={camp.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-3.5 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          camp.status === 'running'
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : 'bg-cloud text-charcoal'
                        }`}
                      >
                        {camp.status === 'running' ? '● Chalu (Running)' : '✓ Pure Hue'}
                      </span>
                      <span className="text-[11px] text-slate font-medium">{camp.startDate}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-obsidian mt-1 leading-snug">
                      {camp.title[lang] || camp.title.hinglish}
                    </h3>
                    <div className="text-xs text-charcoal mt-0.5">
                      Offer: <span className="font-semibold text-ink">{camp.offer}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate font-semibold block">Total Revenue</span>
                    <span className="text-xl font-black text-blue">
                      {formatRupee(camp.outcome.revenue)}
                    </span>
                  </div>
                </div>

                {/* Progress Funnel: Sent → Delivered → Replied → Visited */}
                <div className="p-3 rounded-2xl bg-cloud border border-soft-line space-y-2">
                  <div className="text-[11px] font-bold text-charcoal uppercase tracking-wider">
                    Customer Funnel
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="p-2 rounded-xl bg-white border border-soft-line">
                      <div className="text-xs font-black text-ink">{camp.funnel.sent}</div>
                      <div className="text-[10px] text-slate">Bheje</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-soft-line">
                      <div className="text-xs font-black text-ink">{camp.funnel.delivered}</div>
                      <div className="text-[10px] text-slate">Pahunche</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-soft-line">
                      <div className="text-xs font-black text-ink">{camp.funnel.replied}</div>
                      <div className="text-[10px] text-slate">Jawaab Diya</div>
                    </div>
                    <div className="p-2 rounded-xl bg-sky/50 border border-blue">
                      <div className="text-xs font-black text-blue">{camp.funnel.visited}</div>
                      <div className="text-[10px] text-blue font-bold">Dukaan Aaye</div>
                    </div>
                  </div>
                </div>

                {/* ₹ Outcome Row */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-soft-line text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate">Bikri</div>
                    <div className="font-extrabold text-ink">{formatRupee(camp.outcome.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate">Grahak</div>
                    <div className="font-extrabold text-ink">{camp.outcome.recoveredCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate">Kharch</div>
                    <div className="font-extrabold text-charcoal">{formatRupee(camp.outcome.cost)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate">Net ROI</div>
                    <div className="font-extrabold text-emerald-700">{camp.outcome.netRoi}</div>
                  </div>
                </div>

                {/* Expand / Collapse Revenue Chart Toggle */}
                {camp.chartData && camp.chartData.length > 0 && (
                  <div className="border-t border-soft-line pt-2">
                    <button
                      onClick={() =>
                        setExpandedCampaignId(isExpanded ? '' : camp.id)
                      }
                      className="w-full flex items-center justify-between text-xs font-bold text-blue hover:underline py-1 cursor-pointer"
                    >
                      <span>Roz Ka Bikri Chart (Daily Breakdown)</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="h-36 w-full pt-3 animate-in fade-in">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={camp.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`campGrad-${camp.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2597d0" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#2597d0" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8b8b8b' }} axisLine={false} tickLine={false} />
                            <Tooltip
                              formatter={(val: any) => [formatRupee(Number(val)), 'Revenue']}
                              contentStyle={{
                                backgroundColor: '#070709',
                                borderRadius: '12px',
                                color: '#ffffff',
                                fontSize: '11px',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#2597d0"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill={`url(#campGrad-${camp.id})`}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-3xl bg-cloud border border-line text-center text-xs text-charcoal">
            Koi campaign nahi hai. Mauke tab se approve karein!
          </div>
        )}
      </div>
    </div>
  );
};
