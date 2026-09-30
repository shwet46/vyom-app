"use client";

import React, { useState } from "react";
import { useVyomStore } from "../lib/store";
import { useT, formatRupees } from "../lib/i18n";
import {
  X,
  Camera,
  Upload,
  Check,
  Sparkles,
  FileText,
  AlertCircle,
  Edit2,
  Trash2,
} from "lucide-react";

interface KhataScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedEntry {
  id: string;
  name: string;
  amount: number;
  date: string;
  confidence: number;
}

export function KhataScanModal({ isOpen, onClose }: KhataScanModalProps) {
  const { batchAddScannedEntries } = useVyomStore();
  const { t } = useT();

  const [step, setStep] = useState<"capture" | "scanning" | "review">("capture");
  const [extracted, setExtracted] = useState<ExtractedEntry[]>([
    { id: "e1", name: "Sunita Patil", amount: 1250, date: "28 Sep 2026", confidence: 0.98 },
    { id: "e2", name: "Rahul Kulkarni", amount: 2400, date: "26 Sep 2026", confidence: 0.89 },
    { id: "e3", name: "Anand Deshmukh", amount: 850, date: "24 Sep 2026", confidence: 0.95 },
    { id: "e4", name: "Pooja Jadhav", amount: 650, date: "29 Sep 2026", confidence: 0.92 },
  ]);

  if (!isOpen) return null;

  const handleStartScan = () => {
    setStep("scanning");
    setTimeout(() => {
      setStep("review");
    }, 2400);
  };

  const handleSave = () => {
    batchAddScannedEntries(
      extracted.map((e) => ({ name: e.name, amount: e.amount }))
    );
    onClose();
    setStep("capture");
  };

  const updateAmount = (id: string, newAmt: number) => {
    setExtracted((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: newAmt } : item))
    );
  };

  const updateName = (id: string, newName: string) => {
    setExtracted((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const deleteRow = (id: string) => {
    setExtracted((prev) => prev.filter((item) => item.id !== id));
  };

  const totalScanned = extracted.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-obsidian/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-paper sm:rounded-3xl rounded-t-3xl border border-soft-line shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue text-paper flex items-center justify-center font-bold shadow-button">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-obsidian">
                Khata Photo Scanner
              </h3>
              <p className="text-[11px] text-charcoal">
                Handwritten ledger OCR & Devanagari numerals
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
          {/* STEP 1: CAPTURE */}
          {step === "capture" && (
            <div className="space-y-4 text-center py-2">
              {/* Handwritten Ledger Illustration/Canvas */}
              <div className="relative mx-auto max-w-xs h-48 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center p-4 shadow-sm overflow-hidden">
                <div className="absolute top-2 left-3 text-[10px] font-mono text-amber-900 opacity-60">
                  || श्री गणेशाय नमः || 28-09-2026
                </div>
                <div className="w-full space-y-2 mt-4 text-left font-mono text-xs text-amber-950 opacity-80 select-none">
                  <div className="flex justify-between border-b border-amber-200 pb-1">
                    <span>सुनीता पाटील (आटा+तेल)</span>
                    <span className="font-bold">₹1,250</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-200 pb-1">
                    <span>राहुल कुलकर्णी (किराणा)</span>
                    <span className="font-bold">₹2,400</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-200 pb-1">
                    <span>आनंद देशमुख (मसाले)</span>
                    <span className="font-bold">₹850</span>
                  </div>
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] font-bold text-blue flex items-center gap-1 bg-paper/80 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Ready</span>
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-base text-obsidian">
                  Haath Se Likha Bahi Khata Scan Karein
                </h4>
                <p className="text-xs text-charcoal max-w-sm mx-auto mt-1 leading-relaxed">
                  Vyom haath ke likhe khate se grahak ka naam, tareekh aur ₹ raqam khud-b-khud extract kar leta hai.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto pt-2">
                <button
                  onClick={handleStartScan}
                  className="flex-1 py-3 px-4 rounded-2xl bg-blue text-paper hover:bg-blue/90 font-bold text-xs sm:text-sm shadow-button flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera Se Photo Lein</span>
                </button>

                <button
                  onClick={handleStartScan}
                  className="flex-1 py-3 px-4 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-xs text-obsidian shadow-button flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Gallery Se Chunein</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SCANNING ANIMATION */}
          {step === "scanning" && (
            <div className="space-y-6 text-center py-10">
              <div className="relative mx-auto w-32 h-32 rounded-3xl bg-sky/30 border border-blue/40 flex items-center justify-center overflow-hidden shadow-elevated">
                <FileText className="w-16 h-16 text-blue opacity-50" />
                {/* Laser scan line */}
                <div className="absolute left-0 right-0 h-1 bg-blue shadow-lg shadow-blue/50 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-base text-obsidian flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue animate-spin" />
                  <span>Devanagari Likhavat Padh Rahe Hain...</span>
                </h4>
                <p className="text-xs text-charcoal max-w-xs mx-auto">
                  Matching customer names with 14-month Paytm directory and normalizing ₹ amounts.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW EXTRACTED ROWS */}
          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky/30 border border-line">
                <div className="flex items-center gap-2 text-xs font-bold text-blue">
                  <Sparkles className="w-4 h-4" />
                  <span>4 entries extracted with high confidence</span>
                </div>
                <div className="text-xs font-bold text-obsidian tabular-nums">
                  Total: {formatRupees(totalScanned)}
                </div>
              </div>

              {/* Extracted Editable Rows Table */}
              <div className="border border-soft-line rounded-2xl overflow-hidden divide-y divide-soft-line bg-paper">
                {extracted.map((row) => (
                  <div
                    key={row.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateName(row.id, e.target.value)}
                          className="font-bold text-obsidian bg-transparent border-b border-transparent hover:border-line focus:border-blue focus:outline-none text-xs"
                        />
                        {/* Confidence Dot */}
                        <span
                          className={`w-2 h-2 rounded-full ${
                            row.confidence >= 0.95
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                          title={`OCR Confidence: ${Math.round(row.confidence * 100)}%`}
                        />
                      </div>
                      <span className="text-[10px] text-charcoal block">{row.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-cloud px-2 py-1 rounded-xl border border-soft-line">
                        <span className="font-bold text-obsidian">₹</span>
                        <input
                          type="number"
                          value={row.amount}
                          onChange={(e) => updateAmount(row.id, Number(e.target.value))}
                          className="w-16 font-display font-bold text-sm text-obsidian bg-transparent text-right focus:outline-none tabular-nums"
                        />
                      </div>

                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1.5 rounded-lg text-charcoal hover:text-error hover:bg-cloud"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-charcoal text-center">
                Review and edit any row before saving directly into your active credit ledger.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "review" && (
          <div className="p-4 border-t border-soft-line bg-cloud/30 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep("capture")}
              className="px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-charcoal hover:bg-cloud"
            >
              Dobara Scan Karein
            </button>

            <button
              onClick={handleSave}
              className="py-2.5 px-6 rounded-xl bg-blue text-paper hover:bg-blue/90 text-xs sm:text-sm font-bold shadow-button flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save to Ledger ({extracted.length} entries)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
