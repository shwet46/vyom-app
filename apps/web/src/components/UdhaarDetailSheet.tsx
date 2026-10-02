import React, { useState } from 'react';
import {
  X,
  Check,
  Send,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  Download,
  BookOpen,
} from './icons';
import confetti from 'canvas-confetti';
import { Language, UdhaarCustomer } from '../types';
import { formatRupee } from '../utils/formatters';

interface UdhaarDetailSheetProps {
  customer: UdhaarCustomer | null;
  onClose: () => void;
  onMarkPaid: (customerId: string) => void;
  onSendManualReminder: (customerId: string, tone: 'soft' | 'firm') => void;
  lang: Language;
}

export const UdhaarDetailSheet: React.FC<UdhaarDetailSheetProps> = ({
  customer,
  onClose,
  onMarkPaid,
  onSendManualReminder,
  lang,
}) => {
  if (!customer) return null;

  const [tone, setTone] = useState<'soft' | 'firm'>(customer.tone);
  const [showQR, setShowQR] = useState(false);
  const [reminderSentToast, setReminderSentToast] = useState(false);
  const [statementCopiedToast, setStatementCopiedToast] = useState(false);

  const isOverdue30 = customer.daysOverdue >= 30 && customer.amount > 0;
  const isPaid = customer.status === 'paid' || customer.amount === 0;

  const handleMarkPaidClick = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#2597d0', '#ffffff'],
      });
    } catch (e) {}

    onMarkPaid(customer.id);
    onClose();
  };

  const handleSendReminderClick = () => {
    onSendManualReminder(customer.id, tone);
    setReminderSentToast(true);
    setTimeout(() => {
      setReminderSentToast(false);
      onClose();
    }, 1500);
  };

  const handleCopyStatement = () => {
    setStatementCopiedToast(true);
    setTimeout(() => setStatementCopiedToast(false), 2000);
  };

  const softMessage = `Namaste ${customer.name} ji, Sharma Kirana Store se vinamra aadar. Aapka ₹${customer.amount} ka pichla bahi hisaab baki hai. Kripya samay milte hi settlement kar dein: paytm.me/sharma-kirana 🙏`;
  const firmMessage = `Namaste ${customer.name} ji, Sharma Kirana Store se zaroori reminder. Aapka ₹${customer.amount} ka ration hisaab pichle ${customer.daysOverdue} dino se overdue hai. Dukaan ke agle stock ke liye kripya aaj hi clear karein: paytm.me/sharma-kirana 🙏`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-paper rounded-t-3xl sm:rounded-3xl border border-line shadow-feature flex flex-col overflow-hidden max-h-[92vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-soft-line bg-paper flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl font-google font-black text-sm flex items-center justify-center flex-shrink-0 ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-cloud text-blue border border-line'
              }`}
            >
              {customer.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-google font-black text-base sm:text-lg text-obsidian tracking-tight">
                  {customer.name}
                </h2>
                {customer.trustScore && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    ⭐ {customer.trustScore}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-charcoal font-sans">
                <span>{customer.phone}</span>
                {customer.address && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[140px]">{customer.address}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans">
          {/* Clean Bahi-Khata Customer Header */}
          <div className="p-3.5 rounded-2xl bg-cloud border border-line shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue" />
              <span className="font-google text-xs font-bold text-obsidian">
                Grahak Khata Panna • Customer Account Record
              </span>
            </div>
            <button
              onClick={handleCopyStatement}
              className="text-[11px] font-google font-bold text-blue hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Parchi Share</span>
            </button>
          </div>

          {/* Amount Balance Card */}
          <div className="p-4 rounded-3xl bg-cloud border border-line space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block font-google">
                  Kul Baki Balance (वर्तमान बकाया)
                </span>
                <div
                  className={`font-google font-black text-2xl sm:text-3xl tracking-tight mt-0.5 ${
                    isPaid ? 'text-emerald-700' : isOverdue30 ? 'text-error' : 'text-obsidian'
                  }`}
                >
                  {formatRupee(customer.amount)}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-google font-extrabold ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : isOverdue30
                      ? 'bg-rose-100 text-error'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPaid
                    ? 'Poora Chukta ✓'
                    : customer.daysOverdue === 0
                    ? 'Aaj ka hisaab'
                    : `${customer.daysOverdue} din se baki`}
                </span>
                {customer.promisedDate && (
                  <div className="text-[11px] text-slate mt-1 font-medium">
                    Wada: {customer.promisedDate}
                  </div>
                )}
              </div>
            </div>

            {/* Total Given vs Total Received lifetime */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-soft-line text-xs font-sans">
              <div className="p-2 rounded-xl bg-white border border-soft-line">
                <span className="text-[10px] text-slate block">Kul Udhaar Diya (Total Given)</span>
                <span className="font-google font-extrabold text-rose-700">
                  {formatRupee(customer.totalUdhaarEver || customer.amount)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-soft-line">
                <span className="text-[10px] text-slate block">Kul Jama Kiya (Total Repaid)</span>
                <span className="font-google font-extrabold text-emerald-700">
                  {formatRupee(customer.totalJamaEver || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* LEDGER ENTRIES TABLE (Authentic Indian Khata) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-google font-extrabold text-obsidian px-1">
              <span>Bahi-Khata Entries (लेनदेन इतिहास)</span>
              <span className="text-[10px] font-normal text-slate">Dual-entry record</span>
            </div>

            <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-cloud border-b border-soft-line text-[10px] font-google font-bold text-slate">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Udhaar (+)</th>
                    <th className="py-2 px-3 text-right">Jama (-)</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soft-line">
                  {customer.entries && customer.entries.length > 0 ? (
                    customer.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-[11px] font-medium text-slate whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="py-2 px-3 text-right font-google font-bold text-rose-700">
                          {entry.type === 'udhaar' ? formatRupee(entry.amount) : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-google font-bold text-emerald-700">
                          {entry.type === 'jama' ? formatRupee(entry.amount) : '—'}
                          {entry.soundboxVerified && (
                            <span className="ml-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                              Soundbox ✓
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-google font-black text-ink">
                          {formatRupee(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-center text-slate text-xs">
                        Pura hisaab darj hai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tone Selector & WhatsApp Preview */}
          {!isPaid && (
            <div className="p-3.5 rounded-2xl bg-white border border-line space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-google font-bold text-obsidian">
                  Takada Reminder Tone:
                </label>
                <span className="text-[11px] text-slate">
                  {tone === 'soft' ? 'Shubh / Namrata se' : 'Zaroori / Pukhta'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTone('soft')}
                  className={`py-2 px-3 rounded-xl border text-xs font-google font-bold transition cursor-pointer text-center ${
                    tone === 'soft'
                      ? 'bg-sky/60 border-blue text-blue'
                      : 'bg-cloud border-line text-charcoal hover:bg-slate-100'
                  }`}
                >
                  Soft Tone
                </button>

                <button
                  onClick={() => setTone('firm')}
                  className={`py-2 px-3 rounded-xl border text-xs font-google font-bold transition cursor-pointer text-center ${
                    tone === 'firm'
                      ? 'bg-rose-50 border-error text-error'
                      : 'bg-cloud border-line text-charcoal hover:bg-slate-100'
                  }`}
                >
                  Firm Tone (Overdue)
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-3 rounded-2xl bg-[#e7f7e9] text-xs text-ink leading-relaxed border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 mb-1">
                  WhatsApp Preview (Paytm UPI Link Samet):
                </div>
                <p className="text-[11px]">{tone === 'soft' ? softMessage : firmMessage}</p>
              </div>
            </div>
          )}

          {/* Paytm Payment QR Toggle */}
          {showQR && (
            <div className="p-4 rounded-3xl bg-sky/30 border border-blue text-center space-y-2 animate-in zoom-in-95">
              <div className="font-google font-extrabold text-xs text-obsidian">
                Paytm Dynamic Soundbox QR for {customer.name}
              </div>
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border border-line flex items-center justify-center shadow-xs">
                <QrCode className="w-28 h-28 text-ink" />
              </div>
              <p className="text-[11px] text-charcoal">
                Scan karte hi Sharma Kirana Soundbox bolege: "Paytm par {formatRupee(customer.amount)} prapt hue"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-soft-line bg-paper space-y-2">
          {reminderSentToast && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200 font-sans">
              WhatsApp Takada safalta-purvak bhej diya gaya! ✓
            </div>
          )}

          {statementCopiedToast && (
            <div className="p-2.5 rounded-xl bg-sky text-blue text-xs font-bold text-center border border-sky font-sans">
              Khata Parchi WhatsApp ke liye taiyaar ho gayi! ✓
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="p-3 rounded-2xl border border-line bg-cloud text-ink text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              title="Show Paytm QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {!isPaid && (
              <button
                onClick={handleSendReminderClick}
                className="flex-1 py-3 px-3 rounded-2xl border border-line text-xs font-google font-bold text-blue bg-sky/40 hover:bg-sky/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Takada Bhejo</span>
              </button>
            )}

            {!isPaid ? (
              <button
                onClick={handleMarkPaidClick}
                className="flex-1 py-3 px-3 rounded-2xl bg-emerald-700 text-white text-xs font-google font-black shadow-button hover:bg-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Paisa Jama Hua ✓</span>
              </button>
            ) : (
              <div className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-google font-bold text-center border border-emerald-200">
                Pura Khata Clear Hai ✓
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
