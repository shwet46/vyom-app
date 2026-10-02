import React from 'react';
import { ActivityFeedItem } from '../types';
import { formatRupee } from '../utils/formatters';
import { CheckCircle2, Clock, Send, Sparkles, TrendingUp } from './icons';

interface DesktopActivityFeedProps {
  items: ActivityFeedItem[];
}

export const DesktopActivityFeed: React.FC<DesktopActivityFeedProps> = ({ items }) => {
  return (
    <aside className="hidden xl:flex flex-col w-72 border-l border-soft-line bg-paper/60 backdrop-blur-xs h-[calc(100vh-57px)] sticky top-[57px] p-4 flex-shrink-0 overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-soft-line">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-extrabold text-xs text-obsidian tracking-tight uppercase font-google">
            Vyom Live Feed
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-blue bg-sky px-2 py-0.5 rounded-full font-google">
          Autonomous
        </span>
      </div>

      <p className="text-[11px] text-slate mt-2 mb-3 leading-relaxed">
        Paisa bachaane ke liye pichle 24h mein kiye gaye kaam:
      </p>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
        {items.map((item) => {
          let icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
          let bg = 'bg-emerald-50/70 border-emerald-100/80';

          if (item.iconType === 'reminder') {
            icon = <Send className="w-3.5 h-3.5 text-blue" />;
            bg = 'bg-sky/50 border-blue/15';
          } else if (item.iconType === 'campaign') {
            icon = <TrendingUp className="w-3.5 h-3.5 text-purple-600" />;
            bg = 'bg-purple-50/70 border-purple-100/80';
          } else if (item.iconType === 'insight') {
            icon = <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
            bg = 'bg-amber-50/70 border-amber-100/80';
          }

          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border ${bg} transition-all hover:shadow-xs`}
            >
              <div className="flex items-start gap-2">
                <div className="p-1 rounded-lg bg-white/90 flex-shrink-0 mt-0.5 shadow-xs">{icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-obsidian truncate">{item.title}</span>
                    {item.amount && (
                      <span className="font-black text-xs text-emerald-700 flex-shrink-0 font-google">
                        +{formatRupee(item.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-charcoal mt-0.5 leading-snug line-clamp-2">{item.detail}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate mt-1 font-medium">
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
        {/* <div className="p-2 rounded-xl bg-cloud text-[11px] text-charcoal flex items-center justify-between">
          <span className="text-slate">Silent leak protection</span>
          <span className="font-bold text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active 24/7
          </span>
        </div> */}
      </div>
    </aside>
  );
};
