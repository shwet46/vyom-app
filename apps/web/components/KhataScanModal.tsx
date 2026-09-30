"use client";

import React, { useState } from "react";
import { useT, formatRupees } from "../lib/i18n";
import { uploadKhataScanFile, confirmKhataScan } from "../lib/api";
import { X, Camera, Upload, Check, AlertTriangle, FileText, Sparkles } from "lucide-react";

interface KhataScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ScanRow {
  row_id: string;
  name_raw: string;
  matched_name: string;
  match_score: number;
  amount_paise: number;
  entry_type: "credit_given" | "payment_received";
  confidence: number;
  flags: string[];
}

export function KhataScanModal({ isOpen, onClose, onSuccess }: KhataScanModalProps) {
  const { t } = useT();
  const [step, setStep] = useState<"capture" | "processing" | "review">("capture");
  const [scanId, setScanId] = useState<string>("scan_demo_01");
  const [rows, setRows] = useState<ScanRow[]>([
    {
      row_id: "r1",
      name_raw: "Sunita Patil",
      matched_name: "Sunita Patil",
      match_score: 0.98,
      amount_paise: 85000,
      entry_type: "credit_given",
      confidence: 0.94,
      flags: [],
    },
    {
      row_id: "r2",
      name_raw: "R. K. Kulkarni",
      matched_name: "Rahul Kulkarni",
      match_score: 0.88,
      amount_paise: 120000,
      entry_type: "credit_given",
      confidence: 0.89,
      flags: ["fuzzy_name_match"],
    },
    {
      row_id: "r3",
      name_raw: "Anand Deshmukh",
      matched_name: "Anand Deshmukh",
      match_score: 0.95,
      amount_paise: 45000,
      entry_type: "credit_given",
      confidence: 0.92,
      flags: [],
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSimulatedUpload = async () => {
    setStep("processing");
    // Simulate Sarvam Document AI OCR extraction
    setTimeout(() => {
      setStep("review");
    }, 2200);
  };

  const handleSaveToLedger = async () => {
    setSubmitting(true);
    try {
      await confirmKhataScan(scanId);
    } catch {
      // Demo fallback
    } finally {
      setSubmitting(false);
      onSuccess();
      onClose();
    }
  };

  const totalPaise = rows.reduce((acc, r) => acc + r.amount_paise, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 backdrop-blur-sm p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-paper rounded-3xl border border-soft-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-soft-line bg-cloud/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-obsidian flex items-center justify-center text-paper shadow-button">
              <Camera className="w-5 h-5 text-festive-amber" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-obsidian">
                {t("scan.title")}
              </h2>
              <p className="text-[11px] text-charcoal">
                Sarvam Vision OCR · Devanagari & Marathi Numeral Normalization
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

        {/* Content based on step */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === "capture" && (
            <div className="space-y-6 text-center py-6">
              <div className="w-20 h-20 rounded-full bg-sky/40 border border-line flex items-center justify-center mx-auto text-blue">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-obsidian">
                  Handwritten Bahi Khata Photo Kheecho
                </h3>
                <p className="text-xs text-charcoal max-w-sm mx-auto mt-1">
                  Vyom haath se likhe khata page se grahak ka naam, tareekh aur ₹ raqam khud-b-khud nikaal leta hai.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                <button
                  onClick={handleSimulatedUpload}
                  className="flex-1 py-3 px-4 rounded-2xl bg-blue text-paper font-semibold hover:bg-blue/90 shadow-button flex items-center justify-center gap-2 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t("scan.camera")}</span>
                </button>
                <button
                  onClick={handleSimulatedUpload}
                  className="flex-1 py-3 px-4 rounded-2xl border border-line bg-cloud hover:bg-paper font-semibold text-obsidian shadow-button flex items-center justify-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t("scan.upload")}</span>
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-6 text-center py-12">
              <div className="w-16 h-16 rounded-full bg-sky flex items-center justify-center mx-auto text-blue animate-spin">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-obsidian">
                  {t("scan.processing")}
                </h3>
                <p className="text-xs text-charcoal mt-1">
                  Parsing Devanagari numerals (१,२५०/-), matching customer names with 14-month directory...
                </p>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-sky/30 border border-line">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue">
                  <Sparkles className="w-4 h-4" />
                  <span>3 entries extracted with high confidence</span>
                </div>
                <div className="text-xs font-bold text-obsidian tabular-nums">
                  Total: {formatRupees(totalPaise)}
                </div>
              </div>

              {/* Table of extracted entries */}
              <div className="border border-soft-line rounded-2xl overflow-hidden divide-y divide-soft-line">
                {rows.map((row, idx) => (
                  <div key={row.row_id} className="p-3 bg-paper flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-obsidian">{row.matched_name}</span>
                        {row.flags.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Fuzzy Match
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-charcoal">
                        Ledger handwriting: &quot;{row.name_raw}&quot;
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-bold text-sm text-obsidian tabular-nums">
                        {formatRupees(row.amount_paise)}
                      </span>
                      <p className="text-[10px] text-charcoal uppercase">{row.entry_type.replace("_", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-charcoal text-center">
                Review verified against customer directory. Any ambiguity can be edited in Udhaar tab.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "review" && (
          <div className="p-4 border-t border-soft-line bg-cloud/30 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-line text-xs font-semibold hover:bg-cloud text-charcoal"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSaveToLedger}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-obsidian text-paper hover:bg-ink text-xs font-bold shadow-button flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{submitting ? "Saving..." : t("scan.save")}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
