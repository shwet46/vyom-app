import React from 'react';
import { ActivityFeedItem } from '../types';
import { formatRupee } from '../utils/formatters';
import { CheckCircle2, Clock, Send, Sparkles, TrendingUp } from './icons';

interface DesktopActivityFeedProps {
  items: ActivityFeedItem[];
}

export const DesktopActivityFeed: React.FC<DesktopActivityFeedProps> = ({ items }) => {
  return (
    <aside className="hidden lg:flex flex-col w-80 border-l border-soft-line bg-paper h-[calc(100vh-57px)] sticky top-[57px] p-4 flex-shrink-0">
      <div className="flex items-center justify-between pb-3 border-b border-soft-line">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="font-extrabold text-sm text-obsidian tracking-tight">Vyom Live Activity</h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-blue bg-sky px-2 py-0.5 rounded-full">
          Autonomous
        </span>
      </div>

      <p className="text-[11px] text-charcoal mt-2 mb-3 leading-relaxed">
        Paisa bachaane ke liye Vyom dwara pichle 24 ghante mein kiye gaye kaam:
      </p>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {items.map((item) => {
          let icon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
          let bg = 'bg-emerald-50 border-emerald-100';

          if (item.iconType === 'reminder') {
            icon = <Send className="w-4 h-4 text-blue" />;
            bg = 'bg-sky/40 border-sky';
          } else if (item.iconType === 'campaign') {
            icon = <TrendingUp className="w-4 h-4 text-purple-600" />;
            bg = 'bg-purple-50 border-purple-100';
          } else if (item.iconType === 'insight') {
            icon = <Sparkles className="w-4 h-4 text-amber-600" />;
            bg = 'bg-amber-50 border-amber-100';
          }

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border ${bg} transition-all hover:shadow-xs`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-white/80 flex-shrink-0 mt-0.5">{icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-obsidian truncate">{item.title}</span>
                    {item.amount && (
                      <span className="font-extrabold text-xs text-emerald-700 flex-shrink-0">
                        +{formatRupee(item.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-charcoal mt-0.5 leading-snug">{item.detail}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate mt-1.5 font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-soft-line mt-auto">
        <div className="p-2.5 rounded-xl bg-cloud text-[11px] text-charcoal flex items-center justify-between">
          <span>Silent leak protection</span>
          <span className="font-bold text-ink">Active 24/7</span>
        </div>
      </div>
    </aside>
  );
};
