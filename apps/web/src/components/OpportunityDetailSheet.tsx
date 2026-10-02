import React, { useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  Volume2,
  Mic,
  Users,
  TrendingUp,
  IndianRupee,
  Sparkles,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from './icons';
import confetti from 'canvas-confetti';
import { Guardrails, Language, Opportunity } from '../types';
import { formatRupee } from '../utils/formatters';
import { translations } from '../utils/i18n';
import { speakWithShubh } from '../utils/speech';

interface OpportunityDetailSheetProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onApprove: (opp: Opportunity, customMessage: string, customDiscount: number) => void;
  onDismiss: (oppId: string) => void;
  guardrails: Guardrails;
  lang: Language;
}

export const OpportunityDetailSheet: React.FC<OpportunityDetailSheetProps> = ({
  opportunity,
  onClose,
  onApprove,
  onDismiss,
  guardrails,
  lang,
}) => {
  if (!opportunity) return null;

  const t = translations[lang] || translations.hinglish;
  const [discountPercent, setDiscountPercent] = useState<number>(opportunity.discountPercent);
  const [messageText, setMessageText] = useState<string>(
    opportunity.draftedMessage[lang] || opportunity.draftedMessage.hinglish
  );
  const [showReasons, setShowReasons] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isHoldingVoice, setIsHoldingVoice] = useState(false);
  const [voiceHoldProgress, setVoiceHoldProgress] = useState(0);

  // Guardrail safety validations
  const isBudgetWithinLimit = opportunity.estimatedCost <= guardrails.maxWeeklyBudget;
  const isDiscountWithinLimit = discountPercent <= guardrails.maxDiscountPercent;
  const isFrequencyWithinLimit = guardrails.maxMessagesPerCustomerPerWeek >= 1;
  const hasGuardrailViolation = !isDiscountWithinLimit || !isBudgetWithinLimit;

  // Speak aloud explainable AI reasons using Kirana Voice Assistant
  const playReasonAudio = () => {
    const textToSpeak =
      opportunity.audioScript[lang] || opportunity.audioScript.hinglish;

    speakWithShubh(textToSpeak, {
      lang,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleApproveAction = () => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#2597d0', '#d7e6f5', '#070709', '#10b981'],
      });
    } catch (e) {
      // ignore
    }

    onApprove(opportunity, messageText, discountPercent);
    onClose();
  };

  // Hold-to-speak "Haan" implementation
  let holdInterval: number | null = null;
  const handleHoldStart = () => {
    if (hasGuardrailViolation) return;
    setIsHoldingVoice(true);
    let current = 0;
    holdInterval = window.setInterval(() => {
      current += 10;
      setVoiceHoldProgress(current);
      if (current >= 100) {
        clearInterval(holdInterval!);
        setIsHoldingVoice(false);
        setVoiceHoldProgress(0);
        handleApproveAction();
      }
    }, 100);
  };

  const handleHoldEnd = () => {
    if (holdInterval) clearInterval(holdInterval);
    setIsHoldingVoice(false);
    setVoiceHoldProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl max-h-[90vh] bg-paper rounded-t-3xl sm:rounded-3xl border border-line shadow-feature flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-paper/95 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue" />
            <h2 className="font-extrabold text-base text-obsidian tracking-tight">
              {t.detailSheetTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Main Opportunity Title & Revenue Pill */}
          <div className="p-4 rounded-2xl bg-cloud border border-soft-line space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-base text-obsidian leading-snug">
                {opportunity.title[lang] || opportunity.title.hinglish}
              </h3>
              <div className="text-right flex-shrink-0">
                <span className="text-[11px] font-semibold text-charcoal block">Potential</span>
                <span className="text-lg font-extrabold text-blue">
                  {formatRupee(opportunity.potentialRevenue)}
                </span>
              </div>
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              {opportunity.description[lang] || opportunity.description.hinglish}
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white border border-line text-center">
              <div className="text-[11px] text-slate font-medium flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-blue" /> Target
              </div>
              <div className="font-extrabold text-sm text-ink mt-0.5">
                {opportunity.customerCount} grahak
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-line text-center">
              <div className="text-[11px] text-slate font-medium flex items-center justify-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-600" /> Cost
              </div>
              <div className="font-extrabold text-sm text-ink mt-0.5">
                {formatRupee(opportunity.estimatedCost)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-line text-center">
              <div className="text-[11px] text-slate font-medium flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-600" /> Exp. ROI
              </div>
              <div className="font-extrabold text-sm text-emerald-700 mt-0.5">
                {opportunity.expectedRoi}
              </div>
            </div>
          </div>

          {/* Proposed Customer WhatsApp Message (Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-obsidian flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                {t.proposedMessage}
              </label>
              <span className="text-[10px] text-slate font-medium">Aap edit kar sakte hain</span>
            </div>

            {/* Chat Bubble Representation */}
            <div className="p-3.5 rounded-2xl bg-[#e7f7e9] border border-emerald-200/80 shadow-xs relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-xs text-ink leading-relaxed font-normal focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-1 text-[10px] text-emerald-800 font-medium">
                <span>Sharma Kirana Store WhatsApp</span>
                <span>Abhi 11:30 AM ✓✓</span>
              </div>
            </div>
          </div>

          {/* Discount / Offer Adjustment */}
          <div className="p-3.5 rounded-2xl bg-cloud border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-obsidian">Discount Level (%):</span>
              <span className={`text-xs font-extrabold ${isDiscountWithinLimit ? 'text-blue' : 'text-error'}`}>
                {discountPercent}% {isDiscountWithinLimit ? '' : '(Limit se zyada!)'}
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={25}
              step={1}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full accent-blue cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate font-medium">
              <span>2% Chhota</span>
              <span>10% Recommended</span>
              <span>Max Limit: {guardrails.maxDiscountPercent}%</span>
            </div>
          </div>

          {/* Guardrail Safety Checks Panel */}
          <div className="p-3.5 rounded-2xl bg-white border border-line space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-obsidian flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t.guardrailsTitle}
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                Protected
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-charcoal">
                <span>Budget: {formatRupee(opportunity.estimatedCost)}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Limit ₹{guardrails.maxWeeklyBudget} ke andar
                </span>
              </div>

              <div className="flex items-center justify-between text-charcoal">
                <span>Discount: {discountPercent}%</span>
                {isDiscountWithinLimit ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Limit {guardrails.maxDiscountPercent}% ke andar
                  </span>
                ) : (
                  <span className="text-error font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-error" /> {t.guardExceeded}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-charcoal">
                <span>Frequency: Hafte mein 1 message</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Spam protection OK
                </span>
              </div>
            </div>
          </div>

          {/* "Kyun suggest kiya?" Explainable AI Section with Audio */}
          <div className="rounded-2xl border border-soft-line bg-cloud overflow-hidden">
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-obsidian hover:bg-slate-100 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue" />
                {t.whySuggested}
              </span>
              {showReasons ? <ChevronUp className="w-4 h-4 text-slate" /> : <ChevronDown className="w-4 h-4 text-slate" />}
            </button>

            {showReasons && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-soft-line">
                <ul className="space-y-1.5 text-xs text-charcoal list-disc pl-4 leading-relaxed">
                  {(opportunity.reasons[lang] || opportunity.reasons.hinglish).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>

                {/* Speak Aloud Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={playReasonAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line text-xs font-semibold text-blue hover:bg-sky/50 transition cursor-pointer shadow-xs"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-blue' : ''}`} />
                    <span>{isPlayingAudio ? t.stopAudio : t.listenReason}</span>
                  </button>

                  {isPlayingAudio && (
                    <div className="flex items-center gap-1 text-[11px] text-blue font-semibold">
                      <span className="inline-block w-1.5 h-3 bg-blue animate-pulse" />
                      <span className="inline-block w-1.5 h-4 bg-blue animate-pulse delay-75" />
                      <span className="inline-block w-1.5 h-2 bg-blue animate-pulse delay-150" />
                      <span>Bol raha hai...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Approval Actions */}
        <div className="p-4 border-t border-soft-line bg-paper space-y-2">
          {hasGuardrailViolation && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-error font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-error" />
              <span>Discount aapki limit ({guardrails.maxDiscountPercent}%) se zyada hai. Slider ko kam karein.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDismiss(opportunity.id);
                onClose();
              }}
              className="flex-1 py-3 px-3 rounded-2xl border border-line text-xs font-bold text-charcoal hover:text-obsidian hover:bg-cloud transition cursor-pointer text-center"
            >
              {t.declineFullBtn}
            </button>

            <button
              onClick={handleApproveAction}
              disabled={hasGuardrailViolation}
              className={`flex-2 py-3 px-4 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-button transition cursor-pointer ${
                hasGuardrailViolation
                  ? 'bg-slate/50 text-white/80 cursor-not-allowed'
                  : 'bg-blue hover:bg-blue/95 active:scale-[0.98]'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{t.approveFullBtn}</span>
            </button>
          </div>

          {/* Voice Approval Alternative (Hold to speak "Haan") */}
          <div className="relative pt-1 text-center">
            <button
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              disabled={hasGuardrailViolation}
              className={`w-full py-2 px-3 rounded-xl border border-line text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none ${
                isHoldingVoice
                  ? 'bg-blue text-white border-blue'
                  : 'bg-cloud text-charcoal hover:bg-slate-100'
              } ${hasGuardrailViolation ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Mic className={`w-3.5 h-3.5 ${isHoldingVoice ? 'animate-pulse' : 'text-blue'}`} />
              <span>
                {isHoldingVoice
                  ? `Sun raha hai... (${voiceHoldProgress}%)`
                  : t.holdToSpeak}
              </span>
            </button>
            {isHoldingVoice && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${voiceHoldProgress}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
