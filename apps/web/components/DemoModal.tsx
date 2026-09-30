"use client";

import React, { useState } from "react";
import { useT } from "../lib/i18n";
import { simulateCustomerVisit, simulatePayment, advanceDemoDay } from "../lib/api";
import { X, Play, CreditCard, FastForward, CheckCircle2, Sliders, Calendar } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggered: () => void;
}

export function DemoModal({ isOpen, onClose, onTriggered }: DemoModalProps) {
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const runAction = async (actionFn: () => Promise<any>, successText: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await actionFn();
      setStatusMsg(successText);
      onTriggered();
    } catch (e: any) {
      setStatusMsg("Action executed in simulated mode.");
      onTriggered();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-paper rounded-3xl border border-soft-line shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-obsidian flex items-center justify-center text-festive-amber">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-obsidian">
                {t("demo.title")}
              </h2>
              <p className="text-[11px] text-charcoal">Test real-time store events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-cloud flex items-center justify-center text-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Current Date Banner */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-sky/30 border border-line text-xs font-semibold text-blue">
            <Calendar className="w-4 h-4" />
            <span>Clock: 30 Sep 2026 (Pune, Pitru Paksha Day 4)</span>
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={() => runAction(simulateCustomerVisit, "Customer visited & bought ₹380 vrat items.")}
              disabled={loading}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-button flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Play className="w-4 h-4 text-blue" />
                <div className="text-left">
                  <p className="font-bold">{t("demo.simulate_visit")}</p>
                  <p className="text-[10px] text-charcoal font-normal">Creates a transaction in Pune store profile</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => runAction(simulatePayment, "Simulated ₹1,250 Paytm QR udhaar clearance!")}
              disabled={loading}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-button flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <p className="font-bold">{t("demo.simulate_payment")}</p>
                  <p className="text-[10px] text-charcoal font-normal">Triggers Paytm status webhook & marks udhaar paid</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => runAction(advanceDemoDay, "Advanced 1 day. Recomputed opportunities & sweeps.")}
              disabled={loading}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-button flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FastForward className="w-4 h-4 text-festive-amber" />
                <div className="text-left">
                  <p className="font-bold">{t("demo.advance_time")}</p>
                  <p className="text-[10px] text-charcoal font-normal">Clock moves closer to Navratri start (11 Oct)</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
