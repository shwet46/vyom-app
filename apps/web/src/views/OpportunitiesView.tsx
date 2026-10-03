import React, { useState } from 'react';
import {
  Filter,
  Sparkles,
  Check,
  ChevronRight,
  TrendingUp,
  Users,
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
} from '../components/icons';
import { Language, Opportunity, OpportunityType } from '../types';
import { formatRupee } from '../utils/formatters';
import { translations } from '../utils/i18n';

interface OpportunitiesViewProps {
  lang: Language;
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onQuickApproveOpportunity: (opp: Opportunity) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  lang,
  opportunities,
  onSelectOpportunity,
  onQuickApproveOpportunity,
}) => {
  const t = translations[lang] || translations.hinglish;
  const [activeFilter, setActiveFilter] = useState<'all' | OpportunityType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filterChips: { id: 'all' | OpportunityType; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'winback', label: t.filterWinback },
    { id: 'deadhours', label: t.filterDeadHours },
    { id: 'festival', label: t.filterFestival },
  ];

  const activeOpps = opportunities.filter((o) => o.status === 'new');
  const filtered = activeOpps.filter((o) => {
    if (activeFilter === 'all') return true;
    return o.type === activeFilter;
  });

  const totalPotential = activeOpps.reduce((sum, o) => sum + o.potentialRevenue, 0);

  // Evidence chip data per opportunity type
  const getEvidenceChips = (opp: Opportunity) => {
    const chips: { icon: string; text: string; detail: string }[] = [];
    if (opp.type === 'winback') {
      chips.push(
        { icon: '📅', text: '7 din ka pattern', detail: 'Yeh customers 7+ din se nahi aaye' },
        { icon: '📉', text: 'Avg ₹480/visit chhoota', detail: 'In customers ki average visit value ₹480 thi' },
      );
    } else if (opp.type === 'deadhours') {
      chips.push(
        { icon: '☀️', text: 'Dopahar 2-4 PM suni', detail: 'Is time footfall 60% kam hai' },
        { icon: '📊', text: 'Peer stores mein nahi', detail: 'Aas-paas ki dukaanon mein yeh pattern nahi hai' },
      );
    } else if (opp.type === 'festival') {
      chips.push(
        { icon: '🎉', text: 'Navratri 11 din door', detail: 'Navratri demand ka peak aane wala hai' },
        { icon: '📦', text: 'Stock align karein', detail: 'Vrat items ki demand 3x hoti hai' },
      );
    } else {
      chips.push(
        { icon: '📉', text: 'Sales giraa hua', detail: 'Pichle hafte se 18% ki giravat' },
        { icon: '👥', text: `${opp.customerCount} grahak`, detail: 'In customers tak pehle jayen' },
      );
    }
    chips.push(
      { icon: '💰', text: `ROI ${opp.expectedRoi}`, detail: `Estimated return on ₹${opp.estimatedCost} spend` },
    );
    return chips;
  };

  return (
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* Sticky Header: Kul Recovery Potential — lavender comic-panel strip */}
      <div
        className="comic-card-lavender"
        style={{
          padding: '14px 16px',
          position: 'sticky',
          top: 58,
          zIndex: 10,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kul Recovery Potential
              </span>
            </div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
              {formatRupee(totalPotential)}
            </div>
          </div>
          <span
            className="comic-badge"
            style={{ background: '#BEF0D8', color: '#0E7A50' }}
          >
            {activeOpps.length} Mauke
          </span>
        </div>
      </div>

      {/* Peer Compare at top of Mauke */}
      <div className="comic-card-sky" style={{ padding: 14, position: 'relative' }}>
        <div
          className="comic-badge"
          style={{
            position: 'absolute',
            top: -10,
            right: 12,
            background: '#FFFFFF',
            color: '#1565C0',
            fontSize: 9,
          }}
        >
          Sirf Paytm Data Se Possible
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          📊 Peer Compare
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Aapki Dukaan</div>
            <div style={{ height: 16, background: '#FFE4B8', border: '1px solid var(--outline)', borderRadius: 5, width: '62%' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B5610E' }}>-18%</span>
          </div>
          <div className="flex-1">
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>Aas-paas</div>
            <div style={{ height: 16, background: '#BEF0D8', border: '1px solid var(--outline)', borderRadius: 5, width: '88%' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0E7A50' }}>-4%</span>
          </div>
        </div>
      </div>

      {/* Filter Pills — pill-shaped, comic shadow, active = ink-filled */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar" style={{ paddingBottom: 2 }}>
        {filterChips.map((chip) => {
          const isSelected = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`comic-pill ${isSelected ? 'comic-pill-active' : ''}`}
              style={{
                background: isSelected ? 'var(--shadow-color)' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : 'var(--shadow-color)',
                whiteSpace: 'nowrap',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Opportunity Cards */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((opp) => {
            const chips = getEvidenceChips(opp);
            const isExpanded = expandedId === opp.id;

            return (
              <div key={opp.id} className="comic-card" style={{ padding: 14 }}>
                {/* Badge + Title Row */}
                <div className="flex items-start justify-between gap-2" style={{ marginBottom: 6 }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 4 }}>
                      <span
                        className="comic-badge"
                        style={{ background: 'var(--ai-fill)', color: 'var(--ai-text)', fontSize: 9 }}
                      >
                        {opp.type === 'winback'
                          ? 'Win-back'
                          : opp.type === 'deadhours'
                          ? 'Dead hours'
                          : opp.type === 'festival'
                          ? 'Festival'
                          : 'Sales drop'}
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Users className="w-3 h-3" /> {opp.customerCount} customers
                      </span>
                    </div>
                    <h3
                      onClick={() => onSelectOpportunity(opp)}
                      className="cursor-pointer"
                      style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}
                    >
                      {opp.title[lang] || opp.title.hinglish}
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="tabular-nums" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ai-text)' }}>
                      {formatRupee(opp.potentialRevenue)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0E7A50' }}>ROI: {opp.expectedRoi}</div>
                  </div>
                </div>

                {/* Rule-Tag Evidence Chips (collapsed) */}
                <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 8 }}>
                  {chips.map((chip, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 8,
                        background: 'var(--canvas)',
                        border: '1.5px solid rgba(148,163,184,0.35)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--ink)',
                      }}
                    >
                      {chip.icon} {chip.text}
                    </span>
                  ))}
                </div>

                {/* "Kyun?" expand button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                  className="flex items-center gap-1 cursor-pointer"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--ai-text)',
                    marginBottom: isExpanded ? 8 : 10,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  Kyun? <ChevronDown className="w-3.5 h-3.5" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Expanded evidence detail */}
                {isExpanded && (
                  <div className="space-y-2 animate-fade-slide-up" style={{ marginBottom: 10 }}>
                    {chips.map((chip, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 10px',
                          background: 'var(--canvas)',
                          border: '1.5px solid rgba(148,163,184,0.28)',
                          borderRadius: 10,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{chip.icon} {chip.text}</div>
                        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{chip.detail}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2" style={{ paddingTop: 10, borderTop: '1.5px solid rgba(148,163,184,0.28)' }}>
                  <button
                    onClick={() => onSelectOpportunity(opp)}
                    className="comic-btn-outline comic-btn-sm"
                    style={{ fontSize: 13 }}
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onQuickApproveOpportunity(opp)}
                    className="comic-btn comic-btn-sm"
                    style={{ fontSize: 13 }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Haan, chalao
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="comic-card" style={{ padding: 24, textAlign: 'center' }}>
          <div className="icon-chip" style={{ width: 40, height: 40, margin: '0 auto 8px', background: 'var(--ai-fill)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--ai-text)' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Koi naya mauka baki nahi hai</h3>
          <p className="text-caption" style={{ maxWidth: 240, margin: '4px auto 0' }}>
            Aapne sabhi mauke check kar liye hain ya filter ke mutabiq koi entry nahi hai.
          </p>
        </div>
      )}
    </div>
  );
};
