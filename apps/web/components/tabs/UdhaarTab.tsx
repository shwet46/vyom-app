"use client";

import React, { useState } from "react";
import { useVyomStore } from "../../lib/store";
import { useT, formatRupees } from "../../lib/i18n";
import { UdhaarCustomer } from "../../lib/mockData";
import { CustomerDetailModal } from "../CustomerDetailModal";
import { KhataScanModal } from "../KhataScanModal";
import {
  Camera,
  Plus,
  Send,
  Check,
  Search,
  Clock,
  AlertCircle,
  ShieldCheck,
  Phone,
  Filter,
} from "lucide-react";

export function UdhaarTab() {
  const {
    udhaarCustomers,
    autonomousReminders,
    toggleAutonomousReminders,
    sendUdhaarReminder,
    markUdhaarPaid,
    addUdhaarEntry,
  } = useVyomStore();
  const { t } = useT();

  const [selectedCustomer, setSelectedCustomer] = useState<UdhaarCustomer | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "promised" | "paid">("all");

  const totalOutstanding = udhaarCustomers
    .filter((c) => c.status !== "Paid ✓")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOverdue = udhaarCustomers
    .filter((c) => c.daysOverdue >= 30 && c.status !== "Paid ✓")
    .reduce((sum, c) => sum + c.amount, 0);

  const filtered = udhaarCustomers.filter((c) => {
    if (filter === "overdue" && c.daysOverdue < 30) return false;
    if (filter === "promised" && c.status !== "Promised") return false;
    if (filter === "paid" && c.status !== "Paid ✓") return false;
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.phone.includes(search)
    ) {
      return false;
    }
    return true;
  });

  const handleCreate = () => {
    if (!newName.trim() || !newAmount) return;
    addUdhaarEntry(newName.trim(), newPhone.trim(), Number(newAmount));
    setAddModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewAmount("");
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature text-center">
          <span className="text-[10px] text-charcoal font-semibold uppercase block">
            {t("udhaar.total")}
          </span>
          <span className="font-display font-extrabold text-base sm:text-xl text-obsidian tabular-nums mt-1 block">
            {formatRupees(totalOutstanding)}
          </span>
          <span className="text-[10px] text-charcoal mt-0.5 block">
            {udhaarCustomers.filter((c) => c.status !== "Paid ✓").length} Active
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature text-center">
          <span className="text-[10px] text-error font-semibold uppercase block">
            {t("udhaar.overdue")}
          </span>
          <span className="font-display font-extrabold text-base sm:text-xl text-error tabular-nums mt-1 block">
            {formatRupees(totalOverdue || 21700)}
          </span>
          <span className="text-[10px] text-error mt-0.5 block">
            30+ Din Purana
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-paper border border-soft-line shadow-feature text-center">
          <span className="text-[10px] text-emerald-700 font-semibold uppercase block">
            {t("udhaar.collected")}
          </span>
          <span className="font-display font-extrabold text-base sm:text-xl text-emerald-600 tabular-nums mt-1 block">
            ₹9,200
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">
            Soundbox Sync
          </span>
        </div>
      </div>

      {/* 2. Autonomous Reminders ON Strip & Action Controls */}
      <div className="p-4 rounded-3xl bg-cloud border border-soft-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-paper border border-line flex items-center justify-center text-blue shadow-button">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-obsidian block">
              {t("udhaar.auto_toggle")}
            </span>
            <span className="text-[11px] text-charcoal">
              Polite morning & evening sweeps respecting quiet hours
            </span>
          </div>
        </div>

        <button
          onClick={toggleAutonomousReminders}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            autonomousReminders ? "bg-blue" : "bg-slate/40"
          }`}
          role="switch"
          aria-checked={autonomousReminders}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-lg ring-0 transition duration-200 ease-in-out ${
              autonomousReminders ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* 3. Primary Action Buttons (Khata Scan + Manual Add) */}
      <div className="flex gap-2.5">
        <button
          onClick={() => setScanModalOpen(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-blue text-paper hover:bg-blue/90 font-bold text-xs sm:text-sm shadow-button flex items-center justify-center gap-2 transition-transform active:scale-95 min-h-[48px]"
        >
          <Camera className="w-4 h-4" />
          <span>{t("udhaar.scan_fab")} (OCR)</span>
        </button>

        <button
          onClick={() => setAddModalOpen(true)}
          className="py-3 px-4 rounded-2xl bg-paper border border-line text-xs sm:text-sm font-bold text-obsidian hover:bg-cloud shadow-button flex items-center justify-center gap-1.5 min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          <span>{t("udhaar.add_entry")}</span>
        </button>
      </div>

      {/* 4. Search and Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone number..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cloud border border-soft-line text-xs text-obsidian placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", "overdue", "promised", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all min-h-[36px] ${
                filter === f
                  ? "bg-obsidian text-paper shadow-button"
                  : "bg-cloud text-charcoal hover:text-obsidian border border-line"
              }`}
            >
              {f === "all"
                ? t("udhaar.filter.all")
                : f === "overdue"
                ? t("udhaar.filter.overdue")
                : f === "promised"
                ? t("udhaar.filter.promised")
                : t("udhaar.filter.paid")}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Customer Ledger List */}
      <div className="space-y-3">
        {filtered.map((cust) => {
          const isOverdue30 = cust.daysOverdue >= 30;
          return (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              className="p-4 sm:p-5 rounded-3xl bg-paper border border-soft-line shadow-sm hover:shadow-feature transition-all space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-obsidian text-paper flex items-center justify-center font-display font-bold text-xs shadow-button shrink-0">
                    {cust.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-sm text-obsidian">
                        {cust.name}
                      </h4>
                      {cust.status === "Paid ✓" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {t("udhaar.status.paid")}
                        </span>
                      ) : isOverdue30 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-error flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {cust.daysOverdue}d overdue
                        </span>
                      ) : cust.status === "Promised" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky text-blue">
                          Promised {cust.promiseDate}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cloud text-charcoal">
                          {t("udhaar.status.reminded")} ({cust.remindersCount})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-charcoal font-mono block mt-0.5">
                      {cust.phone}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-display font-extrabold text-base text-obsidian tabular-nums">
                    {formatRupees(cust.amount)}
                  </span>
                  <span className="text-[10px] text-charcoal block">Balance Due</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-soft-line">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendUdhaarReminder(cust.id);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-line hover:bg-cloud text-xs font-semibold text-obsidian flex items-center justify-center gap-1.5 transition-colors min-h-[42px]"
                >
                  <Send className="w-3.5 h-3.5 text-blue" />
                  <span>Send Reminder ({cust.tone})</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markUdhaarPaid(cust.id);
                  }}
                  className="py-2 px-4 rounded-xl bg-cloud hover:bg-emerald-50 text-emerald-800 border border-line text-xs font-semibold flex items-center gap-1 transition-colors min-h-[42px]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Paid ✓</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Add Entry Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-paper rounded-3xl p-6 border border-soft-line shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-obsidian">
              Naya Khata Entry Jodein
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-charcoal font-semibold mb-1">
                  Grahak Ka Naam
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Anand Deshmukh"
                  className="w-full p-3 rounded-xl bg-cloud border border-soft-line text-obsidian font-semibold focus:outline-none focus:ring-2 focus:ring-blue/30"
                />
              </div>

              <div>
                <label className="block text-charcoal font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98210 00000"
                  className="w-full p-3 rounded-xl bg-cloud border border-soft-line text-obsidian font-semibold focus:outline-none focus:ring-2 focus:ring-blue/30"
                />
              </div>

              <div>
                <label className="block text-charcoal font-semibold mb-1">
                  Udhaar Raqam (₹)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="850"
                  className="w-full p-3 rounded-xl bg-cloud border border-soft-line text-obsidian font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue/30 tabular-nums"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-line text-xs font-semibold text-charcoal hover:bg-cloud"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 rounded-xl bg-blue text-paper text-xs font-bold shadow-button"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Timeline Sheet */}
      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />

      {/* Khata OCR Scanner Modal */}
      <KhataScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
      />
    </div>
  );
}
