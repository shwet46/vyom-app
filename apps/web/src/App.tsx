/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ActivityFeedItem,
  Campaign,
  Guardrails,
  KhataEntry,
  Language,
  MemoryItem,
  Opportunity,
  UdhaarCustomer,
} from './types';
import {
  initialCampaigns,
  initialGuardrails,
  initialMemories,
  initialOpportunities,
  initialUdhaarCustomers,
  todaySalesHourly,
} from './data/mockData';
import {
  getHomeDashboard,
  getOpportunities,
  approveOpportunity as apiApproveOpportunity,
  dismissOpportunity as apiDismissOpportunity,
  getCampaigns,
  getUdhaarSummary,
  getKhataEntries,
  createKhataEntry as apiCreateKhataEntry,
  markKhataPaid as apiMarkKhataPaid,
  sendKhataReminder as apiSendKhataReminder,
  getFestivalContext,
  getGuardrails as apiGetGuardrails,
  updateGuardrails as apiUpdateGuardrails,
  getMemories as apiGetMemories,
  deleteMemory as apiDeleteMemory,
  resetDemoState as apiResetDemoState,
  subscribeToEvents,
  mapBackendOpportunityToFrontend,
  mapBackendCampaignToFrontend,
  mapBackendKhataEntryToUdhaarCustomer,
  HomeResponse,
} from './services/api';
import { TopBar } from './components/TopBar';
import { BottomNav, TabKey } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopActivityFeed } from './components/DesktopActivityFeed';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { OpportunityDetailSheet } from './components/OpportunityDetailSheet';
import { KhataScannerModal } from './components/KhataScannerModal';
import { UdhaarDetailSheet } from './components/UdhaarDetailSheet';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DemoModal } from './components/DemoModal';
import { InstallPromptBanner } from './components/InstallPromptBanner';
import { HomeView, DynamicHomeMetrics } from './views/HomeView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { CampaignsView } from './views/CampaignsView';
import { UdhaarView } from './views/UdhaarView';
import { FestivalsView } from './views/FestivalsView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { translations } from './utils/i18n';
import { BarChart3, Sliders, Check, WifiOff, Mic, Camera, Calendar } from './components/icons';

