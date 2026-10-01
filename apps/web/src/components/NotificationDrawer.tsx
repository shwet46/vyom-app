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
    },
    {
      id: 'notif-2',
      title: 'Naya Paisa Bachat Mauka! ⚡',
      detail: '23 purane regular customers ke liye ₹6,900 recovery plan taiyaar hai.',
      time: '1 ghanta pehle',
      type: 'opportunity',
      tab: 'opportunities' as const,
    },
    {
      id: 'notif-3',
      title: 'Udhaar Reminder Delivered',
      detail: 'Amit Deshmukh (₹3,850 overdue) ko firm reminder deliver hua.',
      time: '2 ghante pehle',
      type: 'reminder',
      tab: 'udhaar' as const,
    },
    {
      id: 'notif-4',
      title: 'Festival Signal Detected 🪔',
      detail: 'Pune mein Ganesh Chaturthi ki khareed shuru. Modak combo approve karein.',
      time: 'Subah 9:30 AM',
      type: 'signal',
      tab: 'opportunities' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-paper h-full shadow-feature border-l border-soft-line flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-soft-line flex items-center justify-between bg-paper">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue" />
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight">Vyom Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onNavigateToTab(n.tab);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-cloud border border-soft-line hover:border-blue transition cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-obsidian">{n.title}</span>
                <span className="text-[10px] text-slate">{n.time}</span>
              </div>
              <p className="text-xs text-charcoal leading-relaxed">{n.detail}</p>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue pt-0.5">
                <span>Dekhein</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-soft-line bg-paper text-center">
          <span className="text-[11px] text-slate font-medium">Vyom Real-time Alerts Active</span>
        </div>
      </div>
    </div>
  );
};
