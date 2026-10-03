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
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* Single Title Row */}
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}>
        {t.khataTitle}
      </div>

      {/* Red/Green Naya Udhaar / Jama Darj button pair — anchor semantic pattern */}
      <div className="flex gap-2">
        <button
          onClick={() => { setEntryType('udhaar'); setShowAddEntryModal(true); }}
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
          style={{
            padding: '12px 10px',
            borderRadius: 12,
            background: '#FFC9C9',
            border: '1px solid var(--outline)',
            boxShadow: '2px 2px 0px var(--shadow-color)',
            color: '#C62828',
            fontWeight: 700,
            fontSize: 13,
            minHeight: 48,
            fontFamily: 'var(--font-ui)',
            transition: 'box-shadow 0.1s, transform 0.1s',
          }}
          onMouseDown={(e) => { e.currentTarget.style.boxShadow = '2px 2px 0px var(--shadow-color)'; e.currentTarget.style.transform = 'translate(2px,2px)'; }}
          onMouseUp={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0px var(--shadow-color)'; e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0px var(--shadow-color)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Plus className="w-4 h-4" /> {t.ledgerUdhaar}
        </button>
        <button
          onClick={() => { setEntryType('jama'); setShowAddEntryModal(true); }}
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
          style={{
            padding: '12px 10px',
            borderRadius: 12,
            background: '#BEF0D8',
            border: '1px solid var(--outline)',
            boxShadow: '2px 2px 0px var(--shadow-color)',
            color: '#0E7A50',
            fontWeight: 700,
            fontSize: 13,
            minHeight: 48,
            fontFamily: 'var(--font-ui)',
            transition: 'box-shadow 0.1s, transform 0.1s',
          }}
          onMouseDown={(e) => { e.currentTarget.style.boxShadow = '2px 2px 0px var(--shadow-color)'; e.currentTarget.style.transform = 'translate(2px,2px)'; }}
          onMouseUp={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0px var(--shadow-color)'; e.currentTarget.style.transform = 'none'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '4px 4px 0px var(--shadow-color)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Check className="w-4 h-4" /> {t.ledgerJama}
        </button>
      </div>

      {/* Kul Udhaar stat card with red "Action Needed" badge */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div className="flex items-center justify-between">
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.totalOutstanding}
            </span>
            <div className="text-hero tabular-nums" style={{ color: 'var(--ink)' }}>
              {formatRupee(totalOutstanding)}
            </div>
            <span style={{ fontSize: 13, color: '#6B7280' }}>
              {customers.filter((c) => c.status !== 'paid' && c.amount > 0).length} grahak baki
            </span>
          </div>
          {totalOverdue30 > 0 && (
            <span className="comic-badge" style={{ background: '#FFC9C9', color: '#C62828' }}>
              Action Needed
            </span>
          )}
        </div>
      </div>

      {/* Overdue Risk card (coral) */}
      {totalOverdue30 > 0 && (
        <div className="comic-card-coral" style={{ padding: 14 }}>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C62828', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.overdueAmount}
              </span>
              <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: '#C62828' }}>
                {formatRupee(totalOverdue30)}
              </div>
              <span style={{ fontSize: 13, color: '#C62828' }}>Takada reminder bhejein</span>
            </div>
            <span className="comic-badge" style={{ background: '#FFFFFF', color: '#C62828' }}>
              Urgent Risk
            </span>
          </div>
        </div>
      )}

      {/* Collected (mint) */}
      <div className="comic-card-mint" style={{ padding: 14 }}>
        <div className="flex items-center justify-between">
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0E7A50', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.collectedThisWeek}
            </span>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: '#0E7A50' }}>
              {formatRupee(collectedThisWeek)}
            </div>
            <span style={{ fontSize: 13, color: '#0E7A50' }}>Paytm UPI & Soundbox se jama</span>
          </div>
          <span className="comic-badge" style={{ background: '#FFFFFF', color: '#0E7A50' }}>
            Soundbox ✓
          </span>
        </div>
      </div>

      {/* Scan + Auto-reminder strip */}
      <div className="flex gap-2">
        <button
          onClick={onOpenKhataScan}
          className="comic-btn-outline flex-1"
          style={{ fontSize: 13 }}
        >
          <Upload className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
          <Camera className="w-3.5 h-3.5" style={{ color: 'var(--ai-text)' }} />
          {t.khataScanBtn}
        </button>
      </div>

      {/* Auto-reminders toggle */}
      <div className="comic-card-sky" style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="icon-chip" style={{ background: '#FFFFFF' }}>
            <ShieldCheck className="w-4 h-4" style={{ color: '#1565C0' }} />
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{t.autoRemindersToggle}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{t.autoRemindersSub}</div>
          </div>
        </div>
        <button
          onClick={onToggleAutoReminders}
          className="flex-shrink-0 cursor-pointer flex items-center"
          style={{
            width: 48,
            height: 26,
            borderRadius: 999,
            padding: 2,
            background: autoRemindersEnabled ? 'var(--ai-text)' : '#E7EEF4',
            justifyContent: autoRemindersEnabled ? 'flex-end' : 'flex-start',
            border: '1px solid var(--outline)',
            transition: 'background 0.2s',
          }}
          aria-label="Toggle autonomous reminders"
        >
          <div style={{ width: 18, height: 18, borderRadius: 999, background: '#FFFFFF', boxShadow: '1px 1px 0px var(--shadow-color)' }} />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="comic-card" style={{ padding: 12 }}>
        <div className="relative" style={{ marginBottom: 8 }}>
          <Search className="w-4 h-4 absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchCustomer}
            className="comic-input"
            style={{ paddingLeft: 36, fontSize: 13 }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as const, label: t.allCount },
            { id: 'overdue30' as const, label: t.overdue30 },
            { id: 'promised' as const, label: t.promised },
            { id: 'paid' as const, label: t.paidStatus },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`comic-pill ${filterType === f.id ? 'comic-pill-active' : ''}`}
              style={{
                background: filterType === f.id ? 'var(--shadow-color)' : '#FFFFFF',
                color: filterType === f.id ? '#FFFFFF' : 'var(--shadow-color)',
                whiteSpace: 'nowrap',
                fontSize: 11,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust) => {
            const isOverdue = cust.daysOverdue >= 30 && cust.status !== 'paid' && cust.amount > 0;
            const isPaid = cust.status === 'paid' || cust.amount === 0;

            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="comic-card cursor-pointer"
                style={{ padding: 14 }}
              >
                <div className="flex items-start justify-between gap-3" style={{ marginBottom: 8 }}>
                  {/* Avatar + Info */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: isPaid ? '#BEF0D8' : isOverdue ? '#FFC9C9' : 'var(--canvas)',
                        border: '1px solid var(--outline)',
                        boxShadow: '1px 1px 0px var(--shadow-color)',
                        fontWeight: 700,
                        fontSize: 13,
                        color: isPaid ? '#0E7A50' : isOverdue ? '#C62828' : 'var(--shadow-color)',
                      }}
                    >
                      {cust.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
                        {cust.name}
                      </h4>
                      {/* Trust Badge — separate line, own comic-shadow chip */}
                      {cust.trustScore && (
                        <span
                          className="comic-badge"
                          style={{
                            background: cust.trustScore >= 80 ? '#BEF0D8' : '#FFE4B8',
                            color: cust.trustScore >= 80 ? '#0E7A50' : '#B5610E',
                            fontSize: 9,
                            marginTop: 4,
                            display: 'inline-flex',
                          }}
                        >
                          ⭐ {cust.trustScore}% Bharosa
                        </span>
                      )}
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{cust.phone}</div>
                    </div>
                  </div>

                  {/* Balance + Status */}
                  <div className="text-right flex-shrink-0">
                    <span style={{ fontSize: 10, color: '#6B7280' }}>{isPaid ? t.paidStatus : t.bakiStatus}</span>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: isPaid ? '#0E7A50' : isOverdue ? '#C62828' : 'var(--shadow-color)',
                      }}
                    >
                      {formatRupee(cust.amount)}
                    </div>
                    {/* Promise pill — separate line comic chip */}
                    {isPaid ? (
                      <span className="comic-badge" style={{ background: '#BEF0D8', color: '#0E7A50', fontSize: 9, display: 'inline-flex', marginTop: 4 }}>
                        Chukta ✓
                      </span>
                    ) : isOverdue ? (
                      <span className="comic-badge" style={{ background: '#FFC9C9', color: '#C62828', fontSize: 9, display: 'inline-flex', marginTop: 4 }}>
                        {cust.daysOverdue}d overdue
                      </span>
                    ) : cust.status === 'promised' ? (
                      <span className="comic-badge" style={{ background: '#FFE4B8', color: '#B5610E', fontSize: 9, display: 'inline-flex', marginTop: 4 }}>
                        Wada: {cust.promisedDate || 'Jald'}
                      </span>
                    ) : (
                      <span className="comic-badge" style={{ background: 'var(--canvas)', color: '#6B7280', fontSize: 9, display: 'inline-flex', marginTop: 4 }}>
                        {cust.daysOverdue}d baki
                      </span>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-between gap-2" style={{ paddingTop: 8, borderTop: '1.5px solid rgba(148,163,184,0.28)' }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    {cust.entries ? `${cust.entries.length} entries` : 'Tap to open'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSendDirectReminder) onSendDirectReminder(cust);
                      }}
                      className="comic-btn-outline comic-btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      <Send className="w-3 h-3" style={{ color: 'var(--ai-text)' }} />
                      Reminder
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectCustomer(cust); }}
                      className="comic-btn comic-btn-sm"
                      style={{ fontSize: 11, padding: '4px 10px' }}
                    >
                      {t.khataBtn}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="comic-card" style={{ padding: 24, textAlign: 'center' }}>
            <p className="text-caption">Koi record nahi mila. Khata Scan se naye grahak jodein!</p>
          </div>
        )}
      </div>

      {/* Add Entry Modal — comic style */}
      {showAddEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,41,112,0.35)' }}>
          <div className="comic-card w-full" style={{ maxWidth: 360, padding: 20 }}>
            <div className="flex items-center justify-between" style={{ paddingBottom: 10, borderBottom: '1.5px solid rgba(148,163,184,0.35)', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                {entryType === 'udhaar' ? t.ledgerUdhaar : t.ledgerJama}
              </h3>
              <button
                onClick={() => setShowAddEntryModal(false)}
                className="cursor-pointer"
                style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--canvas)', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>Customer:</label>
              <select
                value={selectedCustomerIdForEntry}
                onChange={(e) => setSelectedCustomerIdForEntry(e.target.value)}
                className="comic-input"
                style={{ fontSize: 13 }}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Baki: {formatRupee(c.amount)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>Amount (₹):</label>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 15, fontWeight: 700, color: '#6B7280' }}>₹</span>
                <input
                  type="number"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="500"
                  className="comic-input tabular-nums"
                  style={{ fontSize: 15, fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'block' }}>
                {entryType === 'udhaar' ? 'Samaan / Items' : 'Payment Mode'}:
              </label>
              <input
                type="text"
                value={entryItems}
                onChange={(e) => setEntryItems(e.target.value)}
                placeholder={entryType === 'udhaar' ? 'Atta, Fortune Tel' : 'Paytm QR / Cash'}
                className="comic-input"
                style={{ fontSize: 13 }}
              />
            </div>

            <button
              onClick={handleSaveEntry}
              disabled={!entryAmount}
              className="w-full cursor-pointer"
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: entryType === 'udhaar' ? '#FFC9C9' : '#BEF0D8',
                border: '1px solid var(--outline)',
                boxShadow: '2px 2px 0px var(--shadow-color)',
                color: entryType === 'udhaar' ? '#C62828' : '#0E7A50',
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'var(--font-ui)',
                opacity: entryAmount ? 1 : 0.4,
                minHeight: 48,
                transition: 'box-shadow 0.1s, transform 0.1s',
              }}
            >
              {entryType === 'udhaar' ? t.ledgerUdhaar : t.ledgerJama}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
