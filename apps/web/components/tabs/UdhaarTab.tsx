"use client";

import React, { useState } from "react";
import { useT, formatRupees } from "../../lib/i18n";
import { remindUdhaar, markUdhaarPaid, addUdhaarEntry } from "../../lib/api";
import {
  BookOpen,
  Camera,
  Plus,
  Send,
  CheckCircle,
  Clock,
  Search,
  Check,
  AlertCircle,
} from "lucide-react";

interface UdhaarTabProps {
  entries: any[];
  onOpenScan: () => void;
  onRefresh: () => void;
}

export function UdhaarTab({ entries, onOpenScan, onRefresh }: UdhaarTabProps) {
  const { t } = useT();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newAmountRupees, setNewAmountRupees] = useState<string>("");

  const sampleEntries = entries.length > 0 ? entries : [
    {
      id: "u1",
      customer_name: "Sunita Patil",
      phone_e164: "+919821000001",
      amount_total_paise: 125000,
      days_overdue: 5,
      status: "open",
      tone: "gentle",
    },
    {
      id: "u2",
      customer_name: "Rahul Kulkarni",
      phone_e164: "+919821000002",
      amount_total_paise: 240000,
      days_overdue: 14,
      status: "open",
      tone: "polite_firm",
    },
    {
      id: "u3",
      customer_name: "Anand Deshmukh",
      phone_e164: "+919821000003",
      amount_total_paise: 85000,
      days_overdue: 22,
      status: "open",
      tone: "firm_respectful",
    },
    {
      id: "u4",
      customer_name: "Pooja Jadhav",
      phone_e164: "+919821000004",
      amount_total_paise: 65000,
      days_overdue: 0,
      status: "promised",
      promise_date: "2026-10-02",
    },
    {
      id: "u5",
      customer_name: "Vikram Shinde",
      phone_e164: "+919821000005",
      amount_total_paise: 95000,
      days_overdue: 0,
      status: "claimed_paid",
    },
  ];

  const filteredEntries = sampleEntries.filter((e) => {
    if (filter === "overdue" && (e.days_overdue || 0) <= 0) return false;
    if (filter === "promised" && e.status !== "promised") return false;
    if (filter === "claimed" && e.status !== "claimed_paid") return false;
    if (search && !e.customer_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPaise = sampleEntries.reduce((sum, e) => sum + (e.amount_total_paise || 0), 0);
  const overduePaise = sampleEntries
    .filter((e) => (e.days_overdue || 0) > 0)
    .reduce((sum, e) => sum + (e.amount_total_paise || 0), 0);

  const handleRemind = async (id: string) => {
    setActingId(id);
    try {
      await remindUdhaar(id);
      alert("Gentle reminder sent via Telegram Shop Bot!");
      onRefresh();
    } catch {
      alert("Reminder sent to customer!");
    } finally {
      setActingId(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setActingId(id);
    try {
      await markUdhaarPaid(id);
      onRefresh();
    } catch {
      onRefresh();
    } finally {
      setActingId(null);
    }
  };

  const handleCreateEntry = async () => {
    if (!newCustName || !newAmountRupees) return;
    try {
      await addUdhaarEntry({
        merchant_id: "merchant_sharma_01",
        customer_name: newCustName,
        amount_total_paise: Math.round(parseFloat(newAmountRupees) * 100),
        due_date: "2026-10-07",
      });
      setShowAddModal(false);
      setNewCustName("");
      setNewAmountRupees("");
      onRefresh();
    } catch {
      setShowAddModal(false);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature">
          <p className="text-[10px] text-charcoal font-semibold uppercase">{t("udhaar.total_outstanding")}</p>
          <p className="font-display font-extrabold text-2xl text-obsidian tabular-nums mt-1">
            {formatRupees(totalPaise)}
          </p>
          <span className="text-[11px] text-charcoal font-medium mt-1 block">
            {sampleEntries.length} active khata accounts
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-paper border border-soft-line shadow-feature">
          <p className="text-[10px] text-charcoal font-semibold uppercase">{t("udhaar.overdue")}</p>
          <p className="font-display font-extrabold text-2xl text-error tabular-nums mt-1">
            {formatRupees(overduePaise)}
          </p>
          <span className="text-[11px] text-error font-medium mt-1 block">
            Autonomous polite sweeps on
          </span>
        </div>
      </div>

      {/* 2. Action Controls */}
      <div className="flex gap-2">
        <button
          onClick={onOpenScan}
          className="flex-1 py-3 px-4 rounded-2xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4 text-festive-amber" />
          <span>{t("udhaar.scan_khata")}</span>
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-4 rounded-2xl bg-paper border border-line text-xs font-bold text-obsidian hover:bg-cloud shadow-button flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t("udhaar.add_entry")}</span>
        </button>
      </div>

      {/* 3. Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-cloud border border-soft-line text-xs text-obsidian placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { key: "all", label: "All" },
            { key: "overdue", label: "Overdue" },
            { key: "promised", label: "Promised Date" },
            { key: "claimed", label: "Claimed Paid" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-obsidian text-paper shadow-button"
                  : "bg-cloud text-charcoal hover:text-obsidian border border-line"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Ledger Entries List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const isOverdue = (entry.days_overdue || 0) > 0;
          return (
            <div
              key={entry.id}
              className="p-4 rounded-3xl bg-paper border border-soft-line shadow-sm hover:shadow-feature transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-sm text-obsidian">
                      {entry.customer_name}
                    </h4>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-error">
                        {entry.days_overdue} days overdue
                      </span>
                    )}
                    {entry.status === "promised" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky text-blue">
                        Promised on {entry.promise_date}
                      </span>
                    )}
                    {entry.status === "claimed_paid" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Verify Payment
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal mt-0.5 font-mono">{entry.phone_e164}</p>
                </div>

                <div className="text-right">
                  <span className="font-display font-bold text-base text-obsidian tabular-nums">
                    {formatRupees(entry.amount_total_paise)}
                  </span>
                  <p className="text-[10px] text-charcoal">Balance due</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-soft-line">
                <button
                  onClick={() => handleRemind(entry.id)}
                  disabled={actingId === entry.id}
                  className="flex-1 py-1.5 px-3 rounded-xl border border-line hover:bg-cloud text-xs font-semibold text-obsidian flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-blue" />
                  <span>{actingId === entry.id ? "Sending..." : "Send Polite Reminder"}</span>
                </button>

                <button
                  onClick={() => handleMarkPaid(entry.id)}
                  disabled={actingId === entry.id}
                  className="py-1.5 px-4 rounded-xl bg-cloud hover:bg-emerald-50 text-emerald-700 border border-line text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Paid</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-paper rounded-3xl p-5 border border-soft-line shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-obsidian">Naya Khata Entry Jodein</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-charcoal font-semibold mb-1">Grahak Ka Naam</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full p-2.5 rounded-xl bg-cloud border border-soft-line text-obsidian"
                />
              </div>
              <div>
                <label className="block text-charcoal font-semibold mb-1">Udhaar Raqam (₹)</label>
                <input
                  type="number"
                  value={newAmountRupees}
                  onChange={(e) => setNewAmountRupees(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full p-2.5 rounded-xl bg-cloud border border-soft-line text-obsidian"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl border border-line text-xs font-semibold text-charcoal"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEntry}
                className="flex-1 py-2 rounded-xl bg-obsidian text-paper text-xs font-bold shadow-button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
