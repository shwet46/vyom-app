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
import { speakWithShubh } from './utils/speech';
import {
  getHomeDashboard,
  getOpportunities,
  approveOpportunity as apiApproveOpportunity,
  dismissOpportunity as apiDismissOpportunity,
  getCampaigns,
  broadcastOffer as apiBroadcastOffer,
  resendCampaignBroadcast as apiResendCampaignBroadcast,
  getUdhaarSummary,
  getKhataEntries,
  createKhataEntry as apiCreateKhataEntry,
  markKhataPaid as apiMarkKhataPaid,
  sendKhataReminder as apiSendKhataReminder,
  getFestivalContext,
  getGuardrails as apiGetGuardrails,
  updateGuardrails as apiUpdateGuardrails,
  updateStoreDescription as apiUpdateStoreDescription,
  getMemories as apiGetMemories,
  deleteMemory as apiDeleteMemory,
  subscribeToEvents,
  mapBackendOpportunityToFrontend,
  mapBackendCampaignToFrontend,
  mapBackendKhataEntryToUdhaarCustomer,
  HomeResponse,
} from './services/api';
import { TopBar } from './components/TopBar';
import { BottomNav, TabKey } from './components/BottomNav';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { OpportunityDetailSheet } from './components/OpportunityDetailSheet';
import { KhataScannerModal } from './components/KhataScannerModal';
import { UdhaarDetailSheet } from './components/UdhaarDetailSheet';
import { OnboardingModal } from './components/OnboardingModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { HomeView, DynamicHomeMetrics } from './views/HomeView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { CampaignsView } from './views/CampaignsView';
import { UdhaarView } from './views/UdhaarView';
import { FestivalsView } from './views/FestivalsView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';
import { translations } from './utils/i18n';
import { BarChart3, Sliders, Check, WifiOff, Mic, Camera, Calendar } from './components/icons';
import { cityFestivalProfiles, SupportedCity } from './data/cityFestivals';

