"use client";

import React, { useState } from "react";
import { useVyomStore } from "../lib/store";
import { useT, Language } from "../lib/i18n";
import {
  Sparkles,
  Check,
  ChevronRight,
  ShieldCheck,
  Store,
  CreditCard,
  Sliders,
  X,
} from "lucide-react";

export function OnboardingModal() {
  const {
    onboardingOpen,
    setOnboardingOpen,
    onboardingStep,
    setOnboardingStep,
    completeOnboarding,
    guardrails,
    updateGuardrails,
  } = useVyomStore();
  const { t, lang, setLang } = useT();

  const [shopName, setShopName] = useState("Sharma Kirana Store");
  const [city, setCity] = useState("Pune");
  const [category, setCategory] = useState("Kirana / Grocery");
  const [paytmConnected, setPaytmConnected] = useState(false);
  const [connectingPaytm, setConnectingPaytm] = useState(false);

  const [budget, setBudget] = useState(guardrails.weeklyBudget);
  const [discount, setDiscount] = useState(guardrails.maxDiscountPct);
  const [msgsPerWeek, setMsgsPerWeek] = useState(guardrails.maxMsgsPerCustomerPerWeek);

  if (!onboardingOpen) return null;

  const languages: { code: Language; label: string; sub: string }[] = [
    { code: "hinglish", label: "Hinglish", sub: "Aam bolchal ki bhasha" },
    { code: "mr", label: "मराठी", sub: "स्थानिक मराठी भाषा" },
    { code: "hi", label: "हिन्दी", sub: "शुद्ध हिन्दी भाषा" },
    { code: "en", label: "English", sub: "Simple Business English" },
  ];

  const handleConnectPaytm = () => {
    setConnectingPaytm(true);
    setTimeout(() => {
      setConnectingPaytm(false);
      setPaytmConnected(true);
    }, 1500);
  };

  const handleFinish = () => {
    updateGuardrails({
      weeklyBudget: budget,
      maxDiscountPct: discount,
      maxMsgsPerCustomerPerWeek: msgsPerWeek,
    });
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-paper rounded-3xl border border-soft-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Step Indicator & Skip button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-obsidian text-paper flex items-center justify-center font-display font-extrabold shadow-button">
              V
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-obsidian tracking-tight">
                VYOM
              </h2>
              <p className="text-[10px] text-charcoal">Step {onboardingStep} of 4</p>
            </div>
          </div>

          <button
            onClick={() => setOnboardingOpen(false)}
            className="text-xs font-semibold text-charcoal hover:text-obsidian px-3 py-1.5 rounded-xl border border-line hover:bg-cloud"
          >
            {t("onboarding.skip")}
          </button>
        </div>

        {/* Tagline */}
        <div className="px-6 pt-4 pb-2 text-center bg-gradient-to-b from-sky/20 to-transparent">
          <h3 className="font-display font-bold text-base sm:text-lg text-obsidian">
            Aapka AI Saathi
          </h3>
          <p className="text-xs text-charcoal mt-0.5">
            Dukaan ka chhoot gaya paisa dhoond kar recover karein
          </p>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Choose Language */}
          {onboardingStep === 1 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm text-obsidian text-center mb-2">
                {t("onboarding.step1.title")}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setLang(item.code)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      lang === item.code
                        ? "bg-sky/30 border-blue ring-2 ring-blue/20 shadow-button"
                        : "bg-paper border-soft-line hover:bg-cloud"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-obsidian">
                        {item.label}
                      </span>
                      {lang === item.code && (
                        <span className="w-5 h-5 rounded-full bg-blue text-paper flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-charcoal mt-1 block">
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Shop Details */}
          {onboardingStep === 2 && (
            <div className="space-y-3">
              <h4 className="font-display font-bold text-sm text-obsidian text-center mb-2">
                {t("onboarding.step2.title")}
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-charcoal font-semibold mb-1">
                    Dukaan Ka Naam
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-cloud border border-soft-line text-sm text-obsidian font-bold focus:outline-none focus:ring-2 focus:ring-blue/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">
                      City / Shehar
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-cloud border border-soft-line text-sm text-obsidian font-semibold focus:outline-none focus:ring-2 focus:ring-blue/30"
                    />
                  </div>

                  <div>
                    <label className="block text-charcoal font-semibold mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-cloud border border-soft-line text-sm text-obsidian font-semibold focus:outline-none focus:ring-2 focus:ring-blue/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Connect Paytm */}
          {onboardingStep === 3 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-blue/10 text-blue flex items-center justify-center mx-auto shadow-button">
                <CreditCard className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-display font-bold text-base text-obsidian">
                  {t("onboarding.step3.title")}
                </h4>
                <p className="text-xs text-charcoal max-w-sm mx-auto mt-1 leading-relaxed">
                  Vyom reads your Paytm Soundbox & QR transactions securely to spot lost sales and calculate dead hours.
                </p>
              </div>

              {paytmConnected ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>Paytm Account Connected (Merchant: Sharma Kirana #98210)</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectPaytm}
                  disabled={connectingPaytm}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue text-paper hover:bg-blue/90 font-bold text-xs sm:text-sm shadow-button flex items-center justify-center gap-2 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {connectingPaytm ? "Connecting Securely..." : "Connect Paytm Account"}
                  </span>
                </button>
              )}

              <div className="p-3 rounded-xl bg-cloud border border-soft-line text-[11px] text-charcoal text-left space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-obsidian">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Consent & Privacy:</span>
                </div>
                <p>Read-only access to transaction timestamps & amounts. Zero bank debit rights.</p>
              </div>
            </div>
          )}

          {/* STEP 4: Set Limits */}
          {onboardingStep === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-display font-bold text-base text-obsidian">
                  {t("onboarding.step4.title")}
                </h4>
                <p className="text-xs text-charcoal mt-0.5">
                  Vyom will never exceed these guardrails without your tap.
                </p>
              </div>

              {/* Weekly Budget */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-cloud border border-soft-line">
                <div className="flex justify-between text-xs font-bold text-obsidian">
                  <span>Hafte Ka Messaging Budget</span>
                  <span className="text-blue tabular-nums">₹{budget}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-blue"
                />
              </div>

              {/* Max Discount */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-cloud border border-soft-line">
                <div className="flex justify-between text-xs font-bold text-obsidian">
                  <span>Zyada Se Zyada Discount %</span>
                  <span className="text-blue tabular-nums">{discount}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full accent-blue"
                />
              </div>

              {/* Max msgs/week */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-cloud border border-soft-line">
                <div className="flex justify-between text-xs font-bold text-obsidian">
                  <span>Max Message / Grahak / Hafte</span>
                  <span className="text-blue tabular-nums">{msgsPerWeek} message</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={msgsPerWeek}
                  onChange={(e) => setMsgsPerWeek(Number(e.target.value))}
                  className="w-full accent-blue"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-soft-line bg-cloud/30 flex items-center justify-between gap-3">
          {onboardingStep > 1 ? (
            <button
              onClick={() => setOnboardingStep(onboardingStep - 1)}
              className="px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-charcoal hover:bg-cloud"
            >
              Pichhla
            </button>
          ) : (
            <div />
          )}

          {onboardingStep < 4 ? (
            <button
              onClick={() => setOnboardingStep(onboardingStep + 1)}
              className="py-2.5 px-6 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center gap-1.5"
            >
              <span>Aage Badhein</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="py-2.5 px-6 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t("onboarding.start")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
