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
  Send,
  Check,
  MessageCircle,
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
  onBroadcastNewOffer?: (title: string, message: string, discount: number, type: string) => Promise<void>;
  onResendCampaign?: (
    campaignId: string,
    payload?: {
      title?: string;
      offer?: string;
      custom_message?: string;
      campaign_type?: string;
      discount_percent?: number;
    }
  ) => Promise<void>;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  lang,
  campaigns,
  memories,
  onForgetMemory,
  onBroadcastNewOffer,
  onResendCampaign,
}) => {
  const t = translations[lang] || translations.hinglish;
  const [activeTab, setActiveTab] = useState<'running' | 'completed'>('running');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string>('camp-2');

  // Broadcast Offer Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [newOfferType, setNewOfferType] = useState<'winback' | 'deadhours' | 'festival' | 'custom'>('winback');
  const [newOfferTitle, setNewOfferTitle] = useState('23 purane regular customers ke liye special offer');
  const [newOfferMsg, setNewOfferMsg] = useState(
    'Namaste ji! Sharma Kirana Store ki taraf se special aadar. Is hafte aane par ₹500 ke ration par seedha Flat 10% OFF. Taaza stock aaya hai! 🙏'
  );
  const [newOfferDiscount, setNewOfferDiscount] = useState<number>(10);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [resendingMap, setResendingMap] = useState<Record<string, boolean>>({});
  const [resendSuccessMap, setResendSuccessMap] = useState<Record<string, boolean>>({});

  const runningCampaigns = campaigns.filter((c) => c.status === 'running');
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');

  const currentList = activeTab === 'running' ? runningCampaigns : completedCampaigns;

  const totalMonthlyImpact = campaigns.reduce((sum, c) => sum + c.outcome.revenue, 0);

  const handleSelectTemplate = (type: 'winback' | 'deadhours' | 'festival' | 'custom') => {
    setNewOfferType(type);
    if (type === 'winback') {
      setNewOfferTitle('23 purane regular customers ke liye special offer');
      setNewOfferDiscount(10);
      setNewOfferMsg(
        'Namaste ji! Sharma Kirana Store ki taraf se special aadar. Is hafte aane par ₹500 ke ration par seedha Flat 10% OFF. Taaza stock aaya hai! 🙏'
      );
    } else if (type === 'deadhours') {
      setNewOfferTitle('Dopahar Flash Hours Special (2-4 PM)');
      setNewOfferDiscount(8);
      setNewOfferMsg(
        'Dopahar Ki Special Boli! ☀️ Sharma Kirana par aaj dopahar 2 se 4 baje sabhi Masale aur Tel par Flat 8% Instant Discount! Bheed se bachein! 🙏'
      );
    } else if (type === 'festival') {
      setNewOfferTitle('Navratri / Festive Vrat Kit Combo Deal');
      setNewOfferDiscount(12);
      setNewOfferMsg(
        '🌸 Shubh Tyohar Offer! Sharma Kirana Store se Vrat Combo Pack (Sabudana + Singhara Atta + Gir Cow Desi Ghee + Sendha Namak) par Flat 12% OFF! Limited stock! 🙏'
      );
    } else {
      setNewOfferTitle('Sharma Kirana Flash Discount Deal');
      setNewOfferDiscount(10);
      setNewOfferMsg(
        'Namaste ji! Sharma Kirana Store par aaj vishesh discount uplabdh hai. Kripya counter par aakar labh uthayein! 🙏'
      );
    }
  };

  const handleSubmitBroadcast = async () => {
    if (!newOfferMsg.trim() || isSubmittingBroadcast) return;
    setIsSubmittingBroadcast(true);
    try {
      if (onBroadcastNewOffer) {
        await onBroadcastNewOffer(newOfferTitle, newOfferMsg, newOfferDiscount, newOfferType);
      }
      setIsBroadcastModalOpen(false);
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const handleResend = async (camp: Campaign) => {
    setResendingMap((prev) => ({ ...prev, [camp.id]: true }));
    try {
      if (onResendCampaign) {
        const campaignTitle = camp.title[lang] || camp.title.hinglish || 'Kirana Special Offer';
        const campaignMessage =
          camp.draftedMessage?.[lang] ||
          camp.draftedMessage?.hinglish ||
          camp.message ||
          (camp.id === 'camp-1'
            ? '☕ Monsoon Special Chai Combo! Sharma Kirana Store par Wagh Bakri Tea (500g) + Madhur Pure Sugar (1kg) ka combo sirf ₹240 mein (MRP ₹285, Save ₹45). Baarish ke mausam mein kadak chai ka aanand lein! Limited stock! 🙏'
            : camp.id === 'camp-2'
            ? 'Namaste ji! Sharma Kirana Store ki taraf se special aadar. Aap hamare vishwas-patra regular grahak hain. Is hafte ₹500+ ke ration par seedha Flat ₹50 Cash Discount. Naya taaza stock aa chuka hai, zaroor aayein! 🙏'
            : camp.id === 'camp-3'
            ? '🥨 Shaam Ki Chai & Namkeen Deal! Sharma Kirana par aaj shaam 5 se 8 baje koi bhi 2 Haldiram ya Bikaji namkeen packs lene par Flat 10% Instant Discount. Shaam ki chai ke saath snacks ka maza lein! 🙏'
            : `Namaste ji! Sharma Kirana Store ki taraf se vishesh offer: ${camp.offer}. Aaj hi dukan par aakar bachat karein! 🙏`);

        await onResendCampaign(camp.id, {
          title: campaignTitle,
          offer: camp.offer,
          custom_message: campaignMessage,
          campaign_type: camp.type,
        });
      }
      setResendSuccessMap((prev) => ({ ...prev, [camp.id]: true }));
      setTimeout(() => {
        setResendSuccessMap((prev) => ({ ...prev, [camp.id]: false }));
      }, 4000);
    } finally {
      setResendingMap((prev) => ({ ...prev, [camp.id]: false }));
    }
  };

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
              Net ROI: 12.8x • WhatsApp & Telegram Spend ₹2,140 • <span className="font-sans font-medium text-blue">Paytm AI Tracked</span>
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
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatRupee(Number(val)), 'Recovered']}
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="recovered" fill="#6366F1" radius={[6, 6, 0, 0]} />
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

      {/* Controls Bar: Tabs & Broadcast Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Tabs: Running / Completed */}
        <div className="flex items-center p-1 rounded-2xl bg-cloud border border-line flex-1">
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

        {/* Broadcast Offer Button */}
        <button
          onClick={() => setIsBroadcastModalOpen(true)}
          className="py-2.5 px-4 rounded-2xl bg-blue hover:bg-blue/90 text-white font-google font-extrabold text-xs flex items-center justify-center gap-2 shadow-button active:scale-[0.98] transition cursor-pointer shrink-0"
        >
          <Megaphone className="w-4 h-4" />
          <span>Naya Offer Bhejo 🚀</span>
        </button>
      </div>

      {/* Campaign Cards List */}
      <div className="space-y-4">
        {currentList.length > 0 ? (
          currentList.map((camp) => {
            const isExpanded = expandedCampaignId === camp.id;
            const isResending = resendingMap[camp.id];
            const isResentSuccess = resendSuccessMap[camp.id];

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

                {/* Campaign-Specific Customer Message Preview */}
                {(() => {
                  const displayMsg =
                    camp.draftedMessage?.[lang] ||
                    camp.draftedMessage?.hinglish ||
                    camp.message ||
                    (camp.id === 'camp-1'
                      ? '☕ Monsoon Special Chai Combo! Sharma Kirana Store par Wagh Bakri Tea (500g) + Madhur Pure Sugar (1kg) ka combo sirf ₹240 mein (MRP ₹285, Save ₹45). Baarish ke mausam mein kadak chai ka aanand lein! Limited stock! 🙏'
                      : camp.id === 'camp-2'
                      ? 'Namaste ji! Sharma Kirana Store ki taraf se special aadar. Aap hamare vishwas-patra regular grahak hain. Is hafte ₹500+ ke ration par seedha Flat ₹50 Cash Discount. Naya taaza stock aa chuka hai, zaroor aayein! 🙏'
                      : camp.id === 'camp-3'
                      ? '🥨 Shaam Ki Chai & Namkeen Deal! Sharma Kirana par aaj shaam 5 se 8 baje koi bhi 2 Haldiram ya Bikaji namkeen packs lene par Flat 10% Instant Discount. Shaam ki chai ke saath snacks ka maza lein! 🙏'
                      : `Namaste ji! Sharma Kirana Store ki taraf se vishesh offer: ${camp.offer}. Aaj hi dukan par aakar bachat karein! 🙏`);

                  return (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-cloud to-sky/20 border border-emerald-200/80 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Telegram & WhatsApp Message:</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-white/90 border border-emerald-200/80 px-2 py-0.5 rounded-full font-semibold">
                          Campaign Copy
                        </span>
                      </div>
                      <p className="text-xs text-obsidian/90 font-sans leading-relaxed bg-white/90 p-2.5 rounded-xl border border-soft-line">
                        "{displayMsg}"
                      </p>
                    </div>
                  );
                })()}

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

                {/* Telegram Bot Action & Delivery Row */}
                <div className="flex items-center justify-between pt-2 border-t border-soft-line flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Telegram Bot & WhatsApp par deliverable</span>
                  </div>

                  <button
                    onClick={() => handleResend(camp)}
                    disabled={isResending}
                    className={`px-3 py-1.5 rounded-xl font-google font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                      isResentSuccess
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-cloud hover:bg-sky/40 text-blue border border-line hover:border-blue'
                    }`}
                  >
                    {isResending ? (
                      <span>Bhej rahe hain...</span>
                    ) : isResentSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Telegram Bot Par Bheja Gaya ✓</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Telegram Bot Par Bhejo / Resend</span>
                      </>
                    )}
                  </button>
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
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip
                              formatter={(val: any) => [formatRupee(Number(val)), 'Revenue']}
                              contentStyle={{
                                backgroundColor: '#111827',
                                borderRadius: '12px',
                                color: '#ffffff',
                                fontSize: '11px',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#6366F1"
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
            Koi campaign nahi hai. Mauke tab se approve karein ya Naya Offer bhejein!
          </div>
        )}
      </div>

      {/* Broadcast Offer Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-line shadow-2xl p-5 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-soft-line pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue/10 flex items-center justify-center text-blue">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-google font-extrabold text-base text-obsidian">
                    Naya Offer Broadcast Bhejo
                  </h3>
                  <p className="text-[11px] text-slate">
                    Customer ke Telegram Bot aur WhatsApp par turant delivery
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-7 h-7 rounded-full bg-cloud hover:bg-slate/20 flex items-center justify-center text-charcoal cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-obsidian">Offer Template Chunein:</label>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('winback')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    newOfferType === 'winback'
                      ? 'bg-blue/10 border-blue text-blue'
                      : 'bg-cloud border-soft-line text-charcoal hover:border-slate'
                  }`}
                >
                  📉 Bikri Mein Kami (Winback)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('deadhours')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    newOfferType === 'deadhours'
                      ? 'bg-blue/10 border-blue text-blue'
                      : 'bg-cloud border-soft-line text-charcoal hover:border-slate'
                  }`}
                >
                  ☀️ Dopahar Flash Deal
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('festival')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    newOfferType === 'festival'
                      ? 'bg-blue/10 border-blue text-blue'
                      : 'bg-cloud border-soft-line text-charcoal hover:border-slate'
                  }`}
                >
                  🌸 Tyohar / Vrat Kit Offer
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('custom')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer ${
                    newOfferType === 'custom'
                      ? 'bg-blue/10 border-blue text-blue'
                      : 'bg-cloud border-soft-line text-charcoal hover:border-slate'
                  }`}
                >
                  ⚡ Custom Offer
                </button>
              </div>
            </div>

            {/* Offer Title Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-obsidian">Offer Title / Naam:</label>
              <input
                type="text"
                value={newOfferTitle}
                onChange={(e) => setNewOfferTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-cloud border border-line text-xs font-medium text-ink focus:outline-none focus:border-blue"
                placeholder="Offer ka title likhein..."
              />
            </div>

            {/* Discount Slider */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-cloud border border-line">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-obsidian">Discount Level (%):</span>
                <span className="font-black text-blue">{newOfferDiscount}% OFF</span>
              </div>
              <input
                type="range"
                min={2}
                max={25}
                step={1}
                value={newOfferDiscount}
                onChange={(e) => setNewOfferDiscount(Number(e.target.value))}
                className="w-full accent-blue cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate font-medium">
                <span>2% Minor</span>
                <span>10% Recommended</span>
                <span>25% Max</span>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-obsidian flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Proposed Customer Message:
                </label>
                <span className="text-[10px] text-slate font-medium">Aap edit kar sakte hain</span>
              </div>

              {/* Chat Bubble Representation */}
              <div className="p-3 rounded-2xl bg-[#e7f7e9] border border-emerald-200/80 shadow-xs relative">
                <textarea
                  value={newOfferMsg}
                  onChange={(e) => setNewOfferMsg(e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-xs text-ink leading-relaxed font-normal focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between mt-1 text-[10px] text-emerald-800 font-medium">
                  <span>Sharma Kirana Store • WhatsApp & Telegram Bot</span>
                  <span>Send dabate hi turant deliver hoga ✓✓</span>
                </div>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span>
                Yeh message Telegram Bot (`@vyom_customer_bot`) par customers ko turant interactive buttons ke saath bhej diya jayega.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-line text-xs font-bold text-charcoal hover:bg-cloud cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBroadcast}
                disabled={isSubmittingBroadcast || !newOfferMsg.trim()}
                className="py-2.5 px-5 rounded-xl bg-blue hover:bg-blue/90 text-white font-google font-extrabold text-xs flex items-center gap-2 shadow-button transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingBroadcast ? 'Bheja jaa raha hai...' : 'Customers Ko Bhejo 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