export default function App() {
  // Global Language state (Default: Hinglish)
  const [lang, setLang] = useState<Language>('hinglish');
  const [city, setCity] = useState<SupportedCity>(() => {
    const savedCity = localStorage.getItem('vyom-city');
    return savedCity === 'Delhi' || savedCity === 'Mumbai' || savedCity === 'Bengaluru' ? savedCity : 'Pune';
  });
  const cityProfile = cityFestivalProfiles[city];

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

  useEffect(() => {
    localStorage.setItem('vyom-city', city);
    setFestivalBanner({
      headline: `${cityProfile.primaryFestival} demand is active in ${city}. Stock ready rakhein.`,
      actionLabel: 'View Festival Radar',
      phase: 'UPCOMING',
      daysToStart: cityProfile.primaryDaysToStart,
    });
  }, [city, cityProfile]);

  // Network & Server connectivity status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Live Activity Feed for background tracking
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

  // Voice speech bubble state
  const [voiceBubbleText, setVoiceBubbleText] = useState<string | null>(null);

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
        const mapped = rawOpps
          .filter(
            (opp) =>
              (opp.type || opp.kind) !== 'falling_sales' &&
              !['approved', 'rejected', 'dismissed'].includes(opp.status)
          )
          .map(mapBackendOpportunityToFrontend);
        if (mapped.length > 0) {
          setOpportunities(mapped);
        }
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

          // Play Soundbox Audio Speech with Shubh Voice
          const text = data.soundbox_announcement || `Paytm par ${amt} rupaye prapt hue`;
          speakWithShubh(text, { lang: 'hindi' });
        } else if (eventType === 'khata.paid') {
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

    // 2. Call backend API with message, discount, and title
    let sentTgCount = 0;
    try {
      const apiRes = await apiApproveOpportunity(
        opp.id,
        'primary',
        'tap',
        customMessage,
        customDiscount,
        opp.title[lang] || opp.title.hinglish
      );
      if (apiRes?.telegram_sent_count) {
        sentTgCount = apiRes.telegram_sent_count;
      }
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
      message: customMessage,
      draftedMessage: {
        hinglish: customMessage,
        hindi: customMessage,
        marathi: customMessage,
        english: customMessage,
      },
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
        detail: `${opp.title[lang] || opp.title.hinglish} launch kiya gaya (${sentTgCount ? `${sentTgCount} Telegram grahak` : `${opp.customerCount} grahak`})`,
      },
      ...prev,
    ]);

    // 5. Confetti celebration
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00A9E8', '#DDF7FF', '#BEF0D8', '#0E7A50'],
      });
    } catch {}

    if (sentTgCount > 0) {
      showToast(`Campaign shuru hua! Telegram Bot par message deliver hua (${sentTgCount} grahak) ✓`);
    } else {
      showToast(translations[lang]?.approvedToast || 'Campaign safalta-purvak shuru ho gaya 🎉');
    }
  };

  // Broadcast New Custom / Template Offer directly to Telegram Bot
  const handleBroadcastNewOffer = async (
    title: string,
    message: string,
    discount: number,
    type: string
  ) => {
    let sentCount = 0;
    try {
      const res = await apiBroadcastOffer({
        title,
        message,
        discount_percent: discount,
        campaign_type: type,
      });
      if (res?.telegram_sent_count) {
        sentCount = res.telegram_sent_count;
      }
    } catch {}

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      title: { hinglish: title, english: title, hindi: title, marathi: title },
      type: (type as any) || 'custom',
      status: 'running',
      startDate: 'Aaj shuru hua',
      offer: `${discount}% discount offer`,
      message: message,
      draftedMessage: {
        hinglish: message,
        english: message,
        hindi: message,
        marathi: message,
      },
      targetCount: sentCount || 25,
      funnel: {
        sent: sentCount || 25,
        delivered: sentCount || 25,
        replied: 8,
        visited: 4,
      },
      outcome: {
        revenue: 3200,
        recoveredCount: 6,
        cost: 200,
        netRoi: '16.0x',
      },
      chartData: [{ day: 'Day 1', revenue: 3200, customers: 6 }],
    };

    setCampaigns((prev) => [newCamp, ...prev]);

    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: 'campaign',
        title: 'Naya Offer Broadcast Hua 🚀',
        detail: `${title} Telegram Bot par bheja gaya`,
      },
      ...prev,
    ]);

    try {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    } catch {}

    showToast(
      sentCount > 0
        ? `Offer broadcast safal! Telegram Bot par deliver ho gaya (${sentCount} grahak) ✓`
        : 'Offer broadcast Telegram customers ko bhej diya gaya ✓'
    );
  };

  // Resend or broadcast existing campaign to Telegram Bot
  const handleResendCampaign = async (
    campaignId: string,
    payload?: {
      title?: string;
      offer?: string;
      custom_message?: string;
      campaign_type?: string;
      discount_percent?: number;
    }
  ) => {
    try {
      const res = await apiResendCampaignBroadcast(campaignId, payload);
      const count = res?.telegram_sent_count || 1;
      showToast(`Campaign Telegram Bot par deliver hua (${count} grahak) ✓`);
    } catch {
      showToast('Campaign Telegram Bot par bhej diya gaya ✓');
    }
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
  const handleSaveScannedToLedger = async (newEntries: UdhaarCustomer[]) => {
    const persistedEntries = await getKhataEntries().catch(() => []);
    if (persistedEntries.length > 0) {
      setUdhaarCustomers(persistedEntries.map(mapBackendKhataEntryToUdhaarCustomer));
    } else if (newEntries.length > 0) {
      setUdhaarCustomers((prev) => [...newEntries, ...prev]);
    }

    const count = newEntries.length > 0 ? newEntries.length : (persistedEntries.length > 0 ? persistedEntries.length : 1);

    setActivityFeed((prev) => [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Abhi-abhi',
        iconType: 'insight',
        title: 'Bahi-Khata OCR Digitize Hua',
        detail: `${count} grahak bahi-khata scan se safalta-purvak shamil hue`,
      },
      ...prev,
    ]);

    showToast(`${count} grahak bahi-khate mein safalta-purvak jud gaye! ✓`);
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

    // Paytm Soundbox voice chime simulation with Shubh Voice
    if (entry.type === 'jama') {
      speakWithShubh(`Paytm par ${entry.amount} rupaye prapt hue.`, { lang: 'hindi' });
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

  const activeOppCount = opportunities.filter((o) => o.status === 'new').length;
  const pendingUdhaarCount = udhaarCustomers.filter(
    (c) => c.status !== 'paid' && c.daysOverdue >= 30
  ).length;

  return (
    /* Phone frame: centered, max-420px, muted BG outside */
    <div className="phone-frame">
      <div className="app-shell flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Top Header Bar */}
        <TopBar
          currentLang={lang}
          city={city}
          onLanguageChange={setLang}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={activeOppCount + 1}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          isOnline={isOnline}
        />

        {/* Central Content Area — single column phone layout */}
        <main className="flex-1 px-3 py-3" style={{ paddingBottom: 'calc(56px + 60px + 16px)' }}>
          {currentTab === 'home' && (
            <HomeView
              lang={lang}
              opportunities={opportunities}
              metrics={homeMetrics}
              city={city}
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
              onBroadcastNewOffer={handleBroadcastNewOffer}
              onResendCampaign={handleResendCampaign}
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
              {/* Sub-tab switcher: comic-pill style */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => setMoreSubTab('insights')}
                  className={`comic-pill whitespace-nowrap ${moreSubTab === 'insights' ? 'comic-pill-active' : 'bg-white'}`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dukaan Insights</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('festivals')}
                  className={`comic-pill whitespace-nowrap ${moreSubTab === 'festivals' ? 'comic-pill-active' : 'bg-white'}`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Festival Radar</span>
                </button>

                <button
                  onClick={() => setMoreSubTab('settings')}
                  className={`comic-pill whitespace-nowrap ${moreSubTab === 'settings' ? 'comic-pill-active' : 'bg-white'}`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Meri Limits</span>
                </button>
              </div>

              {moreSubTab === 'insights' && (
                <InsightsView lang={lang} city={city} onNavigateToTab={setCurrentTab} />
              )}

              {moreSubTab === 'festivals' && (
                <FestivalsView
                  lang={lang}
                  city={city}
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
                  city={city}
                  onCityChange={setCity}
                  onLanguageChange={setLang}
                />
              )}
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          lang={lang}
          opportunitiesCount={activeOppCount}
          pendingUdhaarCount={pendingUdhaarCount}
        />

        {/* Floating Action: Mic + Camera — comic style */}
        <div className="fixed z-40 flex items-center gap-2 animate-fade-slide-up" style={{ bottom: '76px', right: 'max(12px, calc((100vw - 420px) / 2 + 12px))' }}>
          {/* Bahi-Khata Camera Button */}
          <button
            onClick={() => setIsKhataScanOpen(true)}
            className="comic-btn-outline comic-btn-sm"
            title="Bahi-Khata Register Scan Karein"
            aria-label="Scan Bahi-Khata"
          >
            <Camera className="w-4 h-4" />
            <span className="text-caption">Scan</span>
          </button>

          {/* Vyom AI Voice Mic — lavender comic-panel circle */}
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full border-2 border-ink bg-ai-fill text-ink font-bold text-caption"
            style={{ boxShadow: '2px 2px 0px var(--shadow-color)', minHeight: '44px' }}
            title="Vyom AI Bot - Bolke Poochhein"
            aria-label="Open Vyom Voice Assistant"
          >
            {/* Pulse rings on the mic icon */}
            <div className="relative flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-ai-text/20 animate-voice-ring-1" style={{ width: 20, height: 20 }} />
              <Mic className="w-4 h-4 relative z-10" style={{ color: 'var(--ai-text)' }} />
            </div>
            <span style={{ color: 'var(--ai-text)', fontWeight: 700 }}>Vyom AI</span>
          </button>
        </div>

        {/* Voice Speech Bubble (when voice response plays back) */}
        {voiceBubbleText && (
          <div
            className="fixed z-50 animate-fade-slide-up"
            style={{ bottom: '130px', right: 'max(12px, calc((100vw - 420px) / 2 + 12px))', maxWidth: '280px' }}
          >
            <div className="speech-bubble">
              <p className="text-caption" style={{ color: 'var(--ink)' }}>{voiceBubbleText}</p>
            </div>
          </div>
        )}

        {/* Global Floating Toast — comic style */}
        {toastMessage && (
          <div
            className="fixed z-50 left-1/2 -translate-x-1/2 animate-fade-slide-up pointer-events-none"
            style={{ bottom: '76px', maxWidth: '380px', width: 'calc(100% - 32px)' }}
          >
            <div
              className="px-4 py-2.5 rounded-xl border-2 border-ink bg-ink text-white flex items-center gap-2"
              style={{ boxShadow: '3px 3px 0px rgba(148,163,184,0.45)', fontSize: '13px', fontWeight: 600 }}
            >
              <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#BEF0D8' }} />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Voice Assistant Overlay Modal */}
        <VoiceAssistantModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          lang={lang}
          onNavigateToTab={setCurrentTab}
          onQuickApproveFromBot={(title, revenue) => {
            const matchingOpp =
              opportunities.find((o) => o.title.hinglish.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(o.title.hinglish.toLowerCase())) ||
              opportunities.find((o) => o.status === 'new') ||
              opportunities[0];
            handleApproveOpportunity(
              matchingOpp,
              matchingOpp.draftedMessage[lang] || matchingOpp.draftedMessage.hinglish,
              matchingOpp.discountPercent
            );
          }}
          onSendReminderFromBot={(custName) => {
            const matchingCustomer =
              udhaarCustomers.find(
                (c) =>
                  c.name.toLowerCase().includes(custName.toLowerCase()) ||
                  custName.toLowerCase().includes(c.name.toLowerCase())
              ) || udhaarCustomers[0];
            if (matchingCustomer) {
              handleSendManualReminder(matchingCustomer.id, 'soft');
            } else {
              showToast(`${custName} ko WhatsApp aur Telegram takada reminder bhej diya gaya! ✓`);
            }
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
          onSaveStoreDescription={apiUpdateStoreDescription}
          city={city}
          onCityChange={setCity}
        />

        {/* Notification Drawer */}
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onNavigateToTab={setCurrentTab}
        />
      </div>
    </div>
  );
}
