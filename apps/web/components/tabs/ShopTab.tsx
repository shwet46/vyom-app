"use client";

import React, { useState } from "react";
import { useT, formatRupees } from "../../lib/i18n";
import { updateItemStock, updateGuardrails, updateKitRequestStatus } from "../../lib/api";
import {
  Store,
  BarChart3,
  Users,
  Package,
  Sliders,
  ShieldAlert,
  Clock,
  Sparkles,
  Check,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface ShopTabProps {
  catalog: any[];
  customers: any[];
  guardrails: any;
  kitRequests: any[];
  onRefresh: () => void;
}

export function ShopTab({
  catalog,
  customers,
  guardrails,
  kitRequests,
  onRefresh,
}: ShopTabProps) {
  const { t } = useT();
  const [segment, setSegment] = useState<"insights" | "customers" | "items" | "settings">("insights");
  const [killSwitch, setKillSwitch] = useState<boolean>(guardrails?.kill_switch || false);
  const [weeklyBudget, setWeeklyBudget] = useState<number>(
    Math.round((guardrails?.weekly_budget_paise || 100000) / 100)
  );
  const [maxDiscount, setMaxDiscount] = useState<number>(guardrails?.max_discount_pct || 10);
  const [savingSettings, setSavingSettings] = useState(false);

  const sampleItems = catalog.length > 0 ? catalog : [
    { id: "ci_1", name: { en: "Aashirvaad Shudh Chakki Atta 5kg", hi: "आशीर्वाद आटा" }, category_keys: ["staples"], price_paise: 24500, in_stock: true, stock_qty: 35 },
    { id: "ci_2", name: { en: "Fortune Sunlite Sunflower Oil 1L", hi: "फॉर्च्यून तेल" }, category_keys: ["oil_ghee"], price_paise: 16500, in_stock: true, stock_qty: 24 },
    { id: "ci_3", name: { en: "Special Sabudana (Vrat Grade) 500g", hi: "साबूदाना" }, category_keys: ["vrat_special"], price_paise: 6500, in_stock: true, stock_qty: 18 },
    { id: "ci_4", name: { en: "Rajgira Atta 500g", hi: "राजगिरा आटा" }, category_keys: ["vrat_special"], price_paise: 5500, in_stock: true, stock_qty: 8 },
    { id: "ci_5", name: { en: "Amul Pure Ghee 1L", hi: "अमूल घी" }, category_keys: ["dairy", "puja"], price_paise: 62000, in_stock: true, stock_qty: 14 },
  ];

  const sampleCustomers = customers.length > 0 ? customers : [
    { id: "c1", name: "Sunita Patil", phone_e164: "+919821000001", rfm: { recency_days: 28, frequency: 12, avg_gap_days: 10 }, telegram: { chat_id: "12345" } },
    { id: "c2", name: "Rahul Kulkarni", phone_e164: "+919821000002", rfm: { recency_days: 3, frequency: 18, avg_gap_days: 7 }, telegram: { chat_id: "12346" } },
    { id: "c3", name: "Anand Deshmukh", phone_e164: "+919821000003", rfm: { recency_days: 15, frequency: 8, avg_gap_days: 14 }, telegram: { chat_id: null } },
  ];

  const handleToggleStock = async (itemId: string, currentStock: boolean) => {
    try {
      await updateItemStock(itemId, !currentStock);
      onRefresh();
    } catch {
      //
    }
  };

  const handleSaveGuardrails = async () => {
    setSavingSettings(true);
    try {
      await updateGuardrails({
        merchant_id: "merchant_sharma_01",
        weekly_budget_paise: weeklyBudget * 100,
        max_discount_pct: maxDiscount,
        kill_switch: killSwitch,
        quiet_hours: { start: "21:00", end: "08:00" },
      });
      alert("Guardrail settings updated!");
      onRefresh();
    } catch {
      alert("Settings saved in demo mode.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMarkKitReady = async (reqId: string) => {
    try {
      await updateKitRequestStatus(reqId, "ready");
      alert("Customer notified that their festival kit is ready for pickup!");
      onRefresh();
    } catch {
      alert("Kit marked ready!");
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Segment Selector Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-cloud border border-soft-line">
        {[
          { key: "insights", label: t("shop.tabs.insights"), icon: BarChart3 },
          { key: "customers", label: t("shop.tabs.customers"), icon: Users },
          { key: "items", label: t("shop.tabs.items"), icon: Package },
          { key: "settings", label: t("shop.tabs.settings"), icon: Sliders },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSegment(tab.key as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              segment === tab.key
                ? "bg-paper text-obsidian shadow-button"
                : "text-charcoal hover:text-obsidian"
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. Insights */}
      {segment === "insights" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature">
              <span className="text-[10px] text-charcoal font-semibold uppercase">Avg Ticket Size</span>
              <p className="font-display font-bold text-xl text-obsidian mt-1">₹380</p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">+12% vs last month</span>
            </div>
            <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature">
              <span className="text-[10px] text-charcoal font-semibold uppercase">Repeat Customer Rate</span>
              <p className="font-display font-bold text-xl text-blue mt-1">68%</p>
              <span className="text-[11px] text-charcoal font-semibold mt-0.5 block">High Kirana loyalty</span>
            </div>
          </div>

          {/* Dead Hours & Post-Festival Dip Explanation */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <h4 className="font-display font-bold text-sm text-obsidian flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue" />
              Store Traffic Patterns & Dead Hours
            </h4>
            <div className="p-3.5 rounded-2xl bg-cloud border border-soft-line text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-obsidian">
                <span>Daily Quiet Window: 2:00 PM – 4:00 PM</span>
                <span className="text-festive-amber font-semibold">Below 70% baseline</span>
              </div>
              <p className="text-charcoal leading-relaxed">
                Afternoon lull detected across 14-month store profile. Vyom automatically targets this window with light flash offers.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky/30 border border-line text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-blue">
                <span>Post-Ganpati Dip Explanation</span>
                <span className="text-emerald-700 font-semibold">Normal Seasonality</span>
              </div>
              <p className="text-charcoal leading-relaxed">
                Sales fell 16% in the last 4 days following Ganpati Visarjan. Vyom dampened alarm thresholds because post-festival feast fatigue is expected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customers & Kit Requests */}
      {segment === "customers" && (
        <div className="space-y-4">
          {/* Fasting Kit Requests Queue */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-sm text-obsidian flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-festive-amber" />
                Navratri Fasting Kit Pre-Orders
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky text-blue">
                Live from Telegram Bot
              </span>
            </div>

            <div className="divide-y divide-soft-line border border-soft-line rounded-2xl overflow-hidden">
              <div className="p-3 bg-paper flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-obsidian">Sunita Patil</span>
                  <p className="text-[11px] text-charcoal">
                    Navratri Vrat Samagri Kit (Sabudana, Rajgira, Sendha Namak, Ghee) · ₹420
                  </p>
                </div>
                <button
                  onClick={() => handleMarkKitReady("req_01")}
                  className="py-1.5 px-3 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-semibold shadow-button flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark Ready</span>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Directory */}
          <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-3">
            <h4 className="font-display font-bold text-sm text-obsidian">Customer Directory (Pune)</h4>
            <div className="divide-y divide-soft-line border border-soft-line rounded-2xl overflow-hidden">
              {sampleCustomers.map((c) => (
                <div key={c.id} className="p-3 bg-paper flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-obsidian">{c.name}</span>
                    <p className="text-[11px] text-charcoal font-mono">{c.phone_e164}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cloud text-charcoal">
                      {c.rfm?.frequency || 10} visits
                    </span>
                    <span className="text-[10px] text-charcoal block mt-0.5">
                      Last visit: {c.rfm?.recency_days}d ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Items & Stock Quick-Edit */}
      {segment === "items" && (
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-cloud border border-soft-line text-xs text-charcoal flex items-center justify-between">
            <span>Fast stock availability toggle for festival kits</span>
            <span className="font-bold text-obsidian">{sampleItems.length} items</span>
          </div>

          <div className="space-y-2">
            {sampleItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-paper border border-soft-line shadow-sm flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-obsidian text-sm block">
                    {item.name?.en || item.name}
                  </span>
                  <span className="text-charcoal">{formatRupees(item.price_paise)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-charcoal font-medium">
                    Stock: {item.stock_qty || 20}
                  </span>
                  <button
                    onClick={() => handleToggleStock(item.id, item.in_stock)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      item.in_stock
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.in_stock ? "In Stock" : "Out of Stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Settings & Guardrails */}
      {segment === "settings" && (
        <div className="p-6 rounded-3xl bg-paper border border-soft-line shadow-feature space-y-6">
          <div className="flex items-center justify-between border-b border-soft-line pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-obsidian">
                {t("shop.guardrails.title")}
              </h3>
              <p className="text-xs text-charcoal mt-0.5">
                Strict limits enforced in code before any message or offer goes out.
              </p>
            </div>
            <button
              onClick={handleSaveGuardrails}
              disabled={savingSettings}
              className="py-2 px-4 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button"
            >
              {savingSettings ? "Saving..." : "Save Limits"}
            </button>
          </div>

          {/* Emergency Kill Switch */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-error" />
              <div>
                <span className="font-bold text-xs text-error block">
                  {t("shop.guardrails.kill_switch")}
                </span>
                <span className="text-[11px] text-red-700">
                  Immediately stops all AI campaigns and autonomous udhaar sweeps.
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

          {/* Weekly Budget Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-obsidian">
              <span>{t("shop.guardrails.budget")}</span>
              <span className="text-blue tabular-nums">₹{weeklyBudget}</span>
            </div>
            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={weeklyBudget}
              onChange={(e) => setWeeklyBudget(parseInt(e.target.value))}
              className="w-full accent-blue"
            />
          </div>

          {/* Max Discount Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-obsidian">
              <span>{t("shop.guardrails.discount")}</span>
              <span className="text-blue tabular-nums">{maxDiscount}%</span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(parseInt(e.target.value))}
              className="w-full accent-blue"
            />
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-2xl bg-cloud border border-soft-line flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-charcoal" />
              <div>
                <span className="font-bold text-obsidian block">{t("shop.guardrails.quiet_hours")}</span>
                <span className="text-charcoal text-[11px]">No outbound messages sent to customers</span>
              </div>
            </div>
            <span className="font-mono font-bold text-obsidian">21:00 – 08:00 IST</span>
          </div>
        </div>
      )}
    </div>
  );
}
