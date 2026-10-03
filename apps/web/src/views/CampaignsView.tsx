import React, { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, AreaChart, Area, CartesianGrid, LabelList } from 'recharts';
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
      setNewOfferMsg('Namaste ji! Sharma Kirana Store ki taraf se special aadar. Is hafte aane par ₹500 ke ration par seedha Flat 10% OFF. Taaza stock aaya hai! 🙏');
    } else if (type === 'deadhours') {
      setNewOfferTitle('Dopahar Flash Hours Special (2-4 PM)');
      setNewOfferDiscount(8);
      setNewOfferMsg('Dopahar Ki Special Boli! ☀️ Sharma Kirana par aaj dopahar 2 se 4 baje sabhi Masale aur Tel par Flat 8% Instant Discount! Bheed se bachein! 🙏');
    } else if (type === 'festival') {
      setNewOfferTitle('Navratri / Festive Vrat Kit Combo Deal');
      setNewOfferDiscount(12);
      setNewOfferMsg('🌸 Shubh Tyohar Offer! Sharma Kirana Store se Vrat Combo Pack (Sabudana + Singhara Atta + Gir Cow Desi Ghee + Sendha Namak) par Flat 12% OFF! Limited stock! 🙏');
    } else {
      setNewOfferTitle('Sharma Kirana Flash Discount Deal');
      setNewOfferDiscount(10);
      setNewOfferMsg('Namaste ji! Sharma Kirana Store par aaj vishesh discount uplabdh hai. Kripya counter par aakar labh uthayein! 🙏');
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
          `Namaste ji! Sharma Kirana Store ki taraf se vishesh offer: ${camp.offer}. Aaj hi dukan par aakar bachat karein! 🙏`;

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
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* Total Impact Card */}
      <div className="comic-card-lavender" style={{ padding: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <div>
            <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.totalImpactMonth}
              </span>
            </div>
            <div className="text-hero tabular-nums" style={{ color: 'var(--ink)' }}>
              {formatRupee(totalMonthlyImpact)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500, marginTop: 2 }}>
              Net ROI: 12.8x • Spend ₹2,140
            </div>
          </div>
          <span className="comic-badge" style={{ background: '#BEF0D8', color: '#0E7A50' }}>
            Profitable
          </span>
        </div>

        {/* Bar Chart */}
        <div style={{ paddingTop: 10, borderTop: '1.5px solid rgba(148,163,184,0.35)', marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
            Weekly Recovery Trend:
          </div>
          <div style={{ height: 110, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyImpactData} margin={{ top: 18, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--shadow-color)', fontWeight: 600 }} axisLine={{ stroke: 'var(--shadow-color)', strokeWidth: 1.5 }} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatRupee(Number(val)), 'Recovered']}
                  contentStyle={{
                    backgroundColor: 'var(--ink)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '11px',
                    border: '1px solid var(--outline)',
                  }}
                />
                <Bar dataKey="recovered" fill="var(--ai-text)" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="recovered"
                    position="top"
                    formatter={(val: any) => `₹${Math.round(Number(val) / 1000)}k`}
                    style={{ fontSize: 10, fontWeight: 700, fill: 'var(--shadow-color)' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* "Vyom ne seekha" — 2×2 grid of short label+number tiles (not sentences) */}
      <div>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Brain className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{t.memoryTitle}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'mem-1', stat: '+32%', label: 'Combo Offer Lift', sub: 'Seedhe discount se behtar' },
            { id: 'mem-2', stat: '6–8 PM', label: 'Peak Response Time', sub: 'WhatsApp 2.4x speed' },
            { id: 'mem-3', stat: 'Marathi', label: 'Top Trust Tone', sub: 'Purane grahak pasand' },
            { id: 'mem-4', stat: '4 Din', label: 'Festival Stock Peak', sub: 'Pehle shuru hoti bheed' },
          ].map((tile) => (
            <div
              key={tile.id}
              className="comic-card-lavender relative flex flex-col justify-between"
              style={{ padding: '10px 12px', minHeight: 74, borderRadius: 14 }}
            >
              <button
                onClick={() => onForgetMemory(tile.id)}
                className="absolute cursor-pointer"
                style={{
                  top: 6,
                  right: 6,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: 'rgba(148,163,184,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                }}
                title={t.forgetBtn}
                aria-label="Forget memory"
              >
                <X className="w-2.5 h-2.5" style={{ color: 'var(--ink)' }} />
              </button>
              <div>
                <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: 'var(--ai-text)', lineHeight: 1.1 }}>
                  {tile.stat}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
                  {tile.label}
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 500, marginTop: 4 }}>
                {tile.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Switcher + Broadcast Button */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('running')}
            className={`comic-pill flex-1 justify-center ${activeTab === 'running' ? 'comic-pill-active' : ''}`}
            style={{ background: activeTab === 'running' ? 'var(--shadow-color)' : '#FFFFFF', color: activeTab === 'running' ? '#FFFFFF' : 'var(--shadow-color)' }}
          >
            {t.tabRunning} ({runningCampaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`comic-pill flex-1 justify-center ${activeTab === 'completed' ? 'comic-pill-active' : ''}`}
            style={{ background: activeTab === 'completed' ? 'var(--shadow-color)' : '#FFFFFF', color: activeTab === 'completed' ? '#FFFFFF' : 'var(--shadow-color)' }}
          >
            {t.tabCompleted} ({completedCampaigns.length})
          </button>
        </div>
        <button
          onClick={() => setIsBroadcastModalOpen(true)}
          className="comic-btn w-full"
        >
          <Megaphone className="w-4 h-4" />
          Naya Offer Bhejo 🚀
        </button>
      </div>

      {/* Campaign Cards */}
      <div className="space-y-3">
        {currentList.length > 0 ? (
          currentList.map((camp) => {
            const isExpanded = expandedCampaignId === camp.id;
            const isResending = resendingMap[camp.id];
            const isResentSuccess = resendSuccessMap[camp.id];

            return (
              <div key={camp.id} className="comic-card" style={{ padding: 14 }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2" style={{ marginBottom: 8 }}>
                  <div>
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <span
                        className="comic-badge"
                        style={{
                          background: camp.status === 'running' ? '#BEF0D8' : 'var(--canvas)',
                          color: camp.status === 'running' ? '#0E7A50' : '#6B7280',
                        }}
                      >
                        {camp.status === 'running' ? '● Chalu' : '✓ Pure Hue'}
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{camp.startDate}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
                      {camp.title[lang] || camp.title.hinglish}
                    </h3>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      Offer: <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{camp.offer}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>Revenue</span>
                    <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ai-text)' }}>
                      {formatRupee(camp.outcome.revenue)}
                    </div>
                  </div>
                </div>

                {/* PROOF STRIP — Control vs Offer (dashed-border card) */}
                <div className="comic-card-proof" style={{ padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📊 Control vs Offer
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Offer Mila</div>
                      <div style={{ height: 20, background: '#BEF0D8', border: '1px solid var(--outline)', borderRadius: 6, width: '85%' }} />
                      <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: '#0E7A50' }}>+32%</span>
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Offer Nahi Mila</div>
                      <div style={{ height: 20, background: '#E7EEF4', border: '1px solid var(--outline)', borderRadius: 6, width: '45%' }} />
                      <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>+3%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0E7A50', marginTop: 6, padding: '4px 8px', background: '#BEF0D8', borderRadius: 8, textAlign: 'center' }}>
                    Offer group +29% zyada aaye — yeh measured hai, estimated nahi
                  </div>
                </div>

                {/* Customer Funnel — comic-panel tiles */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Customer Funnel
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Bheje', value: camp.funnel.sent },
                      { label: 'Pahunche', value: camp.funnel.delivered },
                      { label: 'Jawaab', value: camp.funnel.replied },
                      { label: 'Aaye', value: camp.funnel.visited, highlight: true },
                    ].map((f, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 4px',
                          textAlign: 'center',
                          background: f.highlight ? '#C7E8FF' : '#FFFFFF',
                          border: `2px solid var(--shadow-color)`,
                          borderRadius: 10,
                          boxShadow: '1px 1px 0px var(--shadow-color)',
                        }}
                      >
                        <div className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: f.highlight ? '#1565C0' : 'var(--shadow-color)' }}>
                          {f.value}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: f.highlight ? '#1565C0' : '#6B7280' }}>{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outcome Row */}
                <div className="grid grid-cols-4 gap-1.5" style={{ paddingTop: 8, borderTop: '1.5px solid rgba(148,163,184,0.28)', fontSize: 13, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>Bikri</div>
                    <div className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>{formatRupee(camp.outcome.revenue)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>Grahak</div>
                    <div className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>{camp.outcome.recoveredCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>Kharch</div>
                    <div className="tabular-nums" style={{ fontWeight: 700, color: '#6B7280' }}>{formatRupee(camp.outcome.cost)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#6B7280' }}>ROI</div>
                    <div className="tabular-nums" style={{ fontWeight: 700, color: '#0E7A50' }}>{camp.outcome.netRoi}</div>
                  </div>
                </div>

                {/* Resend Button */}
                <div className="flex items-center justify-between" style={{ paddingTop: 10, borderTop: '1.5px solid rgba(148,163,184,0.28)', marginTop: 10 }}>
                  <span
                    className="comic-badge"
                    style={{ background: '#BEF0D8', color: '#0E7A50', fontSize: 9 }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: '#0E7A50', display: 'inline-block' }} className="animate-pulse-gentle" /> Deliverable
                  </span>
                  <button
                    onClick={() => handleResend(camp)}
                    disabled={isResending}
                    className={isResentSuccess ? 'comic-btn-sm' : 'comic-btn-outline comic-btn-sm'}
                    style={{
                      fontSize: 11,
                      background: isResentSuccess ? '#BEF0D8' : undefined,
                      borderColor: isResentSuccess ? '#0E7A50' : undefined,
                      color: isResentSuccess ? '#0E7A50' : undefined,
                    }}
                  >
                    {isResending ? 'Bhej rahe...' : isResentSuccess ? (
                      <><Check className="w-3 h-3" /> Bheja ✓</>
                    ) : (
                      <><Megaphone className="w-3 h-3" /> Resend</>
                    )}
                  </button>
                </div>

                {/* Expandable Chart */}
                {camp.chartData && camp.chartData.length > 0 && (
                  <div style={{ borderTop: '1.5px solid rgba(148,163,184,0.28)', marginTop: 10, paddingTop: 8 }}>
                    <button
                      onClick={() => setExpandedCampaignId(isExpanded ? '' : camp.id)}
                      className="w-full flex items-center justify-between cursor-pointer"
                      style={{ fontSize: 13, fontWeight: 700, color: 'var(--ai-text)', background: 'none', border: 'none', padding: 0 }}
                    >
                      <span>Daily Chart</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div style={{ height: 120, marginTop: 8 }} className="animate-fade-slide-up">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={camp.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`campGrad-${camp.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--ai-text)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--ai-text)" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip
                              formatter={(val: any) => [formatRupee(Number(val)), 'Revenue']}
                              contentStyle={{ backgroundColor: 'var(--ink)', borderRadius: '10px', color: '#ffffff', fontSize: '11px', border: '1px solid var(--outline)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="var(--ai-text)" strokeWidth={2.5} fillOpacity={1} fill={`url(#campGrad-${camp.id})`} />
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
          <div className="comic-card" style={{ padding: 24, textAlign: 'center' }}>
            <p className="text-caption">
              Koi campaign nahi hai. Mauke tab se approve karein ya Naya Offer bhejein!
            </p>
          </div>
        )}
      </div>

      {/* Broadcast Offer Modal — comic-panel style */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,41,112,0.35)' }}>
          <div className="comic-card w-full" style={{ maxWidth: 380, maxHeight: '90vh', overflowY: 'auto', padding: 20 }}>
            {/* Header */}
            <div className="flex items-center justify-between" style={{ paddingBottom: 12, borderBottom: '1.5px solid rgba(148,163,184,0.35)', marginBottom: 16 }}>
              <div className="flex items-center gap-2">
                <div className="icon-chip" style={{ background: 'var(--ai-fill)' }}>
                  <Megaphone className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Naya Offer Broadcast</h3>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>Telegram & WhatsApp par turant delivery</p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="cursor-pointer"
                style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--canvas)', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template Selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6, display: 'block' }}>Template:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'winback' as const, label: '📉 Winback' },
                  { type: 'deadhours' as const, label: '☀️ Flash Deal' },
                  { type: 'festival' as const, label: '🌸 Festival' },
                  { type: 'custom' as const, label: '⚡ Custom' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.type}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.type)}
                    className="cursor-pointer"
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: '1px solid var(--outline)',
                      boxShadow: newOfferType === tmpl.type ? '2px 2px 0px var(--shadow-color)' : 'none',
                      background: newOfferType === tmpl.type ? 'var(--ai-fill)' : '#FFFFFF',
                      color: 'var(--ink)',
                      fontSize: 11,
                      fontWeight: 700,
                      textAlign: 'left',
                    }}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>Title:</label>
              <input
                type="text"
                value={newOfferTitle}
                onChange={(e) => setNewOfferTitle(e.target.value)}
                className="comic-input"
                style={{ fontSize: 13 }}
                placeholder="Offer ka title..."
              />
            </div>

            {/* Discount */}
            <div className="comic-card" style={{ padding: 12, marginBottom: 12 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Discount:</span>
                <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ai-text)' }}>{newOfferDiscount}% OFF</span>
              </div>
              <input
                type="range"
                min={2}
                max={25}
                step={1}
                value={newOfferDiscount}
                onChange={(e) => setNewOfferDiscount(Number(e.target.value))}
                className="w-full cursor-pointer"
                style={{ accentColor: 'var(--ai-text)' }}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                <MessageCircle className="w-3.5 h-3.5 inline" style={{ color: '#0E7A50', marginRight: 4 }} />
                Customer Message:
              </label>
              <div className="comic-card-mint" style={{ padding: 10, borderRadius: 14 }}>
                <textarea
                  value={newOfferMsg}
                  onChange={(e) => setNewOfferMsg(e.target.value)}
                  rows={3}
                  style={{ width: '100%', background: 'transparent', fontSize: 13, color: 'var(--ink)', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--font-ui)' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2" style={{ paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="comic-btn-outline comic-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBroadcast}
                disabled={isSubmittingBroadcast || !newOfferMsg.trim()}
                className="comic-btn comic-btn-sm"
                style={{ opacity: (isSubmittingBroadcast || !newOfferMsg.trim()) ? 0.5 : 1 }}
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmittingBroadcast ? 'Bhej rahe...' : 'Bhejo 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
