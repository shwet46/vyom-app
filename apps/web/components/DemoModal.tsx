"use client";

import React, { useState } from "react";
import { useVyomStore } from "../lib/store";
import { useT } from "../lib/i18n";
import {
  X,
  Play,
  CreditCard,
  FastForward,
  CheckCircle2,
  Sliders,
  Calendar,
  Sparkles,
  Radio,
} from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const {
    markUdhaarPaid,
    udhaarCustomers,
    addActivity,
    addToast,
    opportunities,
    approveOpportunity,
  } = useVyomStore();
  const { t } = useT();

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    const overdueCust = udhaarCustomers.find((c) => c.status !== "Paid ✓");
    if (overdueCust) {
      markUdhaarPaid(overdueCust.id);
      setStatusMsg(`₹${overdueCust.amount} Paytm Soundbox payment cleared for ${overdueCust.name}!`);
    } else {
      setStatusMsg("All udhaar accounts already settled!");
    }
  };

  const handleSimulateVisit = () => {
    addToast({
      type: "success",
      title: "Grahak Aavak (Customer Visit)",
      description: "Sunita Patil visited shop and purchased ₹420 Navratri Vrat pack via Paytm QR.",
    });
    addActivity("Paytm Soundbox: ₹420 received for Navratri Vrat Pack", "success");
    setStatusMsg("Simulated customer visit & ₹420 Paytm Soundbox purchase recorded!");
  };

  const handleAdvanceDay = () => {
    addToast({
      type: "info",
      title: "Demo Time Advanced +1 Day",
      description: "Clock moved closer to Navratri start. Autonomous sweeps evaluated 6 reminders.",
    });
    addActivity("Time advanced 1 day. Recomputed dead hours & festival timeline.", "system");
    setStatusMsg("Advanced 1 day. Vyom evaluated transactions & ran morning sweep.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-paper rounded-3xl border border-soft-line shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-obsidian text-paper flex items-center justify-center shadow-button">
              <Sliders className="w-4 h-4 text-sky" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm text-obsidian">
                Interactive Demo Lab
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
          {/* Current Date Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-sky/30 border border-line text-xs font-bold text-blue">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>30 Sep 2026 (Pune, Pitru Paksha Day 4)</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              onClick={handleSimulateVisit}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-button flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-3">
                <Play className="w-4 h-4 text-blue" />
                <div className="text-left">
                  <p className="font-bold">Simulate Customer Visit</p>
                  <p className="text-[10px] text-charcoal font-normal">
                    Triggers a ₹420 Paytm QR purchase & updates sales
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleSimulatePayment}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-button flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <p className="font-bold">Simulate Paytm QR Udhaar Clearance</p>
                  <p className="text-[10px] text-charcoal font-normal">
                    Triggers Paytm Soundbox webhook & settles customer credit
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={handleAdvanceDay}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-button flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-3">
                <FastForward className="w-4 h-4 text-festive-amber" />
                <div className="text-left">
                  <p className="font-bold">Advance 1 Day (Time Travel)</p>
                  <p className="text-[10px] text-charcoal font-normal">
                    Advances clock toward Navratri start & re-evaluates sweeps
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
