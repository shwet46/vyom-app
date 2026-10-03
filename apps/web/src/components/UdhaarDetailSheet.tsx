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
        colors: ['#0E7A50', '#BEF0D8', '#00A9E8', '#CBD5E1'],
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian/60 backdrop-blur-xs p-0 sm:p-3">
      <div
        className="w-full max-w-[420px] max-h-[92vh] bg-surface rounded-t-2xl sm:rounded-2xl border-2 border-ink flex flex-col overflow-hidden animate-fade-slide-up"
        style={{ boxShadow: '2px 2px 0px var(--shadow-color)' }}
      >
        {/* Header */}
        <div
          className="p-4 bg-surface flex items-center justify-between"
          style={{ borderBottom: '2px solid var(--shadow-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0"
              style={{
                border: '1px solid var(--outline)',
                background: isPaid ? '#BEF0D8' : 'var(--canvas)',
                color: isPaid ? '#0E7A50' : 'var(--shadow-color)',
                boxShadow: '1px 1px 0px var(--shadow-color)',
              }}
            >
              {customer.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2 }}>
                  {customer.name}
                </h2>
                {customer.trustScore && (
                  <span
                    className="comic-badge"
                    style={{ background: '#BEF0D8', color: '#0E7A50', fontSize: 10 }}
                  >
                    ⭐ {customer.trustScore}% Trust
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                <span>{customer.phone}</span>
                {customer.address && <span> • {customer.address}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-ink bg-surface flex items-center justify-center text-ink cursor-pointer hover:bg-canvas transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {/* Amount Balance Card — Red/Green debt pattern */}
          <div
            className={isPaid ? 'comic-card-mint' : isOverdue30 ? 'comic-card-coral' : 'comic-card'}
            style={{ padding: 14 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isPaid ? '#0E7A50' : isOverdue30 ? '#C62828' : '#6B7280',
                  }}
                >
                  Kul Baki Balance (वर्तमान बकाया)
                </span>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    marginTop: 2,
                    color: isPaid ? '#0E7A50' : isOverdue30 ? '#C62828' : 'var(--shadow-color)',
                  }}
                >
                  {formatRupee(customer.amount)}
                </div>
              </div>

              <div className="text-right">
                <span
                  className="comic-badge"
                  style={{
                    background: isPaid ? '#FFFFFF' : isOverdue30 ? '#FFFFFF' : '#FFE4B8',
                    color: isPaid ? '#0E7A50' : isOverdue30 ? '#C62828' : '#B5610E',
                    fontSize: 11,
                  }}
                >
                  {isPaid
                    ? 'Poora Chukta ✓'
                    : customer.daysOverdue === 0
                    ? 'Aaj ka hisaab'
                    : `${customer.daysOverdue} din se baki`}
                </span>
                {customer.promisedDate && (
                  <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginTop: 4 }}>
                    Wada: {customer.promisedDate}
                  </div>
                )}
              </div>
            </div>

            {/* Total Given vs Repaid Lifetime */}
            <div
              className="grid grid-cols-2 gap-2 pt-2 mt-2"
              style={{ borderTop: '1.5px solid var(--shadow-color)' }}
            >
              <div
                style={{
                  padding: 8,
                  background: '#FFFFFF',
                  border: '1.5px solid var(--shadow-color)',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 10, color: '#6B7280', display: 'block' }}>Kul Udhaar Diya</span>
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 800, color: '#C62828' }}>
                  {formatRupee(customer.totalUdhaarEver || customer.amount)}
                </span>
              </div>
              <div
                style={{
                  padding: 8,
                  background: '#FFFFFF',
                  border: '1.5px solid var(--shadow-color)',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 10, color: '#6B7280', display: 'block' }}>Kul Jama Repaid</span>
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 800, color: '#0E7A50' }}>
                  {formatRupee(customer.totalJamaEver || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* LEDGER ENTRIES TABLE (Authentic Indian Khata) */}
          <div className="comic-card" style={{ padding: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
                Bahi-Khata Ledger Entries
              </span>
              <button
                onClick={handleCopyStatement}
                className="text-link flex items-center gap-1 cursor-pointer"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ai-text)' }}
              >
                <Download className="w-3 h-3" />
                <span>Parchi Share</span>
              </button>
            </div>

            <div
              style={{
                borderRadius: 10,
                border: '1.5px solid var(--shadow-color)',
                overflow: 'hidden',
              }}
            >
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ background: 'var(--canvas)', borderBottom: '1.5px solid var(--shadow-color)', fontSize: 10, fontWeight: 800, color: 'var(--ink)' }}>
                    <th style={{ padding: '6px 8px' }}>Date</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Udhaar (+)</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Jama (-)</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.entries && customer.entries.length > 0 ? (
                    customer.entries.map((entry) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.20)' }}>
                        <td style={{ padding: '6px 8px', fontSize: 11, color: '#6B7280' }}>
                          {entry.date}
                        </td>
                        <td className="tabular-nums" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#C62828' }}>
                          {entry.type === 'udhaar' ? formatRupee(entry.amount) : '—'}
                        </td>
                        <td className="tabular-nums" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0E7A50' }}>
                          {entry.type === 'jama' ? formatRupee(entry.amount) : '—'}
                          {entry.soundboxVerified && (
                            <span style={{ marginLeft: 3, fontSize: 8, fontWeight: 800, color: '#0E7A50', background: '#BEF0D8', padding: '1px 3px', borderRadius: 4 }}>
                              Soundbox ✓
                            </span>
                          )}
                        </td>
                        <td className="tabular-nums" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>
                          {formatRupee(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: 12, textAlign: 'center', color: '#6B7280' }}>
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
            <div className="comic-card" style={{ padding: 12 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
                  Takada Reminder Tone:
                </label>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
                  {tone === 'soft' ? 'Shubh / Namrata' : 'Zaroori / Pukhta'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setTone('soft')}
                  className="cursor-pointer"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--outline)',
                    background: tone === 'soft' ? 'var(--shadow-color)' : '#FFFFFF',
                    color: tone === 'soft' ? '#FFFFFF' : 'var(--shadow-color)',
                    boxShadow: '1px 1px 0px var(--shadow-color)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Soft Tone
                </button>

                <button
                  onClick={() => setTone('firm')}
                  className="cursor-pointer"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--outline)',
                    background: tone === 'firm' ? '#FFC9C9' : '#FFFFFF',
                    color: tone === 'firm' ? '#C62828' : 'var(--shadow-color)',
                    boxShadow: '1px 1px 0px var(--shadow-color)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Firm Tone (Overdue)
                </button>
              </div>

              {/* Message Preview */}
              <div
                style={{
                  padding: 10,
                  background: '#BEF0D8',
                  borderRadius: 10,
                  border: '1.5px solid var(--shadow-color)',
                  fontSize: 11,
                  color: '#0E7A50',
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 2 }}>
                  WhatsApp Preview (Paytm UPI Link Samet):
                </div>
                <p>{tone === 'soft' ? softMessage : firmMessage}</p>
              </div>
            </div>
          )}

          {/* Paytm Payment QR Toggle */}
          {showQR && (
            <div className="comic-card-sky text-center space-y-2" style={{ padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
                Paytm Dynamic Soundbox QR for {customer.name}
              </div>
              <div
                className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border-2 border-ink flex items-center justify-center"
                style={{ boxShadow: '2px 2px 0px var(--shadow-color)' }}
              >
                <QrCode className="w-28 h-28 text-ink" />
              </div>
              <p style={{ fontSize: 11, color: '#1565C0', fontWeight: 600 }}>
                Scan karte hi Sharma Kirana Soundbox bolega: "Paytm par {formatRupee(customer.amount)} prapt hue"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="p-3 bg-surface space-y-2"
          style={{ borderTop: '2px solid var(--shadow-color)' }}
        >
          {reminderSentToast && (
            <div
              className="comic-card-mint text-center"
              style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#0E7A50', borderRadius: 8 }}
            >
              WhatsApp Takada safalta-purvak bhej diya gaya! ✓
            </div>
          )}

          {statementCopiedToast && (
            <div
              className="comic-card-sky text-center"
              style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#1565C0', borderRadius: 8 }}
            >
              Khata Parchi WhatsApp ke liye taiyaar ho gayi! ✓
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="comic-btn-outline"
              style={{ padding: '8px 12px', minHeight: 44 }}
              title="Show Paytm QR Code"
              aria-label="Show Paytm QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {!isPaid && (
              <button
                onClick={handleSendReminderClick}
                className="comic-btn-outline flex-1"
                style={{ fontSize: 12, minHeight: 44, color: '#C62828', borderColor: 'var(--shadow-color)' }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Takada Bhejo</span>
              </button>
            )}

            {!isPaid ? (
              <button
                onClick={handleMarkPaidClick}
                className="comic-btn flex-1"
                style={{
                  fontSize: 12,
                  minHeight: 44,
                  background: '#BEF0D8',
                  color: '#0E7A50',
                  borderColor: 'var(--shadow-color)',
                }}
              >
                <Check className="w-4 h-4" />
                <span>Paisa Jama Hua ✓</span>
              </button>
            ) : (
              <div
                className="comic-card-mint flex-1 text-center font-bold"
                style={{ padding: '10px 12px', fontSize: 12, color: '#0E7A50' }}
              >
                Pura Khata Clear Hai ✓
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
