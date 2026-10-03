import React, { useState } from 'react';
import {
  Camera,
  Search,
  Filter,
  ShieldCheck,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  BookOpen,
  Send,
  IndianRupee,
  Calendar,
  Sparkles,
  QrCode,
  Upload,
  X,
} from '../components/icons';
import { KhataEntry, Language, UdhaarCustomer } from '../types';
import { formatRupee } from '../utils/formatters';
import { translations } from '../utils/i18n';
import { speakWithShubh } from '../utils/speech';

interface UdhaarViewProps {
  lang: Language;
  customers: UdhaarCustomer[];
  autoRemindersEnabled: boolean;
  onToggleAutoReminders: () => void;
  onSelectCustomer: (cust: UdhaarCustomer) => void;
  onOpenKhataScan: () => void;
  onAddNewKhataEntry?: (customerId: string, entry: KhataEntry) => void;
  onSendDirectReminder?: (customer: UdhaarCustomer) => void;
  collectedAmount?: number;
}

export const UdhaarView: React.FC<UdhaarViewProps> = ({
  lang,
  customers,
  autoRemindersEnabled,
  onToggleAutoReminders,
  onSelectCustomer,
  onOpenKhataScan,
  onAddNewKhataEntry,
  onSendDirectReminder,
  collectedAmount,
}) => {
  const t = translations[lang] || translations.hinglish;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'overdue30' | 'promised' | 'paid'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'ledger'>('cards');

  // New entry modal state
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryType, setEntryType] = useState<'udhaar' | 'jama'>('udhaar');
  const [selectedCustomerIdForEntry, setSelectedCustomerIdForEntry] = useState(customers[0]?.id || '');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryItems, setEntryItems] = useState('');

  const totalOutstanding = customers
    .filter((c) => c.status !== 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalOverdue30 = customers
    .filter((c) => c.status !== 'paid' && c.daysOverdue >= 30)
    .reduce((sum, c) => sum + c.amount, 0);

  const collectedThisWeek = collectedAmount ?? 9200;

  // Filtered list
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (filterType === 'overdue30') return c.daysOverdue >= 30 && c.status !== 'paid';
    if (filterType === 'promised') return c.status === 'promised';
    if (filterType === 'paid') return c.status === 'paid' || c.amount === 0;
    return true;
  });

  const handleSaveEntry = () => {
    const amt = Number(entryAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;

    const cust = customers.find((c) => c.id === selectedCustomerIdForEntry);
    if (!cust) return;

    const newBalance = entryType === 'udhaar' ? cust.amount + amt : Math.max(0, cust.amount - amt);

    const newEntry: KhataEntry = {
      id: `khata-entry-${Date.now()}`,
      date: 'Today',
      items: entryItems || (entryType === 'udhaar' ? 'Kirana Samaan' : 'Cash Jama'),
      type: entryType,
      amount: amt,
      balanceAfter: newBalance,
      paymentMode: entryType === 'jama' ? 'paytm_qr' : undefined,
      soundboxVerified: entryType === 'jama',
    };

    // Paytm Soundbox voice chime simulation with Shubh Voice
    if (entryType === 'jama') {
      speakWithShubh(`Paytm par ${amt} rupaye prapt hue.`, { lang: 'hindi' });
    }

    if (onAddNewKhataEntry) {
      onAddNewKhataEntry(selectedCustomerIdForEntry, newEntry);
    }

    setShowAddEntryModal(false);
    setEntryAmount('');
    setEntryItems('');
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-150 relative">
      {/* Clean Modern Header Banner */}
      <div className="p-5 sm:p-7 rounded-[2rem] bg-gradient-to-br from-white via-white to-lavender/30 border border-line/70 shadow-feature relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-google font-bold text-blue uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              {t.ledgerHeaderBlessing}
            </div>
            <h1 className="font-google font-black text-2xl sm:text-3xl text-obsidian tracking-tight mt-2">
              {t.khataTitle}
            </h1>
            <p className="text-sm text-charcoal mt-1 max-w-xl leading-relaxed font-sans">
              Sharma Kirana Store · Paytm Soundbox aur bahi hisaab ek jagah
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-stretch gap-2 w-full lg:w-auto lg:min-w-[28rem]">
            <button
              onClick={onOpenKhataScan}
              className="col-span-2 sm:col-span-1 py-3 px-3 rounded-2xl bg-cloud border border-line/70 text-obsidian font-google font-bold text-xs shadow-xs hover:bg-slate-100 flex items-center justify-center gap-2 transition cursor-pointer min-h-12"
              title="Upload handwritten register image/PDF, or scan via camera (Sarvam OCR)"
            >
              <div className="flex items-center gap-1 text-blue">
                <Upload className="w-3.5 h-3.5" />
                <span className="text-[10px] text-charcoal/50">/</span>
                <Camera className="w-3.5 h-3.5" />
              </div>
              <span>{t.khataScanBtn}</span>
            </button>

            <button
              onClick={() => {
                setEntryType('udhaar');
                setShowAddEntryModal(true);
              }}
              className="group w-full sm:w-auto min-w-0 min-h-11 py-2 px-3 rounded-xl bg-rose-600 text-white font-google shadow-button hover:bg-rose-700 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2"
              aria-label="Naya udhaar likhein"
            >
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 text-xs font-extrabold leading-tight">
                {t.addUdhaarBtn.replace(/^[+✓]\s*/, '')}
              </span>
            </button>

            <button
              onClick={() => {
                setEntryType('jama');
                setShowAddEntryModal(true);
              }}
              className="group w-full sm:w-auto min-w-0 min-h-11 py-2 px-3 rounded-xl bg-emerald-700 text-white font-google shadow-button hover:bg-emerald-800 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
              aria-label="Jama darj karein"
            >
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 text-xs font-extrabold leading-tight">
                {t.recordJamaBtn.replace(/^[+✓]\s*/, '')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Health Summary: 3 Pillars of Kirana Khata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-line/70 shadow-feature space-y-3 min-h-[8.5rem]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate uppercase tracking-wider font-google">
              {t.totalOutstanding}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              कुल दिया
            </span>
          </div>
          <div className="font-google font-black text-2xl text-obsidian tracking-tight">
            {formatRupee(totalOutstanding)}
          </div>
          <div className="text-[11px] text-charcoal">
            {customers.filter((c) => c.status !== 'paid' && c.amount > 0).length} grahak baki hain
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200/80 shadow-feature space-y-3 min-h-[8.5rem]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-error uppercase tracking-wider font-google">
              {t.overdueAmount}
            </span>
            <span className="text-[10px] font-bold text-white bg-error px-2 py-0.5 rounded-full font-google">
              Urgent Risk
            </span>
          </div>
          <div className="font-google font-black text-2xl text-error tracking-tight">
            {formatRupee(totalOverdue30)}
          </div>
          <div className="text-[11px] text-rose-900">
            Takada reminder bhej kar recover karein
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 shadow-feature space-y-3 min-h-[8.5rem]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider font-google">
              {t.collectedThisWeek}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-google">
              Soundbox ✓
            </span>
          </div>
          <div className="font-google font-black text-2xl text-emerald-700 tracking-tight">
            {formatRupee(collectedThisWeek)}
          </div>
          <div className="text-[11px] text-emerald-800">
            Paytm UPI & Soundbox se jama
          </div>
        </div>
      </div>

      {/* Autonomous Reminders ON Toggle Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-sky/40 border border-blue/20 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white border border-sky flex items-center justify-center text-blue flex-shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-blue" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-google font-extrabold text-xs text-obsidian truncate">
                {t.autoRemindersToggle}
              </span>
              <span className="text-[10px] font-bold text-blue bg-sky px-2 py-0.5 rounded-full uppercase font-google">
                Auto-Pilot
              </span>
            </div>
            <p className="text-[11px] text-charcoal truncate mt-0.5 font-sans">
              {t.autoRemindersSub}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleAutoReminders}
          className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 flex items-center ${
            autoRemindersEnabled ? 'bg-blue justify-end' : 'bg-slate-300 justify-start'
          }`}
          aria-label="Toggle autonomous reminders"
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
        </button>
      </div>

      {/* View Switcher: Cards vs Traditional Bahi-Khata Ledger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center self-start p-1 rounded-2xl bg-white border border-line shadow-xs">
          <button
            onClick={() => setViewMode('cards')}
            className={`py-1.5 px-3 rounded-xl text-xs font-google font-bold transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-blue shadow-xs font-black'
                : 'text-charcoal hover:text-ink'
            }`}
          >
            Digital Khata Cards
          </button>
          <button
            onClick={() => setViewMode('ledger')}
            className={`py-1.5 px-3 rounded-xl text-xs font-google font-bold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'ledger'
                ? 'bg-white text-blue shadow-xs font-black'
                : 'text-charcoal hover:text-ink'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.traditionalLedgerBook}</span>
          </button>
        </div>

        <span className="text-xs font-bold text-slate font-google hidden sm:inline">
          {filteredCustomers.length} customer{filteredCustomers.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-line/70 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-google font-bold uppercase tracking-wider text-slate">Find a customer</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Grahak ka naam, phone, ya mohalla..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-line rounded-2xl text-xs text-ink placeholder:text-slate focus:outline-none focus:border-blue shadow-xs font-sans"
          />
        </div>

          {/* Quick Filter Buttons */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as const, label: 'Sabhi Khata' },
            { id: 'overdue30' as const, label: '30+ Din (Risk)' },
            { id: 'promised' as const, label: 'Wada Kiya' },
            { id: 'paid' as const, label: 'Chukta ✓' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-google font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-obsidian text-white'
                  : 'bg-cloud border border-line text-charcoal hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MODERN DIGITAL KHATA CARDS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((cust) => {
              const isOverdue = cust.daysOverdue >= 30 && cust.status !== 'paid' && cust.amount > 0;
              const isPaid = cust.status === 'paid' || cust.amount === 0;

              return (
                <div
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust)}
                  className="p-5 rounded-3xl bg-white border border-line/70 shadow-feature hover:border-blue/50 transition-all cursor-pointer space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Customer Initials + Trust Score + Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl font-google font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : isOverdue
                            ? 'bg-rose-100 text-error'
                            : 'bg-cloud text-blue border border-line'
                        }`}
                      >
                        {cust.initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col items-start gap-1">
                          <h4 className="font-google font-extrabold text-sm sm:text-base text-obsidian whitespace-normal break-words leading-tight">
                            {cust.name}
                          </h4>
                          {cust.trustScore && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                cust.trustScore >= 80
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              ⭐ {cust.trustScore}% Bharosa
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-charcoal font-sans line-clamp-2 break-words mt-0.5">
                          {cust.phone}
                        </div>

                        <div className="text-[11px] text-slate mt-0.5">
                          Aakhri takada: {cust.lastReminderDate}
                        </div>
                      </div>
                    </div>

                    {/* Right: Net Balance (Baki) */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-slate font-medium block">
                        {isPaid ? 'Hisab Clear' : 'Kul Baki'}
                      </span>
                      <div
                        className={`font-google font-black text-lg sm:text-xl ${
                          isPaid
                            ? 'text-emerald-700'
                            : isOverdue
                            ? 'text-error'
                            : 'text-ink'
                        }`}
                      >
                        {formatRupee(cust.amount)}
                      </div>

                      {isPaid ? (
                        <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Poora Chukta ✓
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-block text-[10px] font-bold text-error bg-rose-100 px-2 py-0.5 rounded-full">
                          {cust.daysOverdue} din overdue
                        </span>
                      ) : cust.status === 'promised' ? (
                        <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Wada: {cust.promisedDate || 'Jald'}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-medium text-charcoal bg-cloud px-2 py-0.5 rounded-full">
                          {cust.daysOverdue} din baki
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Khata action bar */}
                  <div className="pt-2 border-t border-soft-line flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate font-sans">
                      {cust.entries ? `${cust.entries.length} bahi entries` : 'Tap to open ledger'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSendDirectReminder) onSendDirectReminder(cust);
                          alert(`${cust.name} ko reminder link send ho gaya!`);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-cloud border border-line text-xs font-google font-bold text-charcoal hover:text-blue hover:border-blue flex items-center gap-1 transition cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-blue" />
                        <span>Reminder</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCustomer(cust);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-blue text-white text-xs font-google font-extrabold shadow-button hover:bg-blue/90 flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Khata Kholein</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 rounded-3xl bg-cloud border border-line text-center text-xs text-charcoal font-sans">
              Koi record nahi mila. Khata Scan se naye grahak jodein!
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TRADITIONAL INDIAN BAHI-KHATA LEDGER */}
      {viewMode === 'ledger' && (
        <div className="rounded-[2rem] bg-paper border border-line shadow-feature overflow-hidden animate-in fade-in">
          {/* Clean Ledger Top Ribbon */}
          <div className="bg-obsidian text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-soft-line">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue" />
              <div>
                <div className="font-google font-bold text-sm tracking-wide text-white">
                  Bahi-Khata Ledger
                </div>
                <div className="text-[11px] text-white/60 font-sans mt-0.5">Udhaar aur jama ka saaf hisaab</div>
              </div>
            </div>
            <div className="text-[11px] font-google font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
              Session 2026-27 • Sharma Kirana
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-lavender/45 border-b border-line text-[11px] font-google font-black text-obsidian">
                  <th className="py-3 px-3.5">Grahak (Customer)</th>
                  <th className="py-3 px-3.5">Mohalla / Pata</th>
                  <th className="py-3 px-3.5 text-right text-emerald-800">Jama (मिला -)</th>
                  <th className="py-3 px-3.5 text-right text-rose-800">Udhaar (दिया +)</th>
                  <th className="py-3 px-3.5 text-right text-obsidian">Baki (Balance)</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70 font-sans">
                {filteredCustomers.map((c) => {
                  const isOverdue = c.daysOverdue >= 30 && c.status !== 'paid' && c.amount > 0;
                  const isPaid = c.status === 'paid' || c.amount === 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCustomer(c)}
                      className="hover:bg-lavender/20 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-3.5 font-google font-extrabold text-sm text-ink truncate max-w-[150px]">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-3.5 text-charcoal text-xs truncate max-w-[170px] font-sans">
                        {c.address || c.phone}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-google font-extrabold text-xs text-emerald-700">
                        {formatRupee(c.totalJamaEver || 0)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-google font-extrabold text-xs text-rose-700">
                        {formatRupee(c.totalUdhaarEver || c.amount)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-google font-black text-sm text-ink">
                        {formatRupee(c.amount)}
                      </td>
                      <td className="py-3.5 px-3.5 text-center">
                        {isPaid ? (
                          <span className="text-[10px] font-google font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            Chukta ✓
                          </span>
                        ) : isOverdue ? (
                          <span className="text-[10px] font-google font-extrabold text-error bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                            {c.daysOverdue} din
                          </span>
                        ) : (
                          <span className="text-[10px] font-google font-bold text-charcoal bg-cloud px-2 py-0.5 rounded-full border border-line">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Adding New Udhaar or Jama Entry */}
      {showAddEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-paper border border-line shadow-feature p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-soft-line">
              <h3 className="font-google font-extrabold text-base text-obsidian">
                {entryType === 'udhaar' ? 'नया उधार लिखें (Debit)' : 'रुपये जमा दर्ज करें (Credit)'}
              </h3>
              <button
                onClick={() => setShowAddEntryModal(false)}
                className="w-7 h-7 rounded-full bg-cloud flex items-center justify-center text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer selector */}
            <div className="space-y-1">
              <label className="text-xs font-google font-bold text-obsidian">Customer Chunein</label>
              <select
                value={selectedCustomerIdForEntry}
                onChange={(e) => setSelectedCustomerIdForEntry(e.target.value)}
                className="w-full bg-cloud border border-line rounded-xl px-3 py-2 text-xs font-sans text-ink focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Baki: {formatRupee(c.amount)})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-xs font-google font-bold text-obsidian">Amount (₹)</label>
              <div className="flex items-center gap-2 bg-cloud border border-line rounded-xl px-3 py-2">
                <span className="text-sm font-black text-slate">₹</span>
                <input
                  type="number"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-transparent text-sm font-google font-extrabold text-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Samaan / Note */}
            <div className="space-y-1">
              <label className="text-xs font-google font-bold text-obsidian">
                {entryType === 'udhaar' ? 'Samaan / Items' : 'Payment Mode / Note'}
              </label>
              <input
                type="text"
                value={entryItems}
                onChange={(e) => setEntryItems(e.target.value)}
                placeholder={entryType === 'udhaar' ? 'Atta 10kg, Fortune Tel' : 'Paytm QR / GPay / Cash'}
                className="w-full bg-cloud border border-line rounded-xl px-3 py-2 text-xs font-sans text-ink focus:outline-none"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveEntry}
              disabled={!entryAmount}
              className={`w-full py-3 rounded-2xl text-white font-google font-extrabold text-xs shadow-button transition cursor-pointer ${
                entryType === 'udhaar'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              } disabled:opacity-40`}
            >
              {entryType === 'udhaar' ? 'खाते में उधार लिखें ✓' : 'खाते में जमा दर्ज करें ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
