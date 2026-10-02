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
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky/50 via-cloud to-paper border border-line/70 shadow-feature flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-google font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue" />
            Vyom AI Opportunity Radar
          </div>
          <h1 className="text-xl sm:text-2xl font-google font-black text-obsidian tracking-tight mt-0.5">
            Bikri Badhane Ke Mauke
          </h1>
          <p className="text-xs text-charcoal mt-0.5 font-sans">
            Dukaan par jo paisa silent leak ho raha hai, use wapas layein
          </p>
        </div>

        <div className="bg-white/95 px-4 py-2.5 rounded-xl border border-line/60 flex sm:flex-col justify-between items-center sm:items-end shadow-xs">
          <span className="text-[10px] font-semibold text-slate font-sans uppercase tracking-wider">Kul Recovery Potential</span>
          <span className="text-xl sm:text-2xl font-google font-black text-blue">{formatRupee(totalPotential)}</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {filterChips.map((chip) => {
          const isSelected = activeFilter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer font-google ${
                isSelected
                  ? 'bg-blue text-white shadow-button'
                  : 'bg-cloud border border-line/70 text-charcoal hover:text-obsidian hover:bg-slate-100'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Opportunities Grid: Responsive 2-column on md+ */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature hover:border-blue/50 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky text-blue font-google">
                      {opp.type === 'winback'
                        ? 'Win-back'
                        : opp.type === 'deadhours'
                        ? 'Dead hours'
                        : opp.type === 'festival'
                        ? 'Festival'
                        : 'Sales drop'}
                    </span>
                    <span className="text-xs text-slate font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate" /> {opp.customerCount} customers
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm sm:text-base font-black text-blue font-google">
                      {formatRupee(opp.potentialRevenue)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">ROI: {opp.expectedRoi}</div>
                  </div>
                </div>

                <h3
                  onClick={() => onSelectOpportunity(opp)}
                  className="font-google font-extrabold text-sm sm:text-base text-obsidian cursor-pointer group-hover:text-blue transition-colors leading-snug line-clamp-2"
                >
                  {opp.title[lang] || opp.title.hinglish}
                </h3>

                <p className="text-xs text-charcoal leading-relaxed line-clamp-3 font-sans">
                  {opp.description[lang] || opp.description.hinglish}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2.5 border-t border-soft-line flex items-center justify-between gap-2 mt-auto">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="text-xs font-bold text-charcoal hover:text-obsidian flex items-center gap-0.5 cursor-pointer py-1 font-google"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate" />
                </button>

                <button
                  onClick={() => onQuickApproveOpportunity(opp)}
                  className="py-2 px-3.5 rounded-xl bg-blue hover:bg-blue-dark text-white text-xs font-extrabold shadow-button flex items-center gap-1.5 transition cursor-pointer font-google"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Haan, chalao</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-cloud border border-line/60 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-white mx-auto flex items-center justify-center text-slate shadow-xs">
            <Sparkles className="w-5 h-5 text-blue" />
          </div>
          <h3 className="font-extrabold text-sm text-obsidian font-google">Koi naya mauka baki nahi hai</h3>
          <p className="text-xs text-charcoal max-w-xs mx-auto font-sans">
            Aapne sabhi mauke check kar liye hain ya filter ke mutabiq koi entry nahi hai.
          </p>
        </div>
      )}
    </div>
  );
};
