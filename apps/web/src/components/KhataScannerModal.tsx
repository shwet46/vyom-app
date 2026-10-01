import React, { useState } from 'react';
import {
  X,
  Camera,
  Scan,
  Check,
  CheckCircle2,
  RefreshCw,
  Upload,
  IndianRupee,
} from './icons';
import { ScannedLedgerRow, UdhaarCustomer } from '../types';
import { sampleScannedRows } from '../data/mockData';
import { formatRupee } from '../utils/formatters';

interface KhataScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToLedger: (newCustomers: UdhaarCustomer[]) => void;
}

export const KhataScannerModal: React.FC<KhataScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveToLedger,
}) => {
  const [step, setStep] = useState<'capture' | 'scanning' | 'results'>('capture');
  const [scannedRows, setScannedRows] = useState<ScannedLedgerRow[]>(sampleScannedRows);

  if (!isOpen) return null;

  const handleStartScan = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('results');
    }, 2200);
  };

  const handleToggleRow = (id: string) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleUpdateAmount = (id: string, newAmt: number) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amount: newAmt } : row))
    );
  };

  const handleConfirmSave = () => {
    const selectedRows = scannedRows.filter((r) => r.selected);
    const newCustomers: UdhaarCustomer[] = selectedRows.map((r, idx) => ({
      id: `scanned-${Date.now()}-${idx}`,
      name: r.name,
      initials: r.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      phone: '+91 9822' + Math.floor(10000 + Math.random() * 90000),
      amount: r.amount,
      daysOverdue: Math.floor(5 + Math.random() * 25),
      status: 'reminder_sent',
      tone: 'soft',
      language: 'marathi',
      lastReminderDate: 'Just added via Scan',
      timeline: [
        {
          date: r.date,
          title: 'Handwritten Khata Import',
          note: `₹${r.amount} ledger scan se add hua`,
          type: 'reminder',
        },
      ],
    }));

    onSaveToLedger(newCustomers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/75 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg bg-paper rounded-3xl border border-line shadow-feature overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-paper">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue" />
            <h2 className="font-extrabold text-base text-obsidian tracking-tight">
              Khata Scanner (AI Optical OCR)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'capture' && (
            <div className="space-y-4 text-center">
              {/* Ledger Page Mockup */}
              <div className="relative rounded-2xl overflow-hidden border border-line bg-cloud aspect-[4/3] flex flex-col items-center justify-center p-4 shadow-inner">
                {/* Simulated handwritten page texture */}
                <div className="w-full h-full bg-[#fdfbf7] rounded-xl border border-amber-200/80 p-4 font-mono text-left text-xs text-charcoal/80 space-y-2 select-none pointer-events-none shadow-sm">
                  <div className="border-b border-amber-200 pb-1 font-bold text-ink flex justify-between">
                    <span>18-09-2026 / Sharma Kirana Khata</span>
                    <span>Page 42</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between border-b border-dashed border-amber-200/50 pb-0.5">
                      <span>Kishore Shirole (Dal, Ghee)</span>
                      <span className="font-bold text-ink">₹1,250</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-amber-200/50 pb-0.5">
                      <span>Nanda Tai Gaikwad (Poha, Mirchi)</span>
                      <span className="font-bold text-ink">₹820</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-amber-200/50 pb-0.5">
                      <span>Pravin Mandhare (Sugar, Atta bag)</span>
                      <span className="font-bold text-ink">₹2,400</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-amber-200/50 pb-0.5">
                      <span>Anil Kadam (Tea pack)</span>
                      <span className="font-bold text-ink">₹650</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shobha Jadhav (Grocery bundle)</span>
                      <span className="font-bold text-ink">₹1,600</span>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-obsidian/20 backdrop-blur-[1px]">
                  <div className="bg-white/95 px-4 py-2 rounded-2xl shadow-feature text-xs font-bold text-obsidian flex items-center gap-2">
                    <Scan className="w-4 h-4 text-blue animate-pulse" />
                    <span>Haath se likha bahi-khata taiyaar hai</span>
                  </div>
                </div>
              </div>

              <div className="text-left space-y-1">
                <h4 className="text-xs font-bold text-obsidian">Kaise kaam karta hai?</h4>
                <p className="text-xs text-charcoal leading-relaxed">
                  Apne register ya diary ka photo lijiye. Vyom Hindi/Marathi/English ki handwriting padh kar customer ka naam aur amount nikaal leta hai.
                </p>
              </div>

              <button
                onClick={handleStartScan}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue text-white font-bold text-xs shadow-button hover:bg-blue/90 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Photo Khinchein Aur Scan Karein</span>
              </button>
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              {/* Laser scanning visual animation */}
              <div className="relative w-64 h-44 rounded-2xl border-2 border-blue bg-[#fdfbf7] overflow-hidden p-3 shadow-feature">
                {/* Laser line moving vertically */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue to-transparent shadow-[0_0_12px_#2597d0] animate-[bounce_2s_infinite]" />
                <div className="space-y-2 opacity-50 font-mono text-[10px] text-left text-charcoal">
                  <div className="h-2 w-3/4 bg-slate-300 rounded" />
                  <div className="h-2 w-full bg-slate-200 rounded" />
                  <div className="h-2 w-1/2 bg-slate-300 rounded" />
                  <div className="h-2 w-4/5 bg-slate-200 rounded" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 font-extrabold text-sm text-obsidian">
                  <RefreshCw className="w-4 h-4 text-blue animate-spin" />
                  <span>Vyom Handwriting Padh Raha Hai...</span>
                </div>
                <p className="text-xs text-charcoal">
                  Kirana bahi-khata records digital mein convert ho rahe hain
                </p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      5 entries mil gayi hain!
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Average AI Confidence: 94%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStep('capture')}
                  className="text-xs font-semibold text-charcoal hover:text-ink underline cursor-pointer"
                >
                  Retake
                </button>
              </div>

              {/* Scanned Entries Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-obsidian flex justify-between px-1">
                  <span>Customer Naam & Taarikh</span>
                  <span>Amount & Status</span>
                </div>

                {scannedRows.map((row) => (
                  <div
                    key={row.id}
                    onClick={() => handleToggleRow(row.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      row.selected
                        ? 'bg-white border-blue shadow-xs'
                        : 'bg-cloud/60 border-soft-line opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          row.selected ? 'bg-blue text-white' : 'border border-line bg-white'
                        }`}
                      >
                        {row.selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-obsidian truncate">{row.name}</div>
                        <div className="text-[10px] text-slate">{row.date}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                        {row.confidence}% sure
                      </span>
                      <div className="flex items-center gap-1 font-extrabold text-xs text-ink">
                        <span>₹</span>
                        <input
                          type="number"
                          value={row.amount}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateAmount(row.id, Number(e.target.value))}
                          className="w-16 bg-cloud border border-line rounded px-1.5 py-0.5 text-right font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'results' && (
          <div className="p-4 border-t border-soft-line bg-paper flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-3 rounded-2xl border border-line text-xs font-bold text-charcoal hover:bg-cloud cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSave}
              className="flex-2 py-3 px-4 rounded-2xl bg-blue text-white text-xs font-extrabold shadow-button hover:bg-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Khata Ledger Mein Jodein ({scannedRows.filter((r) => r.selected).length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
