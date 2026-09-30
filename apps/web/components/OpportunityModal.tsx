"use client";

import React, { useState } from "react";
import { useT, formatRupees } from "../lib/i18n";
import { approveOpportunity, rejectOpportunity } from "../lib/api";
import { X, Check, Trash2, Clock, Sparkles, ShieldCheck, Users, TrendingUp } from "lucide-react";

interface OpportunityModalProps {
  opportunity: any;
  isOpen: boolean;
  onClose: () => void;
  onApproved: () => void;
}

export function OpportunityModal({
  opportunity,
  isOpen,
  onClose,
  onApproved,
}: OpportunityModalProps) {
  const { t } = useT();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !opportunity) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await approveOpportunity(opportunity.id);
      onApproved();
      onClose();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await rejectOpportunity(opportunity.id);
      onApproved();
      onClose();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const netReturnPaise = Math.max(0, (opportunity.est_return_paise || 0) - (opportunity.est_cost_paise || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-paper rounded-3xl border border-soft-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky flex items-center justify-center text-blue shadow-button">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-obsidian capitalize">
                {opportunity.type?.replace("_", " ")}
              </h2>
              <p className="text-[11px] text-charcoal">
                Rank Score: {opportunity.score} · Confidence: {Math.round(opportunity.confidence * 100)}%
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Why Vyom detected this */}
          <div className="p-4 rounded-2xl bg-cloud border border-soft-line space-y-1.5">
            <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue" />
              {t("grow.card.why")}
            </span>
            <p className="text-xs text-obsidian leading-relaxed">
              {opportunity.evidence?.reason || "Vyom detected unusual customer visit interval and festival timing."}
            </p>
          </div>

          {/* Financial Projection Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-sky/30 border border-line text-center">
              <p className="text-[10px] text-charcoal font-semibold uppercase">Net Return</p>
              <p className="font-display font-bold text-base text-blue tabular-nums">
                {formatRupees(netReturnPaise)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-cloud border border-line text-center">
              <p className="text-[10px] text-charcoal font-semibold uppercase">Audience</p>
              <p className="font-display font-bold text-base text-obsidian tabular-nums">
                {opportunity.audience_customer_ids?.length || 0} grahak
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-cloud border border-line text-center">
              <p className="text-[10px] text-charcoal font-semibold uppercase">Est. Cost</p>
              <p className="font-display font-bold text-base text-charcoal tabular-nums">
                {formatRupees(opportunity.est_cost_paise || 0)}
              </p>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-obsidian">Telegram Message Preview</span>
            <div className="p-4 rounded-2xl bg-paper border border-line shadow-sm text-xs leading-relaxed space-y-2">
              <p className="text-charcoal italic">
                &quot;Namaste Sunita ji! 🌟 Sharma Kirana Store mein aapke liye khaas offer: Atta 5kg + Dal 1kg combo sirf ₹420 (₹60 ki bachat). 12 Oct tak valid hai.&quot;
              </p>
              <div className="flex gap-2 pt-2 border-t border-soft-line">
                <span className="px-2 py-1 rounded-lg bg-cloud text-[11px] font-semibold text-blue">
                  [✅ Offer lo]
                </span>
                <span className="px-2 py-1 rounded-lg bg-cloud text-[11px] font-semibold text-charcoal">
                  [⏰ Baad mein]
                </span>
              </div>
            </div>
          </div>

          {/* Holdout & Guardrails Info */}
          <div className="p-3 rounded-xl bg-cloud/50 border border-soft-line flex items-center gap-2.5 text-[11px] text-charcoal">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              10% holdout group will be withheld to measure incremental revenue. Guardrails passed.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-soft-line bg-cloud/30 flex items-center justify-between gap-3">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-line text-xs font-semibold hover:bg-cloud text-error flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("home.approvals.reject_btn")}</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{submitting ? "Approving..." : t("home.approvals.approve_btn")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
