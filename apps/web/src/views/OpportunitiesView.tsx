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

  const filterChips: { id: 'all' | OpportunityType; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'winback', label: t.filterWinback },
    { id: 'deadhours', label: t.filterDeadHours },
    { id: 'festival', label: t.filterFestival },
    { id: 'falling', label: t.filterFalling },
  ];

  const activeOpps = opportunities.filter((o) => o.status === 'new');
  const filtered = activeOpps.filter((o) => {
    if (activeFilter === 'all') return true;
    return o.type === activeFilter;
  });

  const totalPotential = activeOpps.reduce((sum, o) => sum + o.potentialRevenue, 0);

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky/50 to-cloud border border-line shadow-feature flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-google font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue" />
            Vyom AI Opportunity Radar
          </div>
          <h1 className="text-xl sm:text-2xl font-google font-black text-obsidian tracking-tight mt-1">
            Bikri Badhane Ke Mauke
          </h1>
          <p className="text-xs text-charcoal mt-0.5 font-lora italic">
            Dukaan par jo paisa silent leak ho raha hai, use wapas layein
          </p>
        </div>

        <div className="bg-white/95 p-3.5 rounded-2xl border border-line flex sm:flex-col justify-between items-center sm:items-end shadow-xs">
          <span className="text-[11px] font-semibold text-slate font-sans">Kul Recovery Potential:</span>
          <span className="text-2xl font-google font-black text-blue">{formatRupee(totalPotential)}</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterChips.map((chip) => {
          const isSelected = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-blue text-white shadow-button'
                  : 'bg-cloud border border-line text-charcoal hover:text-obsidian hover:bg-slate-100'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((opp) => (
            <div
              key={opp.id}
              className="p-5 rounded-3xl bg-white border border-line shadow-feature hover:border-blue transition-all space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky text-blue">
                      {opp.type === 'winback'
                        ? 'Win-back'
                        : opp.type === 'deadhours'
                        ? 'Dead hours'
                        : opp.type === 'festival'
                        ? 'Festival'
                        : 'Sales drop'}
                    </span>
                    <span className="text-xs text-slate font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-charcoal" /> {opp.customerCount} customers
                    </span>
                  </div>
                  <h3
                    onClick={() => onSelectOpportunity(opp)}
                    className="font-extrabold text-base text-obsidian cursor-pointer hover:text-blue transition-colors leading-snug"
                  >
                    {opp.title[lang] || opp.title.hinglish}
                  </h3>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[11px] text-slate font-semibold">Anumanit Bikri</div>
                  <div className="text-xl font-black text-blue">{formatRupee(opp.potentialRevenue)}</div>
                  <div className="text-[10px] text-emerald-700 font-bold">ROI: {opp.expectedRoi}</div>
                </div>
              </div>

              <p className="text-xs text-charcoal leading-relaxed">
                {opp.description[lang] || opp.description.hinglish}
              </p>

              {/* Action buttons */}
              <div className="pt-2 border-t border-soft-line flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="text-xs font-bold text-charcoal hover:text-obsidian flex items-center gap-1 cursor-pointer py-1.5"
                >
                  <span>Khol Kar Dekhein (Details)</span>
                  <ChevronRight className="w-4 h-4 text-slate" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onQuickApproveOpportunity(opp)}
                    className="py-2.5 px-4 rounded-xl bg-blue hover:bg-blue/90 text-white text-xs font-extrabold shadow-button flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Haan, chalao</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 rounded-3xl bg-cloud border border-line text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-slate shadow-xs">
              <Sparkles className="w-6 h-6 text-blue" />
            </div>
            <h3 className="font-extrabold text-sm text-obsidian">Koi naya mauka baki nahi hai</h3>
            <p className="text-xs text-charcoal max-w-xs mx-auto">
              Aapne sabhi mauke check kar liye hain ya filter ke mutabiq koi entry nahi hai.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