export default function App() {
  // Global Language state (Default: Hinglish)
  const [lang, setLang] = useState<Language>('hinglish');

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [moreSubTab, setMoreSubTab] = useState<'insights' | 'festivals' | 'settings'>('insights');

  // Business state (initialized with offline fallback seed)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [udhaarCustomers, setUdhaarCustomers] = useState<UdhaarCustomer[]>(initialUdhaarCustomers);
  const [memories, setMemories] = useState<MemoryItem[]>(initialMemories);
  const [guardrails, setGuardrails] = useState<Guardrails>(initialGuardrails);

  // Dynamic Home Dashboard Metrics
  const [homeMetrics, setHomeMetrics] = useState<DynamicHomeMetrics>({
    recoveredThisMonth: 18640,
    todaySales: 7420,
    yesterdaySales: 6880,
    wonBackCount: 14,
    udhaarCollected: 9200,
    campaignSpend: 1150,
    todayOrders: 24,
  });

  const [festivalBanner, setFestivalBanner] = useState<{
    headline: string;
    actionLabel: string;
    phase: string;
    daysToStart?: number;
  } | null>({
    headline: 'Shardiya Navratri 11 dino mein shuru ho raha hai. Stock ready rakhein.',
    actionLabel: 'View Vrat Kit & Stock',
    phase: 'UPCOMING',
    daysToStart: 11,
  });

  const [udhaarStrip, setUdhaarStrip] = useState<{
    totalOutstanding: number;
    overdueCount: number;
    recommendedAction: string;
  } | null>({
    totalOutstanding: 9200,
    overdueCount: 2,
    recommendedAction: 'Send 2 polite reminders',
  });

  const [hourlySalesData, setHourlySalesData] = useState<
    { hour: string; today: number; yesterday: number }[]
  >(todaySalesHourly);

  // Network & Server connectivity status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Live Activity Feed for desktop & background tracking
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([
    {
      id: 'act-1',
      timestamp: '15 min pehle',
      iconType: 'recover',
      title: 'Udhaar Recovered',
      detail: 'Sachin Kamble ne ₹1,800 Paytm QR se pay kiya',
      amount: 1800,
    },
    {
      id: 'act-2',
      timestamp: '1 ghanta pehle',
      iconType: 'reminder',
      title: 'WhatsApp Reminder Bheja',
      detail: 'Amit Deshmukh (₹3,850 overdue) ko firm reminder deliver hua',
    },
    {
      id: 'act-3',
      timestamp: '2 ghante pehle',
      iconType: 'campaign',
      title: 'Campaign Order Redeemed',
      detail: 'Monsoon Chai Combo: 2 naye customers dukaan aaye',
      amount: 480,
    },
    {
      id: 'act-4',
      timestamp: 'Subah 9:00 AM',
      iconType: 'insight',
      title: 'Festival Signal Detected',
      detail: 'Navratri demand model auto-calibrated for Pune',
    },
  ]);

  // Modal & Sheet visibility states
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isKhataScanOpen, setIsKhataScanOpen] = useState(false);
  const [selectedUdhaarCustomer, setSelectedUdhaarCustomer] = useState<UdhaarCustomer | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Global Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ----------------- LIVE DATA FETCHING -----------------
  const refreshAllData = useCallback(async () => {
    try {
      // 1. Fetch Home Dashboard
      const homeRes = await getHomeDashboard();
      if (homeRes) {
        setIsOnline(true);
        const m = homeRes.metrics;
        setHomeMetrics({
          recoveredThisMonth: Math.round((m.recovered_this_month_paise || 1864000) / 100),
          todaySales: Math.round((m.today_sales_paise || 742000) / 100),
          yesterdaySales: 6880,
          wonBackCount: 14,
          udhaarCollected: 9200,
          campaignSpend: 1150,
          todayOrders: m.today_orders || 24,
        });

        if (homeRes.festival_banner) {
          const fb = homeRes.festival_banner;
          setFestivalBanner({
            headline: fb.headline_hinglish || fb.headline_en || 'Festival preparation active',
            actionLabel: fb.action_label || 'View Details',
            phase: fb.phase || 'UPCOMING',
            daysToStart: fb.days_to_start,
          });
        }

        if (homeRes.udhaar_strip) {
          const us = homeRes.udhaar_strip;
          setUdhaarStrip({
            totalOutstanding: Math.round((us.total_outstanding_paise || 0) / 100),
            overdueCount: us.overdue_count || 0,
            recommendedAction: us.recommended_action || 'All accounts clear',
          });
        }

        if (homeRes.sparkline && homeRes.sparkline.length > 0) {
          setHourlySalesData(
            homeRes.sparkline.map((s) => ({
              hour: s.date,
              today: Math.round(s.sales_paise / 100),
              yesterday: Math.round((s.sales_paise * 0.92) / 100),
            }))
          );
        }
      }

      // 2. Fetch Opportunities
      const rawOpps = await getOpportunities();
      if (rawOpps && rawOpps.length > 0) {
        const mapped = rawOpps.map(mapBackendOpportunityToFrontend);
        setOpportunities(mapped);
      }

      // 3. Fetch Campaigns
      const rawCamps = await getCampaigns();
      if (rawCamps && rawCamps.length > 0) {
        const mappedC = rawCamps.map(mapBackendCampaignToFrontend);
        setCampaigns(mappedC);
      }

      // 4. Fetch Udhaar Summary & Entries
      const [udhaarSum, rawEntries] = await Promise.all([
        getUdhaarSummary().catch(() => null),
        getKhataEntries().catch(() => []),
      ]);

      if (udhaarSum) {
        setHomeMetrics((prev) => ({
          ...prev,
          udhaarCollected: Math.round((udhaarSum.collected_this_month_paise || 920000) / 100),
        }));
      }

      if (rawEntries && rawEntries.length > 0) {
        const mappedEntries = rawEntries.map(mapBackendKhataEntryToUdhaarCustomer);
        setUdhaarCustomers(mappedEntries);
      }

      // 5. Fetch Memories
      const rawMemories = await apiGetMemories();
      if (rawMemories && rawMemories.length > 0) {
        const mappedMem: MemoryItem[] = rawMemories.map((m: any) => ({
          id: m._id || m.id,
          text: {
            hinglish: m.content || m.text?.hinglish || 'Vyom ne yeh store behavior observe kiya',
            hindi: m.content || m.text?.hindi || 'व्योम ने दुकान का व्यवहार नोट किया',
            marathi: m.content || m.text?.marathi || 'व्योमने दुकानाचे निरीक्षण केले',
            english: m.content || m.text?.english || 'Observed store preference',
          },
          category: m.category || 'timing',
          dateAdded: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recently',
        }));
        setMemories(mappedMem);
      }

      // 6. Fetch Guardrails
      const rawGuardrails = await apiGetGuardrails();
      if (rawGuardrails) {
        setGuardrails({
          maxWeeklyBudget: Math.round((rawGuardrails.weekly_budget_paise ?? 150000) / 100),
          maxDiscountPercent: rawGuardrails.max_discount_pct ?? 15,
          maxMessagesPerCustomerPerWeek: rawGuardrails.max_msgs_per_customer_week ?? 1,
          preferredLanguage: 'hinglish',
          quietHoursStart: rawGuardrails.quiet_hours?.start ?? '21:00',
          quietHoursEnd: rawGuardrails.quiet_hours?.end ?? '09:00',
          autonomousUdhaarReminders: rawGuardrails.udhaar_autonomy ?? true,
        });
      }
    } catch {
      // Backend not running yet or offline: keep seeded data
      setIsOnline(false);
    }
  }, []);

  // On Mount: Load data and listen for live events
  useEffect(() => {
    refreshAllData();

    // Listen to network status
    const handleOnline = () => {
      setIsOnline(true);
      refreshAllData();
      showToast('Internet wapas aa gaya • Paytm Live Synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode • Data phone par surakshit hai');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to SSE backend events
    const unsubscribeSSE = subscribeToEvents(
      (eventType, data) => {
        if (eventType === 'paytm.payment_received') {
          const amt = data.amount_rupees || Math.round((data.amount_paise || 0) / 100);
          setHomeMetrics((prev) => ({
            ...prev,
            todaySales: prev.todaySales + amt,
            recoveredThisMonth: prev.recoveredThisMonth + amt,
          }));

          setActivityFeed((prev) => [
            {
              id: `act-${Date.now()}`,
              timestamp: 'Abhi-abhi',
              iconType: 'recover',
              title: 'Paytm Soundbox Payment ✓',
              detail: `₹${amt} UPI payment received via Paytm QR`,
              amount: amt,
            },
            ...prev,
          ]);

          showToast(`Paytm Soundbox: ₹${amt} prapt hue! 🔔`);

          // Play Soundbox Audio Speech
          if ('speechSynthesis' in window) {
            try {
              const text = data.soundbox_announcement || `Paytm par ${amt} rupaye prapt hue`;
              const utter = new SpeechSynthesisUtterance(text);
              utter.lang = 'hi-IN';
              utter.rate = 1.0;
              window.speechSynthesis.speak(utter);
            } catch {}
          }
        } else if (eventType === 'demo.visit_simulated') {
          const amt = data.amount_rupees || Math.round((data.amount_paise || 42000) / 100);
          setHomeMetrics((prev) => ({
            ...prev,
            todaySales: prev.todaySales + amt,
            todayOrders: prev.todayOrders + 1,
          }));

          setActivityFeed((prev) => [
            {
              id: `act-${Date.now()}`,
              timestamp: 'Abhi-abhi',
              iconType: 'campaign',
              title: 'Grahak Aavak (Walk-in)',
              detail: `${data.customer_name || 'Grahak'} ne ₹${amt} ka samaan kharida`,
              amount: amt,
            },
            ...prev,
          ]);

          showToast(`Grahak Aavak: ₹${amt} purchase recorded!`);
        } else if (eventType === 'khata.paid') {
          refreshAllData();
        } else if (eventType === 'demo.date_changed' || eventType === 'demo.reset') {
          refreshAllData();
        }
      },
      () => {
        // SSE error / disconnected
      }
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSSE();
    };
  }, [refreshAllData, showToast]);

  // Opportunity Approval Handler (Triggers backend API & updates state)
  const handleApproveOpportunity = async (
    opp: Opportunity,
    customMessage: string,
    customDiscount: number
  ) => {
    // 1. Mark opportunity as running
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, status: 'running' } : o))
    );

    // 2. Call backend API
    try {
      await apiApproveOpportunity(opp.id, 'primary', 'tap');
    } catch {
      // Offline fallback: handled locally
    }

    // 3. Create running campaign in local state
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      title: opp.title,
      type: opp.type,
      status: 'running',
      startDate: 'Aaj shuru hua',
      offer: `${customDiscount}% discount offer`,
      targetCount: opp.customerCount,
      funnel: {
        sent: opp.customerCount,
        delivered: opp.customerCount,
        replied: Math.floor(opp.customerCount * 0.4),
        visited: Math.floor(opp.customerCount * 0.2),
      },
      outcome: {
        revenue: Math.floor(opp.potentialRevenue * 0.45),
        recoveredCount: Math.floor(opp.customerCount * 0.2),
        cost: opp.estimatedCost,
        netRoi: opp.expectedRoi,
      },
      chartData: [
        { day: 'Day 1', revenue: Math.floor(opp.potentialRevenue * 0.45), customers: 5 },
      ],
    };

    setCampaigns((prev) => [newCampaign, ...prev]);

    // 4. Add to activity feed
    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: 'campaign',
        title: 'Campaign Shuru Hua 🎉',
        detail: `${opp.title[lang] || opp.title.hinglish} launch kiya gaya (${opp.customerCount} grahak)`,
      },
      ...prev,
    ]);

    // 5. Confetti celebration
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2597d0', '#d7e6f5', '#070709', '#10b981'],
      });
    } catch {}

    showToast(translations[lang]?.approvedToast || 'Campaign safalta-purvak shuru ho gaya 🎉');
  };

  // Quick Approve from Home Card
  const handleQuickApprove = (opp: Opportunity) => {
    handleApproveOpportunity(
      opp,
      opp.draftedMessage[lang] || opp.draftedMessage.hinglish,
      opp.discountPercent
    );
  };

  // Dismiss Opportunity
  const handleDismissOpportunity = async (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, status: 'dismissed' } : o))
    );
    try {
      await apiDismissOpportunity(oppId);
    } catch {}
    showToast('Mauka baad ke liye bacha liya gaya');
  };

  // Mark Udhaar Customer Paid
  const handleMarkPaid = async (customerId: string) => {
    const cust = udhaarCustomers.find((c) => c.id === customerId);
    if (!cust) return;

    setUdhaarCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              status: 'paid',
              daysOverdue: 0,
              timeline: [
                {
                  date: 'Today',
                  title: 'Payment Received via Paytm',
                  note: `₹${c.amount} clear ho gaya ✓`,
                  type: 'payment',
                },
                ...c.timeline,
              ],
            }
          : c
      )
    );

    // Call backend
    try {
      await apiMarkKhataPaid(customerId, cust.amount * 100);
    } catch {}

    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: 'recover',
        title: 'Udhaar Chuka Diya ✓',
        detail: `${cust.name} ne ₹${cust.amount} clear kiya`,
        amount: cust.amount,
      },
      ...prev,
    ]);

    showToast(`Badhai ho! ${cust.name} ka ₹${cust.amount} recover hua 🎉`);
  };

  // Send Manual Udhaar Reminder
  const handleSendManualReminder = async (customerId: string, tone: 'soft' | 'firm') => {
    const cust = udhaarCustomers.find((c) => c.id === customerId);
    if (!cust) return;

    setUdhaarCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              status: 'reminder_sent',
              tone: tone,
              lastReminderDate: 'Abhi-abhi bheja',
              timeline: [
                {
                  date: 'Today',
                  title: `${tone === 'soft' ? 'Soft' : 'Firm'} Reminder Sent`,
                  note: 'WhatsApp par polite reminder Paytm QR ke saath deliver hua',
                  type: 'reminder',
                },
                ...c.timeline,
              ],
            }
          : c
      )
    );

    try {
      await apiSendKhataReminder(customerId);
    } catch {}

    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: 'reminder',
        title: 'Manual Reminder Bheja',
        detail: `${cust.name} (₹${cust.amount}) ko reminder deliver hua`,
      },
      ...prev,
    ]);

    showToast(`${cust.name} ko WhatsApp reminder bhej diya gaya ✓`);
  };

  // Khata Scanner Save Handler
  const handleSaveScannedToLedger = (newEntries: UdhaarCustomer[]) => {
    setUdhaarCustomers((prev) => [...newEntries, ...prev]);

    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: 'insight',
        title: 'Handwritten Khata Digitize Hua',
        detail: `${newEntries.length} naye grahak bahi-khata scan se shamil hue`,
      },
      ...prev,
    ]);

    showToast(`${newEntries.length} grahak khate mein safalta-purvak jud gaye! ✓`);
  };

  // Add new Udhaar or Jama entry to Khata
  const handleAddNewKhataEntry = async (customerId: string, entry: KhataEntry) => {
    setUdhaarCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newBalance =
          entry.type === 'udhaar' ? c.amount + entry.amount : Math.max(0, c.amount - entry.amount);
        const updatedEntries = c.entries ? [entry, ...c.entries] : [entry];
        const updatedUdhaarEver =
          entry.type === 'udhaar' ? (c.totalUdhaarEver || c.amount) + entry.amount : c.totalUdhaarEver;
        const updatedJamaEver =
          entry.type === 'jama' ? (c.totalJamaEver || 0) + entry.amount : c.totalJamaEver;

        return {
          ...c,
          amount: newBalance,
          status: newBalance === 0 ? ('paid' as const) : c.status,
          totalUdhaarEver: updatedUdhaarEver,
          totalJamaEver: updatedJamaEver,
          entries: updatedEntries,
          timeline: [
            {
              date: 'Today',
              title: entry.type === 'udhaar' ? `Udhaar Diya: ${entry.items}` : `Jama Mila: ${entry.items}`,
              note: `₹${entry.amount} ${entry.type === 'udhaar' ? 'khate mein likha' : 'jama hua'} (Baki: ₹${newBalance})`,
              type: entry.type === 'udhaar' ? ('reminder' as const) : ('payment' as const),
            },
            ...c.timeline,
          ],
        };
      })
    );

    // Call backend API
    try {
      await apiCreateKhataEntry({
        customer_id: customerId,
        amount_total_paise: entry.amount * 100,
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
    } catch {}

    // Paytm Soundbox voice chime simulation
    if (entry.type === 'jama' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(`Paytm par ${entry.amount} rupaye prapt hue.`);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.lang = 'hi-IN';
        window.speechSynthesis.speak(utter);
      } catch {}
    }

    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: entry.type === 'udhaar' ? 'reminder' : 'recover',
        title: entry.type === 'udhaar' ? 'Naya Udhaar Likha' : 'Jama Hua ✓',
        detail: `₹${entry.amount} (${entry.items})`,
        amount: entry.amount,
      },
      ...prev,
    ]);

    showToast(
      entry.type === 'udhaar'
        ? `₹${entry.amount} udhaar likha gaya`
        : `₹${entry.amount} safalta-purvak jama hua! ✓`
    );
  };

  // Forget Memory Item
  const handleForgetMemory = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await apiDeleteMemory(id);
    } catch {}
    showToast('Vyom ne yeh baat memory se hata di');
  };

  // Update Guardrails
  const handleUpdateGuardrails = async (newLimits: Guardrails): Promise<boolean> => {
    setGuardrails(newLimits);
    try {
      await apiUpdateGuardrails({
        weekly_budget_paise: newLimits.maxWeeklyBudget * 100,
        max_discount_pct: newLimits.maxDiscountPercent,
        max_msgs_per_customer_week: newLimits.maxMessagesPerCustomerPerWeek,
        quiet_hours: {
          start: newLimits.quietHoursStart,
          end: newLimits.quietHoursEnd,
        },
        udhaar_autonomy: newLimits.autonomousUdhaarReminders,
        udhaar_max_reminders: 3,
        udhaar_min_gap_days: 7,
        kill_switch: false,
      });
      showToast('Guardrails limits update ho gayi!');
      return true;
    } catch {
      showToast('Guardrails save nahi ho paaya. Dobara try karein.');
      return false;
    }
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    try {
      await apiResetDemoState();
    } catch {}
    setOpportunities(initialOpportunities);
    setCampaigns(initialCampaigns);
    setUdhaarCustomers(initialUdhaarCustomers);
    setMemories(initialMemories);
    setGuardrails(initialGuardrails);
    refreshAllData();
    showToast('Demo data shuruwat jaise reset ho gaya!');
  };

  const activeOppCount = opportunities.filter((o) => o.status === 'new').length;
  const pendingUdhaarCount = udhaarCustomers.filter(
    (c) => c.status !== 'paid' && c.daysOverdue >= 30
  ).length;

  return (
    <div className="app-shell min-h-screen flex flex-col bg-paper text-obsidian">
      {/* Top Header Bar */}
      <TopBar
        currentLang={lang}
        onLanguageChange={setLang}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={activeOppCount + 1}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenDemo={() => setIsDemoOpen(true)}
        isOnline={isOnline}
      />

      {/* Main Body Layout: Sidebar (desktop) + Main View + Activity Feed (desktop) */}
      <div className="flex-1 max-w-[1480px] mx-auto w-full flex justify-center">
        {/* Left Sidebar on Desktop */}
        <DesktopSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          lang={lang}
          opportunitiesCount={activeOppCount}
          pendingUdhaarCount={pendingUdhaarCount}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />

        {/* Central Content Area */}
        <main className="flex-1 min-w-0 px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-28 md:pb-8 max-w-5xl mx-auto w-full">
          {currentTab === 'home' && (
            <HomeView
              lang={lang}
              opportunities={opportunities}
              metrics={homeMetrics}
              festivalBanner={festivalBanner}
              udhaarStrip={udhaarStrip}
              hourlySalesData={hourlySalesData}
              onOpenVoice={() => setIsVoiceOpen(true)}
              onSelectOpportunity={setSelectedOpportunity}
              onQuickApproveOpportunity={handleQuickApprove}
              onNavigateToTab={(tab) => {
                if (tab === 'festivals') {
                  setCurrentTab('more');
                  setMoreSubTab('festivals');
                } else {
                  setCurrentTab(tab as TabKey);
                }
              }}
            />
          )}

          {currentTab === 'opportunities' && (
            <OpportunitiesView
              lang={lang}
              opportunities={opportunities}
              onSelectOpportunity={setSelectedOpportunity}
              onQuickApproveOpportunity={handleQuickApprove}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsView
              lang={lang}
              campaigns={campaigns}
              memories={memories}
              onForgetMemory={handleForgetMemory}
            />
          )}

          {currentTab === 'udhaar' && (
            <UdhaarView
              lang={lang}
              customers={udhaarCustomers}
              autoRemindersEnabled={guardrails.autonomousUdhaarReminders}
              onToggleAutoReminders={() =>
                setGuardrails((prev) => ({
                  ...prev,
                  autonomousUdhaarReminders: !prev.autonomousUdhaarReminders,
                }))
              }
              onSelectCustomer={setSelectedUdhaarCustomer}
              onOpenKhataScan={() => setIsKhataScanOpen(true)}
              onAddNewKhataEntry={handleAddNewKhataEntry}
              onSendDirectReminder={(cust) => handleSendManualReminder(cust.id, cust.tone)}
              collectedAmount={homeMetrics.udhaarCollected}
            />
          )}

          {currentTab === 'more' && (
            <div className="space-y-4">
              {/* Sub-tab switcher: Dukaan Insights, Festival Radar, and Guardrails */}
              <div className="flex items-center p-1 rounded-2xl bg-cloud border border-line">
                <button
                  onClick={() => setMoreSubTab('insights')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    moreSubTab === 'insights'
                      ? 'bg-white text-blue shadow-xs font-extrabold'
                      : 'text-charcoal hover:text-ink'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dukaan Insights</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('festivals')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    moreSubTab === 'festivals'
                      ? 'bg-white text-blue shadow-xs font-extrabold'
                      : 'text-charcoal hover:text-ink'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Festival Radar</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('settings')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    moreSubTab === 'settings'
                      ? 'bg-white text-blue shadow-xs font-extrabold'
                      : 'text-charcoal hover:text-ink'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Meri Limits</span>
                </button>
              </div>

              {moreSubTab === 'insights' && (
                <InsightsView lang={lang} onNavigateToTab={setCurrentTab} />
              )}

              {moreSubTab === 'festivals' && (
                <FestivalsView
                  lang={lang}
                  onNavigateToTab={(tab) => {
                    if (tab === 'festivals') {
                      setMoreSubTab('festivals');
                    } else {
                      setCurrentTab(tab as TabKey);
                    }
                  }}
                  onApproveVratKit={() => {
                    showToast('Navratri 9-Day Vrat Kit Campaign tayyar ho gaya! 🎉');
                    setCurrentTab('campaigns');
                  }}
                />
              )}

              {moreSubTab === 'settings' && (
                <SettingsView
                  guardrails={guardrails}
                  onUpdateGuardrails={handleUpdateGuardrails}
                  lang={lang}
                  onLanguageChange={setLang}
                  memories={memories}
                  onResetDemoData={handleResetDemoData}
                  onReplayOnboarding={() => setIsOnboardingOpen(true)}
                  onOpenDemoLab={() => setIsDemoOpen(true)}
                />
              )}
            </div>
          )}
        </main>

        {/* Right Activity Feed on Desktop */}
        <DesktopActivityFeed items={activityFeed} />
      </div>

      {/* Mobile Bottom Navigation Bar (5 Items) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lang={lang}
        opportunitiesCount={activeOppCount}
        pendingUdhaarCount={pendingUdhaarCount}
      />

      {/* Floating Action Companion: Bot / Mic + Bahi-Khata Camera (Mobile only) */}
      <div className="fixed bottom-20 md:hidden right-3.5 z-40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
        {/* Bahi-Khata Camera Button */}
        <button
          onClick={() => setIsKhataScanOpen(true)}
          className="h-10 px-3 rounded-full bg-white/95 backdrop-blur-md text-obsidian border border-line/80 shadow-feature hover:border-blue hover:shadow-md transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer group"
          title="Bahi-Khata Register Scan Karein"
          aria-label="Scan Bahi-Khata"
        >
          <div className="w-6 h-6 rounded-full bg-cloud flex items-center justify-center text-blue group-hover:bg-sky transition-colors">
            <Camera className="w-3.5 h-3.5 text-blue" />
          </div>
          <span className="font-google font-bold text-xs text-obsidian hidden sm:inline">
            Khata Scan
          </span>
        </button>

        {/* Floating Vyom AI Bot / Mic Button */}
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="h-10 px-3.5 rounded-full bg-gradient-to-r from-blue to-blue-dark text-white shadow-feature hover:shadow-glow-blue transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer relative overflow-hidden group"
          title="Vyom AI Bot - Bolke Poochhein"
          aria-label="Open Vyom Voice Assistant"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-0.5 rounded-full bg-white/30 animate-ping opacity-60" />
            <Mic className="w-4 h-4 text-white relative z-10" />
          </div>
          <span className="font-google font-black text-xs text-white tracking-tight">
            Vyom AI
          </span>
        </button>
      </div>

      {/* Global Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-obsidian text-white text-xs font-bold shadow-feature flex items-center gap-2 border border-soft-line animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Voice Assistant Overlay Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        lang={lang}
        onNavigateToTab={setCurrentTab}
        onQuickApproveFromBot={(title, revenue) => {
          const matchingOpp = opportunities.find((o) => o.status === 'new') || opportunities[0];
          handleApproveOpportunity(
            matchingOpp,
            matchingOpp.draftedMessage[lang] || matchingOpp.draftedMessage.hinglish,
            matchingOpp.discountPercent
          );
        }}
        onSendReminderFromBot={(custName) => {
          showToast(`${custName} ko WhatsApp takada reminder bhej diya gaya! ✓`);
        }}
        onOpenKhataScanFromBot={() => {
          setIsKhataScanOpen(true);
        }}
      />

      {/* Opportunity Detail & Approval Sheet */}
      <OpportunityDetailSheet
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onApprove={handleApproveOpportunity}
        onDismiss={handleDismissOpportunity}
        guardrails={guardrails}
        lang={lang}
      />

      {/* Handwritten Khata Scanner Modal */}
      <KhataScannerModal
        isOpen={isKhataScanOpen}
        onClose={() => setIsKhataScanOpen(false)}
        onSaveToLedger={handleSaveScannedToLedger}
      />

      {/* Udhaar Customer Detail Sheet */}
      <UdhaarDetailSheet
        customer={selectedUdhaarCustomer}
        onClose={() => setSelectedUdhaarCustomer(null)}
        onMarkPaid={handleMarkPaid}
        onSendManualReminder={handleSendManualReminder}
        lang={lang}
      />

      {/* Onboarding Walkthrough Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        lang={lang}
        onLanguageSelect={setLang}
        guardrails={guardrails}
        onUpdateGuardrails={handleUpdateGuardrails}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToTab={setCurrentTab}
      />

      {/* Interactive Demo Lab Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onRefreshData={refreshAllData}
        onAddToast={showToast}
      />

      {/* PWA Install Banner */}
      <InstallPromptBanner />
    </div>
  );
}
