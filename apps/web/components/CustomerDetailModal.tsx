"use client";

import React, { useState } from "react";
import { UdhaarCustomer } from "../lib/mockData";
import { useVyomStore } from "../lib/store";
import { useT, formatRupees } from "../lib/i18n";
import { X, Send, Check, Phone, Calendar, Clock, AlertCircle } from "lucide-react";

interface CustomerDetailModalProps {
  customer: UdhaarCustomer | null;
  onClose: () => void;
}

export function CustomerDetailModal({
  customer,
  onClose,
}: CustomerDetailModalProps) {
  const { sendUdhaarReminder, markUdhaarPaid } = useVyomStore();
  const { t } = useT();
  const [selectedTone, setSelectedTone] = useState<"Gentle" | "Polite Firm" | "Firm Respectful">(
    customer?.tone || "Gentle"
  );

  if (!customer) return null;

  const isOverdue30 = customer.daysOverdue >= 30;

  const handleSend = () => {
    sendUdhaarReminder(customer.id);
    onClose();
  };

  const handlePaid = () => {
    markUdhaarPaid(customer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-obsidian/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-paper sm:rounded-3xl rounded-t-3xl border border-soft-line shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-obsidian text-paper flex items-center justify-center font-display font-bold text-sm shadow-button">
              {customer.avatar}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-obsidian">
                {customer.name}
              </h3>
              <p className="text-xs text-charcoal flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-blue" />
                <span>{customer.phone}</span>
              </p>
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
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Balance Strip */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-cloud border border-soft-line">
            <div>
              <span className="text-[10px] font-semibold text-charcoal uppercase block">
                Total Balance Due
              </span>
              <span className="font-display font-extrabold text-2xl text-obsidian tabular-nums">
                {formatRupees(customer.amount)}
              </span>
            </div>

            <div className="text-right">
              {customer.daysOverdue > 0 ? (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                    isOverdue30
                      ? "bg-red-100 text-error border border-red-200 animate-pulse"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {customer.daysOverdue} days overdue
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {customer.status}
                </span>
              )}
            </div>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-obsidian block">
              Autonomous Tone Strategy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Gentle", "Polite Firm", "Firm Respectful"] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedTone === tone
                      ? "bg-sky text-blue border-blue shadow-button"
                      : "bg-cloud text-charcoal border-soft-line hover:bg-paper"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Timeline */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider block">
              Reminder & Event History
            </span>

            <div className="border border-soft-line rounded-2xl overflow-hidden divide-y divide-soft-line bg-paper">
              {customer.timeline.map((item, i) => (
                <div key={i} className="p-3 text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-obsidian">
                    <span>{item.event}</span>
                    <span className="text-[10px] text-charcoal font-normal">{item.date}</span>
                  </div>
                  <p className="text-[11px] text-charcoal">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-soft-line bg-cloud/30 flex items-center gap-3">
          <button
            onClick={handlePaid}
            className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-paper hover:bg-cloud text-xs font-bold text-emerald-700 shadow-button flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Mark as Paid ✓</span>
          </button>

          <button
            onClick={handleSend}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Send Reminder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
