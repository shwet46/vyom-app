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
  const hasGuardrailViolation = !isDiscountWithinLimit || !isBudgetWithinLimit;

  // Speak aloud explainable AI reasons
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
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#00A9E8', '#BEF0D8', '#CBD5E1', '#FFE4B8'],
      });
    } catch (e) {}

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian/60 backdrop-blur-xs p-0 sm:p-3">
      <div
        className="w-full max-w-[420px] max-h-[92vh] bg-surface rounded-t-2xl sm:rounded-2xl border-2 border-ink flex flex-col overflow-hidden animate-fade-slide-up"
        style={{ boxShadow: '2px 2px 0px var(--shadow-color)' }}
      >
        {/* Top Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-surface sticky top-0 z-10"
          style={{ borderBottom: '2px solid var(--shadow-color)' }}
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: 'var(--ai-text)',
                border: '1.5px solid var(--shadow-color)',
              }}
            />
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
              {t.detailSheetTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-ink bg-surface flex items-center justify-center text-ink cursor-pointer hover:bg-canvas transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {/* Main Opportunity Card */}
          <div className="comic-card-lavender" style={{ padding: 12 }}>
            <div className="flex items-start justify-between gap-2">
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25 }}>
                {opportunity.title[lang] || opportunity.title.hinglish}
              </h3>
              <div className="text-right flex-shrink-0">
                <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Potential</span>
                <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 800, color: 'var(--ai-text)' }}>
                  {formatRupee(opportunity.potentialRevenue)}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4, lineHeight: 1.4 }}>
              {opportunity.description[lang] || opportunity.description.hinglish}
            </p>
          </div>

          {/* Quick Metrics Strip — 3 comic boxes */}
          <div className="grid grid-cols-3 gap-2">
            <div className="comic-card text-center" style={{ padding: 8 }}>
              <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <Users className="w-3 h-3 text-ink" /> Target
              </div>
              <div className="tabular-nums" style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                {opportunity.customerCount} grahak
              </div>
            </div>

            <div className="comic-card text-center" style={{ padding: 8 }}>
              <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <IndianRupee className="w-3 h-3 text-ink" /> Cost
              </div>
              <div className="tabular-nums" style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                {formatRupee(opportunity.estimatedCost)}
              </div>
            </div>

            <div className="comic-card-mint text-center" style={{ padding: 8 }}>
              <div style={{ fontSize: 10, color: '#0E7A50', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                <TrendingUp className="w-3 h-3 text-mint-text" /> Exp. ROI
              </div>
              <div className="tabular-nums" style={{ fontSize: 13, fontWeight: 800, color: '#0E7A50', marginTop: 2 }}>
                {opportunity.expectedRoi}
              </div>
            </div>
          </div>

          {/* Proposed Customer WhatsApp Message */}
          <div className="comic-card" style={{ padding: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MessageCircle className="w-3.5 h-3.5" style={{ color: '#0E7A50' }} />
                {t.proposedMessage}
              </label>
              <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Aap edit kar sakte hain</span>
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: '#BEF0D8',
                border: '1.5px solid var(--shadow-color)',
                borderRadius: 12,
              }}
            >
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-xs leading-relaxed focus:outline-none resize-none"
                style={{ color: '#0E7A50', fontWeight: 600 }}
              />
              <div className="flex items-center justify-between mt-1" style={{ fontSize: 10, color: '#0E7A50', fontWeight: 700 }}>
                <span>Sharma Kirana • WhatsApp Bot</span>
                <span>Send dabate hi jayega ✓✓</span>
              </div>
            </div>
          </div>

          {/* Discount Slider */}
          <div className="comic-card" style={{ padding: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>Discount Level (%):</span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isDiscountWithinLimit ? 'var(--shadow-color)' : '#C62828',
                }}
              >
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
              className="w-full cursor-pointer"
              style={{ accentColor: 'var(--shadow-color)' }}
            />
            <div className="flex justify-between" style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginTop: 4 }}>
              <span>2% Chhota</span>
              <span>10% Recommended</span>
              <span>Max: {guardrails.maxDiscountPercent}%</span>
            </div>
          </div>

          {/* Guardrails Check */}
          <div className="comic-card" style={{ padding: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck className="w-4 h-4" style={{ color: '#0E7A50' }} />
                {t.guardrailsTitle}
              </span>
              <span className="comic-badge" style={{ background: '#BEF0D8', color: '#0E7A50', fontSize: 9 }}>
                Protected
              </span>
            </div>
            <div className="space-y-1" style={{ fontSize: 11 }}>
              <div className="flex items-center justify-between">
                <span style={{ color: '#6B7280' }}>Budget Limit:</span>
                <span style={{ color: '#0E7A50', fontWeight: 700 }}>✓ ₹{guardrails.maxWeeklyBudget} ke andar</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: '#6B7280' }}>Discount Limit:</span>
                {isDiscountWithinLimit ? (
                  <span style={{ color: '#0E7A50', fontWeight: 700 }}>✓ {guardrails.maxDiscountPercent}% ke andar</span>
                ) : (
                  <span style={{ color: '#C62828', fontWeight: 800 }}>✗ {t.guardExceeded}</span>
                )}
              </div>
            </div>
          </div>

          {/* "Kyun suggest kiya?" Rule-tag Evidence */}
          <div className="comic-card" style={{ padding: 12 }}>
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
                {t.whySuggested}
              </span>
              {showReasons ? <ChevronUp className="w-4 h-4 text-ink" /> : <ChevronDown className="w-4 h-4 text-ink" />}
            </button>

            {showReasons && (
              <div className="pt-2 mt-2" style={{ borderTop: '1.5px solid rgba(148,163,184,0.28)' }}>
                <ul className="space-y-1.5 pl-4 list-disc" style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.4 }}>
                  {(opportunity.reasons[lang] || opportunity.reasons.hinglish).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>

                {/* Speak Aloud Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={playReasonAudio}
                    className="comic-btn-outline comic-btn-sm"
                    style={{ fontSize: 11 }}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce' : ''}`} style={{ color: 'var(--ai-text)' }} />
                    <span>{isPlayingAudio ? t.stopAudio : t.listenReason}</span>
                  </button>
                  {isPlayingAudio && (
                    <span style={{ fontSize: 11, color: 'var(--ai-text)', fontWeight: 700 }}>
                      Bol raha hai...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Approval Actions */}
        <div
          className="p-3 bg-surface space-y-2"
          style={{ borderTop: '2px solid var(--shadow-color)' }}
        >
          {hasGuardrailViolation && (
            <div
              className="comic-card-coral text-center"
              style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#C62828', borderRadius: 8 }}
            >
              Discount limit ({guardrails.maxDiscountPercent}%) se zyada hai!
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDismiss(opportunity.id);
                onClose();
              }}
              className="comic-btn-outline flex-1"
              style={{ fontSize: 13 }}
            >
              {t.declineFullBtn}
            </button>

            <button
              onClick={handleApproveAction}
              disabled={hasGuardrailViolation}
              className="comic-btn flex-2"
              style={{
                fontSize: 13,
                opacity: hasGuardrailViolation ? 0.5 : 1,
                cursor: hasGuardrailViolation ? 'not-allowed' : 'pointer',
              }}
            >
              <Check className="w-4 h-4" />
              <span>{t.approveFullBtn}</span>
            </button>
          </div>

          {/* Voice Approval Alternative */}
          <button
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            disabled={hasGuardrailViolation}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink py-2 cursor-pointer select-none"
            style={{
              background: isHoldingVoice ? 'var(--ai-text)' : 'var(--canvas)',
              color: isHoldingVoice ? '#FFFFFF' : 'var(--shadow-color)',
              fontSize: 11,
              fontWeight: 700,
              boxShadow: '1px 1px 0px var(--shadow-color)',
            }}
          >
            <Mic className="w-3.5 h-3.5" style={{ color: isHoldingVoice ? '#FFFFFF' : 'var(--ai-text)' }} />
            <span>
              {isHoldingVoice
                ? `Sun raha hai... (${voiceHoldProgress}%)`
                : t.holdToSpeak}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
