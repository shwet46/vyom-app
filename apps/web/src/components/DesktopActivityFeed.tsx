import React from 'react';
import { ActivityFeedItem } from '../types';
import { formatRupee } from '../utils/formatters';
import { CheckCircle2, Clock, Send, Sparkles, TrendingUp } from './icons';

interface DesktopActivityFeedProps {
  items: ActivityFeedItem[];
}

export const DesktopActivityFeed: React.FC<DesktopActivityFeedProps> = ({ items }) => {
  return (
    <aside className="hidden xl:flex flex-col w-68 border-l border-soft-line bg-paper/40 backdrop-blur-sm h-[calc(100vh-56px)] sticky top-14 p-3.5 flex-shrink-0 overflow-hidden">
      <div className="flex items-center justify-between pb-2.5 border-b border-soft-line">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-[11px] text-obsidian tracking-tight uppercase font-heading">
            Live Feed
          </h3>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wider text-blue bg-lavender/50 px-1.5 py-0.5 rounded-full font-heading">
          Auto
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mt-2.5 pr-0.5 no-scrollbar">
        {items.map((item) => {
          let icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
          let bgClass = 'card-pastel-mint border-mint/30';

          if (item.iconType === 'reminder') {
            icon = <Send className="w-3 h-3 text-blue" />;
            bgClass = 'card-pastel-lavender border-lavender/30';
          } else if (item.iconType === 'campaign') {
            icon = <TrendingUp className="w-3 h-3 text-purple-600" />;
            bgClass = 'card-pastel-blush border-blush/30';
          } else if (item.iconType === 'insight') {
            icon = <Sparkles className="w-3 h-3 text-amber-600" />;
            bgClass = 'card-pastel-peach border-peach/30';
          }

          return (
            <div
              key={item.id}
              className={`p-2 rounded-xl border ${bgClass} transition-all hover:shadow-xs hover-lift`}
            >
              <div className="flex items-start gap-1.5">
                <div className="p-1 rounded-lg bg-white/80 flex-shrink-0 mt-0.5 shadow-xs">{icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[11px] text-obsidian truncate">{item.title}</span>
                    {item.amount && (
                      <span className="font-bold text-[10px] text-emerald-700 flex-shrink-0 font-heading">
                        +{formatRupee(item.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-charcoal mt-0.5 leading-snug line-clamp-2">{item.detail}</p>
                  <div className="flex items-center gap-1 text-[9px] text-slate mt-1 font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-soft-line mt-auto">
      </div>
    </aside>
  );
};
