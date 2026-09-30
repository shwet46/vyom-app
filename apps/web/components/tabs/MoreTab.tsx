"use client";

import React, { useState } from "react";
import { useVyomStore } from "../../lib/store";
import { useT, formatRupees, Language } from "../../lib/i18n";
import {
  BarChart3,
  Sliders,
  Clock,
  Sparkles,
  ShoppingBag,
  Users,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CreditCard,
  RotateCcw,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Brain,
  X,
  Radio,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { initialHeatmapData, heatmapHours } from "../../lib/mockData";

export function MoreTab() {
  const {
    guardrails,
    updateGuardrails,
    memoryChips,
    forgetMemory,
    restartOnboarding,
    resetAllDemoData,
    setActiveTab,
  } = useVyomStore();
  const { t, lang, setLang } = useT();

  const [activeSubTab, setActiveSubTab] = useState<"insights" | "settings">("insights");

  // Settings State
  const [budget, setBudget] = useState(guardrails.weeklyBudget);
  const [discount, setDiscount] = useState(guardrails.maxDiscountPct);
  const [msgsPerWeek, setMsgsPerWeek] = useState(guardrails.maxMsgsPerCustomerPerWeek);
  const [killSwitch, setKillSwitch] = useState(guardrails.killSwitch);

  const topItems = [
    { name: "Aashirvaad Shudh Chakki Atta 5kg", sales: "₹18,400", qty: "75 bags", uplift: "+14%" },
    { name: "Fortune Sunlite Sunflower Oil 1L", sales: "₹14,200", qty: "86 bottles", uplift: "-14% (dip)" },
    { name: "Special Sabudana (Vrat Grade) 500g", sales: "₹9,100", qty: "140 packs", uplift: "+240%" },
    { name: "Amul Pure Cow Ghee 1L", sales: "₹12,400", qty: "20 tins", uplift: "+95%" },
    { name: "Tata Salt Vacuum Evaporated 1kg", sales: "₹4,200", qty: "150 packets", uplift: "+8%" },
  ];

  const salesTrendData = [
    { day: "20 Sep", total: 6800, note: "" },
    { day: "22 Sep", total: 7200, note: "" },
    { day: "24 Sep", total: 8900, note: "Ganpati Feast" },
    { day: "26 Sep", total: 6400, note: "Post-fest dip" },
    { day: "28 Sep", total: 6900, note: "" },
    { day: "30 Sep", total: 7420, note: "Today" },
  ];

  const handleSaveGuardrails = () => {
    updateGuardrails({
      weeklyBudget: budget,
      maxDiscountPct: discount,
      maxMsgsPerCustomerPerWeek: msgsPerWeek,
      killSwitch,
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Sub-Tab Switcher (Dukaan Profile & Insights vs. Meri Limits) */}
      <div className="flex p-1.5 rounded-2xl bg-cloud border border-soft-line">
        <button
          onClick={() => setActiveSubTab("insights")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] ${
            activeSubTab === "insights"
              ? "bg-paper text-obsidian shadow-button"
              : "text-charcoal hover:text-obsidian"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue" />
          <span>{t("aur.tab.insights")}</span>
        </button>

        <button
          onClick={() => setActiveSubTab("settings")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] ${
            activeSubTab === "settings"
              ? "bg-paper text-obsidian shadow-button"
              : "text-charcoal hover:text-obsidian"
          }`}
        >
          <Sliders className="w-4 h-4 text-festive-amber" />
          <span>{t("aur.tab.settings")}</span>
        </button>
      </div>

      {/* ================= SECTION A: INSIGHTS ("Dukaan Profile") ================= */}
      {activeSubTab === "insights" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature">
              <span className="text-[10px] text-charcoal font-semibold uppercase block">
                {t("aur.avg_ticket")}
              </span>
              <span className="font-display font-extrabold text-2xl text-obsidian mt-1 block">
                ₹380
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                +12% vs last month
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature">
              <span className="text-[10px] text-charcoal font-semibold uppercase block">
                {t("aur.repeat_rate")}
              </span>
              <span className="font-display font-extrabold text-2xl text-blue mt-1 block">
                68%
              </span>
              <span className="text-[11px] text-charcoal mt-0.5 block">
                High Kirana loyalty
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-3xl bg-sky/30 border border-line shadow-feature">
              <span className="text-[10px] text-blue font-bold uppercase block">
                Dead Hours Window
              </span>
              <span className="font-display font-bold text-lg text-obsidian mt-1 block">
                2:00 PM – 4:00 PM
              </span>
              <span className="text-[11px] text-charcoal mt-0.5 block">
                Flash offers recover ₹2,400/wk
              </span>
            </div>
          </div>

          {/* Peak Hours Heatmap (7 Days × 12 Hours Grid) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-obsidian">
                  {t("aur.heatmap.title")}
                </h3>
                <p className="text-xs text-charcoal">
                  Darker blue represents peak footfall & Paytm Soundbox transaction density.
                </p>
              </div>

              {/* Dead Hours Legend highlight */}
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky text-blue border border-line">
                2–4 PM Dead Zone Highlighted
              </span>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto no-scrollbar pt-2">
              <div className="min-w-[480px] space-y-1.5">
                {/* Hours Header Row */}
                <div className="grid grid-cols-13 gap-1 text-center text-[9px] font-bold text-charcoal">
                  <span className="text-left font-mono">Day</span>
                  {heatmapHours.map((hr, idx) => (
                    <span
                      key={idx}
                      className={idx === 5 || idx === 6 ? "text-blue font-extrabold" : ""}
                    >
                      {hr.replace(" ", "")}
                    </span>
                  ))}
                </div>

                {/* Day Rows */}
                {initialHeatmapData.map((row) => (
                  <div key={row.day} className="grid grid-cols-13 gap-1 items-center">
                    <span className="text-xs font-bold text-obsidian font-mono">
                      {row.day}
                    </span>
                    {row.slots.map((intensity, colIdx) => {
                      const isDeadHour = colIdx === 5 || colIdx === 6;
                      // Determine background color based on intensity
                      let bg = "bg-cloud";
                      if (intensity > 85) bg = "bg-[#2597d0]";
                      else if (intensity > 60) bg = "bg-[#2597d0]/75";
                      else if (intensity > 40) bg = "bg-[#2597d0]/45";
                      else if (intensity > 20) bg = "bg-sky";

                      return (
                        <div
                          key={colIdx}
                          title={`${row.day} ${heatmapHours[colIdx]}: ${intensity}% footfall`}
                          className={`h-6 rounded-md ${bg} ${
                            isDeadHour ? "ring-1 ring-blue/50" : ""
                          } transition-all hover:scale-110 cursor-pointer flex items-center justify-center text-[9px] ${
                            intensity > 60 ? "text-paper font-bold" : "text-charcoal"
                          }`}
                        >
                          {intensity > 70 ? `${intensity}%` : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Local Signals & Upcoming Festivals Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-obsidian flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-festive-amber" />
                <span>{t("aur.signals.title")}</span>
              </h3>
              <span className="text-xs text-charcoal font-medium">Pune Zone 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setActiveTab("mauke")}
                className="p-3.5 rounded-2xl bg-sky/25 border border-line hover:border-blue cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue text-paper">
                    Navratri in 11 Days (11 Oct)
                  </span>
                  <span className="text-xs font-bold text-blue">Tap to Launch</span>
                </div>
                <p className="text-xs text-obsidian font-bold">
                  Fasting (Vrat) Samagri Combo Pack
                </p>
                <p className="text-[11px] text-charcoal">
                  Sabudana, Rajgira Atta, Cow Ghee demand expected to surge +240%.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-cloud border border-soft-line space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cloud text-charcoal border border-line">
                    Every Tuesday
                  </span>
                  <span className="text-[10px] text-charcoal">Recurring</span>
                </div>
                <p className="text-xs text-obsidian font-bold">
                  Weekly Local Haat Market Day
                </p>
                <p className="text-[11px] text-charcoal">
                  Heavy evening footfall between 5 PM and 8 PM.
                </p>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <h3 className="font-display font-bold text-base text-obsidian flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue" />
              <span>{t("aur.top_items")}</span>
            </h3>

            <div className="border border-soft-line rounded-2xl overflow-hidden divide-y divide-soft-line">
              {topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-paper flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-obsidian text-xs sm:text-sm block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-charcoal">{item.qty} sold this cycle</span>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-bold text-sm text-obsidian tabular-nums">
                      {item.sales}
                    </span>
                    <span
                      className={`text-[10px] font-bold block ${
                        item.uplift.includes("-") ? "text-error" : "text-emerald-600"
                      }`}
                    >
                      {item.uplift}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Trend with "Falling Sales" Annotation */}
          <div className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-obsidian">
                  {t("aur.sales_trend")}
                </h3>
                <p className="text-xs text-charcoal">
                  Normal post-festival feast fatigue detected between 24-26 Sep.
                </p>
              </div>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#60606c" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val}`, "Daily Sales"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid rgba(7,7,9,0.12)",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2597d0"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2597d0" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION B: SETTINGS ("Meri Limits") ================= */}
      {activeSubTab === "settings" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-lg text-obsidian">
                {t("guardrails.title")}
              </h3>
              <button
                onClick={handleSaveGuardrails}
                className="py-2 px-5 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs font-bold shadow-button"
              >
                {t("guardrails.save")}
              </button>
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              {t("guardrails.copy")}
            </p>
          </div>

          {/* Emergency Kill Switch */}
          <div className="p-4 rounded-3xl bg-red-50/70 border border-red-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-error shrink-0" />
              <div>
                <span className="font-bold text-xs sm:text-sm text-error block">
                  Emergency Kill Switch (Sab Band)
                </span>
                <span className="text-[11px] text-red-700">
                  Immediately suspends all AI campaigns, discounts, and automated credit sweeps.
                </span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={killSwitch}
              onChange={(e) => setKillSwitch(e.target.checked)}
              className="w-5 h-5 rounded accent-error"
            />
          </div>

          {/* Slider 1: Weekly Budget */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-2">
            <div className="flex justify-between text-xs font-bold text-obsidian">
              <span>{t("guardrails.budget")}</span>
              <span className="text-blue tabular-nums text-sm">₹{budget}</span>
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
            <div className="flex justify-between text-[10px] text-charcoal font-semibold">
              <span>₹500</span>
              <span>₹2,500</span>
              <span>₹5,000</span>
            </div>
          </div>

          {/* Slider 2: Max Discount */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-2">
            <div className="flex justify-between text-xs font-bold text-obsidian">
              <span>{t("guardrails.discount")}</span>
              <span className="text-blue tabular-nums text-sm">{discount}%</span>
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
            <div className="flex justify-between text-[10px] text-charcoal font-semibold">
              <span>0%</span>
              <span>15%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Slider 3: Max Messages Per Customer */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-2">
            <div className="flex justify-between text-xs font-bold text-obsidian">
              <span>{t("guardrails.freq")}</span>
              <span className="text-blue tabular-nums text-sm">
                {msgsPerWeek} message / week
              </span>
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

          {/* Quiet Hours Display */}
          <div className="p-4 rounded-3xl bg-cloud border border-soft-line flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-charcoal" />
              <div>
                <span className="font-bold text-obsidian block">
                  {t("guardrails.quiet")}
                </span>
                <span className="text-[11px] text-charcoal">
                  Zero messages dispatched to customers during night hours
                </span>
              </div>
            </div>
            <span className="font-mono font-bold text-obsidian bg-paper px-2.5 py-1 rounded-xl border border-line">
              21:00 – 08:00 IST
            </span>
          </div>

          {/* Language Selection Setting */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <span className="text-xs font-bold text-obsidian block">
              {t("guardrails.language")}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { code: "hinglish", label: "Hinglish" },
                { code: "mr", label: "मराठी" },
                { code: "hi", label: "हिन्दी" },
                { code: "en", label: "English" },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code as Language)}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    lang === l.code
                      ? "bg-sky text-blue border-blue shadow-button"
                      : "bg-cloud text-charcoal border-soft-line hover:bg-paper"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connected Paytm Account Section */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-blue" />
                <div>
                  <span className="text-xs font-bold text-obsidian block">
                    Connected Paytm Account
                  </span>
                  <span className="text-[11px] text-charcoal">
                    Merchant ID: SHARMA_PUNE_98210
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Active & Synced
              </span>
            </div>
          </div>

          {/* What Vyom Remembers (Memory List) */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-obsidian flex items-center gap-2">
                <Brain className="w-4 h-4 text-festive-amber" />
                <span>What Vyom Remembers</span>
              </h4>
              <span className="text-[11px] text-charcoal">{memoryChips.length} memories</span>
            </div>

            <div className="space-y-2">
              {memoryChips.map((chip, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-cloud border border-soft-line flex items-center justify-between text-xs"
                >
                  <span className="text-obsidian font-medium">{chip}</span>
                  <button
                    onClick={() => forgetMemory(chip)}
                    className="text-slate hover:text-error p-1"
                    title="Forget memory"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Maintenance & Reset Actions */}
          <div className="p-5 rounded-3xl bg-cloud border border-soft-line space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal block">
              Demo Actions
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={restartOnboarding}
                className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-paper hover:bg-cloud text-xs font-bold text-obsidian shadow-button flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4 text-blue" />
                <span>Restart Onboarding Tour</span>
              </button>

              <button
                onClick={resetAllDemoData}
                className="flex-1 py-2.5 px-4 rounded-xl border border-line bg-paper hover:bg-red-50 text-xs font-bold text-error shadow-button flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
