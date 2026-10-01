import React, { useState } from 'react';
import {
  X,
  Play,
  CreditCard,
  FastForward,
  CheckCircle2,
  Sliders,
  Calendar,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Volume2,
} from './icons';
import {
  advanceDemoTime,
  resetDemoState,
  simulateCustomerVisit,
  simulateSoundboxPayment,
} from '../services/api';
import { formatRupee } from '../utils/formatters';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  onAddToast?: (msg: string) => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onAddToast,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    if (onAddToast) onAddToast(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSimulateVisit = async () => {
    setLoadingAction('visit');
    try {
      const res = await simulateCustomerVisit({
        amount_paise: 42000, // ₹420
        payment_mode: 'UPI',
      });
      showStatus(`Grahak Aavak: ${res.customer_name || 'Walk-in'} ne ₹${res.amount_paise / 100} ka samaan kharida!`);
      if (onRefreshData) onRefreshData();
    } catch {
      showStatus('Simulated: Sunita Patil ne ₹420 ka Navratri Vrat Pack kharida (Local Mode)');
      if (onRefreshData) onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulatePayment = async () => {
    setLoadingAction('payment');
    try {
      const res = await simulateSoundboxPayment({
        amount_paise: 180000, // ₹1,800
      });
      showStatus(`Paytm Soundbox: ₹${res.amount_rupees || 1800} hisaab jama hua!`);
      if (onRefreshData) onRefreshData();
    } catch {
      showStatus('Paytm Soundbox: Sachin Kamble ne ₹1,800 UPI se chukaya (Local Mode)');
      if (onRefreshData) onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAdvanceDay = async (days: number = 1) => {
    setLoadingAction(`advance-${days}`);
    try {
      const res = await advanceDemoTime(days);
      showStatus(`Time Travel: Clock +${days} din aage badha! Nayi taareekh: ${res.today}`);
      if (onRefreshData) onRefreshData();
    } catch {
      showStatus(`Time Travel: Clock +${days} din aage badha! Festival aur reminders auto-sweep hue.`);
      if (onRefreshData) onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetState = async () => {
    setLoadingAction('reset');
    try {
      await resetDemoState();
      showStatus('Demo reset: Initial seed data aur clock restore ho gaye!');
      if (onRefreshData) onRefreshData();
    } catch {
      showStatus('Demo data original state par reset ho gaya.');
      if (onRefreshData) onRefreshData();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-paper rounded-3xl border border-line shadow-feature overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-paper">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue text-white flex items-center justify-center shadow-button">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-google font-black text-sm text-obsidian tracking-tight">
                Interactive Demo Lab
              </h2>
              <p className="text-[11px] text-charcoal">Test real-time store events & Paytm sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-sky/40 border border-sky/70 text-xs font-bold text-blue">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue" />
              <span>Simulated Clock: Pune Regional Cycle</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Backend
            </span>
          </div>

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            {/* Simulate Customer Visit */}
            <button
              onClick={handleSimulateVisit}
              disabled={loadingAction === 'visit'}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-xs flex items-center justify-between text-xs transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky text-blue flex items-center justify-center">
                  <Play className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-google font-bold text-obsidian">Simulate Customer Visit</p>
                  <p className="text-[10px] text-charcoal font-normal">
                    Triggers a ₹420 Paytm QR purchase & updates today's sales
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-blue font-bold">
                {loadingAction === 'visit' ? '...' : '+₹420'}
              </span>
            </button>

            {/* Simulate Soundbox Payment */}
            <button
              onClick={handleSimulatePayment}
              disabled={loadingAction === 'payment'}
              className="w-full p-3.5 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-xs flex items-center justify-between text-xs transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-google font-bold text-obsidian">Simulate Soundbox Udhaar Payment</p>
                  <p className="text-[10px] text-charcoal font-normal">
                    Clears ₹1,800 overdue credit & triggers Soundbox alert
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">
                {loadingAction === 'payment' ? '...' : '+₹1,800'}
              </span>
            </button>

            {/* Advance Time */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAdvanceDay(1)}
                disabled={loadingAction === 'advance-1'}
                className="p-3 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-xs flex items-center justify-center gap-1.5 text-xs transition cursor-pointer active:scale-98"
              >
                <FastForward className="w-3.5 h-3.5 text-blue" />
                <span>+1 Din Badhayein</span>
              </button>

              <button
                onClick={() => handleAdvanceDay(7)}
                disabled={loadingAction === 'advance-7'}
                className="p-3 rounded-2xl border border-line bg-paper hover:bg-cloud font-semibold text-obsidian shadow-xs flex items-center justify-center gap-1.5 text-xs transition cursor-pointer active:scale-98"
              >
                <FastForward className="w-3.5 h-3.5 text-blue" />
                <span>+7 Din (1 Week)</span>
              </button>
            </div>

            {/* Reset State */}
            <button
              onClick={handleResetState}
              disabled={loadingAction === 'reset'}
              className="w-full p-2.5 rounded-2xl border border-dashed border-line text-charcoal hover:text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer hover:bg-cloud mt-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate ${loadingAction === 'reset' ? 'animate-spin' : ''}`} />
              <span>Clean Demo State Restore Karein</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
