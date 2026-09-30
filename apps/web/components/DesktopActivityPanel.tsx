"use client";

import React from "react";
import { useVyomStore } from "../lib/store";
import { Sparkles, Radio, CheckCircle2, ShieldCheck, Activity } from "lucide-react";

export function DesktopActivityPanel() {
  const { activityFeed, stats } = useVyomStore();

  return (
    <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-soft-line bg-paper min-h-[calc(100vh-65px)] sticky top-[65px] p-4 space-y-4">
      {/* Soundbox Live Status */}
      <div className="p-3.5 rounded-2xl bg-cloud border border-soft-line space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-obsidian flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue animate-pulse" />
            <span>Paytm Soundbox</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Synced
          </span>
        </div>
        <p className="text-[11px] text-charcoal leading-tight">
          Soundbox #98210 is live in Pune store. Instant payment alerts enabled.
        </p>
      </div>

      {/* Activity Feed Header */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue" />
          <span>Vyom Activity Feed</span>
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      {/* Activity Stream */}
      <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {activityFeed.map((act) => (
          <div
            key={act.id}
            className="p-3 rounded-2xl bg-cloud/60 border border-soft-line hover:bg-cloud transition-colors text-xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-charcoal">
                {act.type === "autonomous" ? "🤖 Autonomous" : act.type === "success" ? "✓ Verified" : "⚡ System"}
              </span>
              <span className="text-[10px] text-slate">{act.time}</span>
            </div>
            <p className="text-obsidian leading-relaxed">{act.text}</p>
          </div>
        ))}
      </div>

      {/* Autonomous Sweep Banner */}
      <div className="p-3 rounded-2xl bg-sky/20 border border-line text-xs space-y-1 mt-auto">
        <div className="flex items-center gap-1.5 font-bold text-blue">
          <ShieldCheck className="w-4 h-4" />
          <span>Holdout-Verified Uplift</span>
        </div>
        <p className="text-[11px] text-charcoal">
          10% control group kept uncontacted to verify pure incremental recovery.
        </p>
      </div>
    </aside>
  );
}
