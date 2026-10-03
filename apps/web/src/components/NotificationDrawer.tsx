import React from 'react';
import {
  X,
  Bell,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from './icons';
import { formatRupee } from '../utils/formatters';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'more') => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'notif-1',
      title: 'Paytm Payment Received! 💰',
      detail: 'Sachin Kamble ne ₹1,800 ka udhaar Paytm QR se chukaya.',
      time: '15 min pehle',
      type: 'payment',
      tab: 'udhaar' as const,
      color: '#BEF0D8',
      textColor: '#0E7A50',
    },
    {
      id: 'notif-2',
      title: 'Naya Paisa Bachat Mauka! ⚡',
      detail: '23 purane regular customers ke liye ₹6,900 recovery plan taiyaar hai.',
      time: '1 ghanta pehle',
      type: 'opportunity',
      tab: 'opportunities' as const,
      color: 'var(--ai-fill)',
      textColor: 'var(--ai-text)',
    },
    {
      id: 'notif-3',
      title: 'Udhaar Reminder Delivered',
      detail: 'Amit Deshmukh (₹3,850 overdue) ko firm reminder deliver hua.',
      time: '2 ghante pehle',
      type: 'reminder',
      tab: 'udhaar' as const,
      color: '#FFC9C9',
      textColor: '#C62828',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 backdrop-blur-xs p-0 sm:p-3">
      <div
        className="w-full max-w-[420px] max-h-[85vh] bg-surface rounded-t-2xl sm:rounded-2xl border-2 border-ink flex flex-col overflow-hidden animate-fade-slide-up"
        style={{ boxShadow: '2px 2px 0px var(--shadow-color)' }}
      >
        <div
          className="p-4 bg-surface flex items-center justify-between"
          style={{ borderBottom: '2px solid var(--shadow-color)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-ink" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>Vyom Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-ink bg-surface flex items-center justify-center text-ink cursor-pointer hover:bg-canvas transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onNavigateToTab(n.tab);
                onClose();
              }}
              className="comic-card cursor-pointer"
              style={{ padding: 12 }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{n.title}</span>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>{n.time}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.4 }}>{n.detail}</p>
              <div className="flex items-center gap-1 pt-2" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ai-text)' }}>
                <span>Dekhein</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>

        <div
          className="p-3 bg-surface text-center"
          style={{ borderTop: '2px solid var(--shadow-color)', fontSize: 11, color: '#6B7280', fontWeight: 600 }}
        >
          Vyom Real-time Alerts Active
        </div>
      </div>
    </div>
  );
};
