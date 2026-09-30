"use client";

import React, { useState, useEffect, useRef } from "react";
import { useVyomStore } from "../lib/store";
import { useT, formatRupees } from "../lib/i18n";
import {
  X,
  Check,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Mic,
  Users,
  Edit2,
  AlertTriangle,
} from "lucide-react";
import { Confetti } from "./Confetti";

export function OpportunityModal() {
  const {
    selectedOpportunity,
    setSelectedOpportunity,
    approveOpportunity,
    rejectOpportunity,
  } = useVyomStore();
  const { t, lang } = useT();

  const [isEditingMsg, setIsEditingMsg] = useState(false);
  const [editedMsg, setEditedMsg] = useState("");
  const [showXAI, setShowXAI] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedOpportunity) {
      const msg =
        selectedOpportunity.draftMessage[lang] ||
        selectedOpportunity.draftMessage.hinglish;
      setEditedMsg(msg);
      setIsEditingMsg(false);
      setHoldProgress(0);
    }
  }, [selectedOpportunity, lang]);

  if (!selectedOpportunity) return null;

  const handleApprove = () => {
    setConfettiTrigger(true);
    setTimeout(() => {
      approveOpportunity(selectedOpportunity.id, editedMsg);
    }, 400);
  };

  const handleReject = () => {
    rejectOpportunity(selectedOpportunity.id);
  };

  const playSpeechReadout = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const script =
        selectedOpportunity.speechScript[lang] ||
        selectedOpportunity.speechScript.hinglish;

      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = 1.0;
      if (lang === "hi" || lang === "hinglish") {
        utterance.lang = "hi-IN";
      } else if (lang === "mr") {
        utterance.lang = "mr-IN";
      } else {
        utterance.lang = "en-IN";
      }
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Voice "Hold to speak Haan" button
  const startHold = () => {
    setHoldProgress(0);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          handleApprove();
          return 100;
        }
        return prev + 10;
      });
    }, 120);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const xaiReasons =
    selectedOpportunity.xaiReasons[lang] ||
    selectedOpportunity.xaiReasons.hinglish;

  return (
    <>
      <Confetti trigger={confettiTrigger} />

      <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-obsidian/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4">
        <div className="w-full sm:max-w-2xl bg-paper sm:rounded-3xl rounded-t-3xl border border-soft-line shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/40">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-sky text-blue border border-line">
                {selectedOpportunity.type.replace("_", " ")}
              </span>
              <span className="text-xs font-semibold text-charcoal">
                Confidence: {Math.round(selectedOpportunity.confidence * 100)}%
              </span>
            </div>

            <button
              onClick={() => setSelectedOpportunity(null)}
              className="w-8 h-8 rounded-full hover:bg-cloud flex items-center justify-center text-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* 1. What Vyom Found */}
            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg sm:text-xl text-obsidian tracking-tight">
                {selectedOpportunity.title}
              </h3>
              <p className="text-xs text-charcoal leading-relaxed">
                {selectedOpportunity.summary}
              </p>

              {/* Sample Target Customers Avatars */}
              {selectedOpportunity.sampleCustomers && (
                <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-bold text-charcoal uppercase shrink-0">
                    Sample grahak:
                  </span>
                  {selectedOpportunity.sampleCustomers.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cloud border border-soft-line text-xs shrink-0"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue text-paper text-[10px] font-bold flex items-center justify-center">
                        {c.avatar}
                      </span>
                      <span className="font-medium text-obsidian">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Financial Metrics Strip */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-cloud border border-soft-line">
              <div className="text-center">
                <span className="text-[10px] text-charcoal font-semibold uppercase block">
                  Est. Kamai / Return
                </span>
                <span className="font-display font-bold text-base sm:text-lg text-blue tabular-nums">
                  {formatRupees(selectedOpportunity.estReturn)}
                </span>
              </div>

              <div className="text-center border-x border-soft-line">
                <span className="text-[10px] text-charcoal font-semibold uppercase block">
                  Audience Size
                </span>
                <span className="font-display font-bold text-base sm:text-lg text-obsidian tabular-nums">
                  {selectedOpportunity.audienceCount} Grahak
                </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-charcoal font-semibold uppercase block">
                  Expected ROI
                </span>
                <span className="font-display font-bold text-base sm:text-lg text-emerald-600 tabular-nums">
                  {selectedOpportunity.expectedROI}
                </span>
              </div>
            </div>

            {/* 3. Proposed Customer Message Preview (Editable) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-obsidian flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-blue" />
                  Proposed Customer Message (WhatsApp / Telegram)
                </span>
                <button
                  onClick={() => setIsEditingMsg(!isEditingMsg)}
                  className="text-xs font-semibold text-blue hover:underline"
                >
                  {isEditingMsg ? "Done Editing" : "Edit Message"}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-paper border border-line shadow-feature space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-soft-line text-xs font-bold text-obsidian">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Customer Preview: &quot;Sharma Kirana Store&quot;</span>
                </div>

                {isEditingMsg ? (
                  <textarea
                    value={editedMsg}
                    onChange={(e) => setEditedMsg(e.target.value)}
                    rows={3}
                    className="w-full text-xs text-obsidian bg-cloud p-2.5 rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-blue/30"
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-obsidian leading-relaxed italic bg-cloud/50 p-3 rounded-xl border border-soft-line">
                    &quot;{editedMsg}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-charcoal pt-1">
                  <span>Offer: <strong>{selectedOpportunity.offer}</strong></span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Est. Cost: ₹{selectedOpportunity.estCost}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Guardrail Check Panel */}
            <div className="p-4 rounded-2xl bg-cloud border border-soft-line space-y-2">
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Guardrail Checks (Code-Enforced Bounds)
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-obsidian">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>{selectedOpportunity.guardrailsPassed.budgetCheck.label}</span>
                </div>
                <div className="flex items-center gap-2 text-obsidian">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>{selectedOpportunity.guardrailsPassed.discountCheck.label}</span>
                </div>
                <div className="flex items-center gap-2 text-obsidian">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>{selectedOpportunity.guardrailsPassed.frequencyCheck.label}</span>
                </div>
              </div>
            </div>

            {/* 5. "Kyun suggest kiya?" (Explainable AI) with "🔊 Sunao" */}
            <div className="p-4 rounded-2xl bg-sky/25 border border-line space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowXAI(!showXAI)}
                  className="flex items-center gap-1.5 font-bold text-xs text-obsidian"
                >
                  <TrendingUp className="w-4 h-4 text-blue" />
                  <span>Kyun suggest kiya? (AI Explainability)</span>
                  {showXAI ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={playSpeechReadout}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    isPlayingAudio
                      ? "bg-blue text-paper border-transparent animate-pulse"
                      : "bg-paper text-blue border-line hover:bg-cloud"
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio ? "Sun rahe hain..." : "🔊 Sunao"}</span>
                </button>
              </div>

              {showXAI && (
                <ul className="space-y-1.5 text-xs text-charcoal list-disc pl-4 leading-relaxed pt-1">
                  {xaiReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sticky Bottom Approval Bar */}
          <div className="p-4 border-t border-soft-line bg-paper flex flex-col sm:flex-row items-center gap-3">
            {/* Hold to speak 'Haan' voice-approval button */}
            <button
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className="relative w-full sm:w-auto px-4 py-2.5 rounded-xl border border-line hover:bg-cloud text-xs font-bold text-obsidian flex items-center justify-center gap-2 overflow-hidden shadow-button select-none"
            >
              {holdProgress > 0 && (
                <div
                  className="absolute inset-0 bg-sky/60 transition-all"
                  style={{ width: `${holdProgress}%` }}
                />
              )}
              <Mic className="w-4 h-4 text-blue relative z-10" />
              <span className="relative z-10">
                {holdProgress > 0 ? `Bol rahe hain (${holdProgress}%)` : "Hold to speak 'Haan'"}
              </span>
            </button>

            <div className="flex items-center gap-2 w-full sm:flex-1">
              <button
                onClick={handleReject}
                className="py-2.5 px-4 rounded-xl border border-line text-xs font-semibold text-charcoal hover:bg-cloud transition-colors"
              >
                {t("opps.modal.reject")}
              </button>

              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 px-5 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs sm:text-sm font-bold shadow-button flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>{t("opps.modal.approve")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
