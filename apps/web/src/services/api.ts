/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Campaign,
  Guardrails,
  KhataEntry,
  Language,
  MemoryItem,
  Opportunity,
  UdhaarCustomer,
} from '../types';

// In development, Vite proxies /api to http://localhost:8000
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export interface HomeMetrics {
  today_sales_paise: number;
  today_orders: number;
  pending_approvals_count: number;
  active_udhaar_paise: number;
  recovered_this_month_paise: number;
}

export interface FestivalBanner {
  festival_key: string;
  name: { en: string; hi: string; hinglish: string; mr?: string };
  phase: string;
  headline_en: string;
  headline_hi: string;
  headline_hinglish: string;
  days_to_start?: number;
  action_label: string;
}

export interface UdhaarStrip {
  total_outstanding_paise: number;
  overdue_count: number;
  earliest_due_date?: string;
  recommended_action: string;
}

export interface SparklineDay {
  date: string;
  sales_paise: number;
}

export interface HomeResponse {
  merchant_name: string;
  shop_code: string;
  city: string;
  metrics: HomeMetrics;
  festival_banner?: FestivalBanner | null;
  top_approvals: any[];
  udhaar_strip: UdhaarStrip;
  sparkline: SparklineDay[];
}

export interface UdhaarSummary {
  total_outstanding_paise: number;
  overdue_paise: number;
  overdue_count: number;
  promised_count: number;
  collected_this_month_paise: number;
  active_customers_count: number;
}

export interface FestivalContextItem {
  key: string;
  names: { en: string; hi: string; hinglish: string; mr?: string };
  phase: string;
  start_date: string;
  end_date: string;
  days_to_start?: number;
  days_to_end?: number;
  cultural_notes?: string;
}

export interface FestivalContextResponse {
  upcoming: FestivalContextItem[];
  current: FestivalContextItem[];
  recent: FestivalContextItem[];
}

// Universal fetch helper with timeout & error handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || errBody.message || `API error ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ----------------- HOME -----------------
export async function getHomeDashboard(): Promise<HomeResponse> {
  return request<HomeResponse>('/home');
}

// ----------------- OPPORTUNITIES -----------------
export async function getOpportunities(status?: string, kind?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (kind) params.append('kind', kind);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<any[]>(`/opportunities${q}`);
}

export async function approveOpportunity(
  opportunityId: string,
  variantKey: string = 'primary',
  via: string = 'tap',
  customMessage?: string,
  discountPercent?: number,
  title?: string
): Promise<any> {
  return request<any>(`/opportunities/${opportunityId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      variant_key: variantKey,
      via,
      custom_message: customMessage,
      discount_percent: discountPercent,
      title,
      send_immediately: true,
    }),
  });
}

export async function dismissOpportunity(
  opportunityId: string,
  reason: string = 'merchant_dismissed'
): Promise<any> {
  return request<any>(`/opportunities/${opportunityId}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function explainOpportunity(opportunityId: string, lang: string = 'hinglish'): Promise<any> {
  return request<any>(`/opportunities/${opportunityId}/explain?lang=${lang}`);
}

// ----------------- CAMPAIGNS -----------------
export async function getCampaigns(status?: string): Promise<any[]> {
  const q = status ? `?status=${status}` : '';
  return request<any[]>(`/campaigns${q}`);
}

export async function broadcastOffer(payload: {
  title: string;
  message: string;
  discount_percent?: number;
  campaign_type?: string;
}): Promise<any> {
  return request<any>('/campaigns/broadcast-offer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resendCampaignBroadcast(
  campaignId: string,
  payload?: {
    title?: string;
    offer?: string;
    custom_message?: string;
    campaign_type?: string;
    discount_percent?: number;
  }
): Promise<any> {
  return request<any>(`/campaigns/${campaignId}/broadcast`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function pauseCampaign(campaignId: string): Promise<any> {
  return request<any>(`/campaigns/${campaignId}/pause`, { method: 'POST' });
}


export async function resumeCampaign(campaignId: string): Promise<any> {
  return request<any>(`/campaigns/${campaignId}/resume`, { method: 'POST' });
}

export async function pauseAllCampaigns(): Promise<any> {
  return request<any>('/campaigns/pause-all', { method: 'POST' });
}

// ----------------- UDHAAR / KHATA -----------------
export async function getUdhaarSummary(): Promise<UdhaarSummary> {
  return request<UdhaarSummary>('/udhaar/summary');
}

export async function getKhataEntries(status?: string, customerId?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (customerId) params.append('customer_id', customerId);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request<any[]>(`/udhaar/entries${q}`);
}

export async function createKhataEntry(payload: {
  customer_id: string;
  amount_total_paise: number;
  due_date: string;
}): Promise<any> {
  return request<any>('/udhaar/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function markKhataPaid(entryId: string, amountPaidPaise?: number): Promise<any> {
  const q = amountPaidPaise !== undefined ? `?amount_paid_paise=${amountPaidPaise}` : '';
  return request<any>(`/udhaar/entries/${entryId}/mark-paid${q}`, {
    method: 'POST',
  });
}

export async function sendKhataReminder(entryId: string): Promise<{
  status: string;
  tone: string;
  message: string;
  customer: string;
}> {
  return request<{
    status: string;
    tone: string;
    message: string;
    customer: string;
  }>(`/udhaar/entries/${entryId}/remind-now`, {
    method: 'POST',
  });
}

// ----------------- FESTIVALS -----------------
export async function getFestivalContext(): Promise<FestivalContextResponse> {
  return request<FestivalContextResponse>('/festivals/context');
}

export async function getFestivalTimeline(): Promise<any[]> {
  return request<any[]>('/festivals/timeline');
}

// ----------------- SETTINGS & GUARDRAILS -----------------
export async function getGuardrails(): Promise<any> {
  return request<any>('/settings/guardrails');
}

export async function updateGuardrails(data: any): Promise<any> {
  return request<any>('/settings/guardrails', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getBusinessProfile(): Promise<any> {
  return request<any>('/settings/profile');
}

export async function updateStoreDescription(storeDescription: string): Promise<any> {
  return request<any>('/settings/description', {
    method: 'PUT',
    body: JSON.stringify({ store_description: storeDescription }),
  });
}

export async function transcribeVoiceAudio(audio: Blob, language: Language): Promise<string> {
  const languageCode = language === 'hindi' ? 'hi-IN' : language === 'marathi' ? 'mr-IN' : 'en-IN';
  const formData = new FormData();
  formData.append('audio', audio, 'onboarding-description.webm');

  const res = await fetch(`${API_BASE}/copilot/transcribe?language_code=${languageCode}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Transcription failed (${res.status})`);
  const data = (await res.json()) as { transcript: string };
  return data.transcript;
}

export async function getMemories(): Promise<any[]> {
  return request<any[]>('/settings/memories');
}

export async function deleteMemory(memoryId: string): Promise<any> {
  return request<any>(`/settings/memories/${memoryId}`, { method: 'DELETE' });
}

// ----------------- COPILOT ASSISTANT -----------------
export async function sendCopilotChat(query: string, sessionId?: string): Promise<{
  session_id: string;
  text: string;
  transcript?: string;
  tool_calls: any[];
  pending_action?: any;
}> {
  return request<any>('/copilot/chat', {
    method: 'POST',
    body: JSON.stringify({ query, session_id: sessionId }),
  });
}

// ----------------- KHATA SCANS (OCR) -----------------
export async function uploadKhataScan(file: File, createdVia: string = 'upload'): Promise<any> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('created_via', createdVia);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch(`${API_BASE}/khata/scans`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Scan upload error ${res.status}: ${errText}`);
    }
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function confirmKhataScan(scanId: string): Promise<any> {
  return request<any>(`/khata/scans/${scanId}/confirm`, {
    method: 'POST',
  });
}

export async function updateKhataScanRows(scanId: string, rows: any[]): Promise<any> {
  return request<any>(`/khata/scans/${scanId}/rows`, {
    method: 'PATCH',
    body: JSON.stringify({ rows }),
  });
}

// ----------------- DEMO LAB SIMULATIONS -----------------
export async function simulateCustomerVisit(payload: {
  amount_paise?: number;
  payment_mode?: string;
  customer_id?: string;
}): Promise<any> {
  return request<any>('/demo/simulate-visit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function simulateSoundboxPayment(payload: {
  amount_paise: number;
  customer_id?: string;
  khata_entry_id?: string;
}): Promise<any> {
  return request<any>('/demo/simulate-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function advanceDemoTime(days: number = 1): Promise<any> {
  return request<any>('/demo/advance-time', {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export async function setDemoToday(dateStr: string): Promise<any> {
  return request<any>('/demo/set-today', {
    method: 'POST',
    body: JSON.stringify({ date_str: dateStr }),
  });
}

export async function resetDemoState(): Promise<any> {
  return request<any>('/demo/reset', {
    method: 'POST',
  });
}

// ----------------- SSE EVENT STREAM -----------------
export function subscribeToEvents(
  onEvent: (eventType: string, data: any) => void,
  onError?: (err: any) => void
): () => void {
  const sseUrl = `${API_BASE}/events`;
  let eventSource: EventSource | null = null;

  try {
    eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onEvent('message', parsed);
      } catch {
        onEvent('message', event.data);
      }
    };

    // Specific event listeners
    const eventTypes = [
      'connected',
      'paytm.payment_received',
      'demo.visit_simulated',
      'khata.paid',
      'khata.reminder_sent',
      'khata.created',
      'khata_scan.uploaded',
      'khata_scan.confirmed',
      'opportunity.detected',
      'demo.date_changed',
      'demo.reset',
    ];

    eventTypes.forEach((evtName) => {
      eventSource?.addEventListener(evtName, (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          onEvent(evtName, parsed);
        } catch {
          onEvent(evtName, event.data);
        }
      });
    });

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };
  } catch (e) {
    if (onError) onError(e);
  }

  return () => {
    eventSource?.close();
  };
}

// ----------------- DATA MAPPER HELPERS -----------------
// ----------------- DATA MAPPER HELPERS -----------------
export function mapBackendOpportunityToFrontend(raw: any): Opportunity {
  const rawType = raw.type || raw.kind || 'winback';
  let type: 'winback' | 'deadhours' | 'festival' | 'falling' = 'winback';
  if (rawType === 'dead_hour' || rawType === 'deadhours') type = 'deadhours';
  else if (rawType.startsWith('festival') || rawType === 'post_festival_clearance') type = 'festival';
  else if (rawType === 'falling_sales') type = 'falling';

  const potentialRevenue = Math.round((raw.est_return_paise || raw.potential_revenue_paise || 840000) / 100);
  const cost = Math.round((raw.est_cost_paise || raw.cost_paise || 84000) / 100);
  const roi = cost > 0 ? `${(potentialRevenue / cost).toFixed(1)}x` : '10.0x';

  const ev = raw.evidence || {};
  const customerCount = raw.audience_customer_ids?.length || ev.churned_customers_count || raw.customer_count || 14;
  const reasonText = ev.reason || raw.plain_text_explanation || 'Vyom AI ne transaction analysis se yeh mauka calculate kiya hai.';

  // Localized Titles
  let titleHinglish = raw.headline_hinglish || '';
  let titleHi = raw.headline_hi || '';
  let titleMr = raw.headline_mr || '';
  let titleEn = raw.headline_en || '';

  if (!titleHinglish) {
    if (type === 'festival') {
      const fn = ev.festival_name || 'Navratri';
      titleHinglish = `${fn} Special Vrat & Puja Stock Deal`;
      titleHi = `${fn} विशेष व्रत एवं पूजा सामग्री योजना`;
      titleMr = `${fn} विशेष फराळ व पूजा साहित्य योजना`;
      titleEn = `${fn} Festival Essentials & Kit Pre-orders`;
    } else if (type === 'deadhours') {
      const slot = ev.dead_hour_slot || 'Dopahar 2-4 PM';
      titleHinglish = `${slot} Saste Deals Booster`;
      titleHi = `${slot} दोपहर मंदी समय बिक्री ऑफर`;
      titleMr = `${slot} दुपारच्या मंदीत विशेष सवलत ऑफर`;
      titleEn = `${slot} Afternoon Happy Hour Booster`;
    } else if (type === 'falling') {
      titleHinglish = 'Post-Festival Sales Recovery Advisory';
      titleHi = 'त्योहार बाद बिक्री बहाली सलाह';
      titleMr = 'सणानंतरची विक्री वाढवण्याचा सल्ला';
      titleEn = 'Post-Festival Sales Stabilization Advisory';
    } else {
      titleHinglish = 'Chhutte Grahak Win-Back Opportunity';
      titleHi = 'पुराने छूटे ग्राहकों को वापस बुलाने का मौका';
      titleMr = 'जुने नियमित ग्राहक पुन्हा दुकानात आणण्याची संधी';
      titleEn = 'Lapsed Customer Win-Back Campaign';
    }
  }

  return {
    id: raw._id || raw.id || `opp-${Date.now()}`,
    type,
    title: {
      hinglish: titleHinglish,
      hindi: titleHi || titleHinglish,
      marathi: titleMr || titleHinglish,
      english: titleEn || titleHinglish,
    },
    description: {
      hinglish: reasonText,
      hindi: reasonText,
      marathi: reasonText,
      english: reasonText,
    },
    potentialRevenue,
    customerCount,
    draftedMessage: {
      hinglish: raw.variant_a?.body_hinglish || `Sharma Kirana Store: Aapke liye khaas offer ready hai! Aaj hi dukaan aayein.`,
      hindi: raw.variant_a?.body_hi || `शर्मा किराना स्टोर: आपके लिए विशेष छूट! आज ही पधारें।`,
      marathi: raw.variant_a?.body_mr || `शर्मा किराना स्टोअर: तुमच्यासाठी खास सवलत! आजच भेट द्या.`,
      english: raw.variant_a?.body_en || `Sharma Kirana Store: Special discount waiting for you! Visit today.`,
    },
    defaultOffer: `${Math.round(raw.discount_percent || 10)}% Discount Coupon`,
    discountPercent: Math.round(raw.discount_percent || 10),
    audienceDesc: {
      hinglish: `${customerCount} niyamit grahak jo dukaan nahi aa rahe`,
      hindi: `${customerCount} नियमित ग्राहक जो दुकान नहीं आ रहे`,
      marathi: `${customerCount} नियमित ग्राहक जे दुकानात आले नाहीत`,
      english: `${customerCount} regular customers overdue for a visit`,
    },
    estimatedCost: cost,
    expectedRoi: roi,
    reasons: {
      hinglish: [
        reasonText,
        `Est. revenue potential: ₹${potentialRevenue.toLocaleString('en-IN')}`,
        `SMS/WhatsApp open probability 85%+`,
      ],
      hindi: [
        reasonText,
        `अनुमानित कमाई: ₹${potentialRevenue.toLocaleString('en-IN')}`,
        `संदेश पढ़े जाने की 85% से अधिक संभावना`,
      ],
      marathi: [
        reasonText,
        `अंदाजे उत्पन्न: ₹${potentialRevenue.toLocaleString('en-IN')}`,
        `मेसेज वाचले जाण्याची शक्यता ८५%+`,
      ],
      english: [
        reasonText,
        `Estimated revenue upside: ₹${potentialRevenue.toLocaleString('en-IN')}`,
        `WhatsApp open probability >85%`,
      ],
    },
    audioScript: {
      hinglish: `Vyom AI ne dekha ki ${customerCount} customers ke liye mauka hai. Agar yeh launch karein toh ₹${potentialRevenue.toLocaleString('en-IN')} tak ka business ban sakta hai.`,
      hindi: `व्योम ने देखा कि ${customerCount} ग्राहकों के लिए अवसर है। इसे शुरू करने पर ₹${potentialRevenue.toLocaleString('en-IN')} तक का व्यापार हो सकता है।`,
      marathi: `व्योमने पाहिले की ${customerCount} ग्राहकांसाठी संधी आहे. हे सुरू केल्यास ₹${potentialRevenue.toLocaleString('en-IN')} पर्यंत व्यापार होऊ शकतो.`,
      english: `Vyom identified an opportunity across ${customerCount} customers. Launching this could generate up to ₹${potentialRevenue.toLocaleString('en-IN')}.`,
    },
    status: raw.status === 'approved' ? 'running' : (raw.status === 'rejected' || raw.status === 'dismissed') ? 'dismissed' : 'new',
  };
}

export function mapBackendKhataEntryToUdhaarCustomer(raw: any): UdhaarCustomer {
  const balancePaise = raw.balance_paise !== undefined
    ? raw.balance_paise
    : Math.max(0, (raw.amount_total_paise || 0) - (raw.amount_paid_paise || 0));
  const amount = Math.round(balancePaise / 100);
  const name = raw.customer_name || `Grahak ${raw.customer_id?.replace('cust_sharma_', '#') || ''}`;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const daysOverdue = raw.days_overdue !== undefined ? raw.days_overdue : 0;
  const status = raw.status === 'paid' ? 'paid' : raw.status === 'promised' ? 'promised' : 'reminder_sent';
  const tone = daysOverdue > 10 ? 'firm' : 'soft';
  const lang = (raw.customer_language || 'hinglish') as Language;

  const reminders = raw.reminders || [];
  const lastRem = reminders.length > 0 ? reminders[reminders.length - 1] : null;
  const lastReminderDate = lastRem?.sent_at
    ? new Date(lastRem.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : 'Pehle nahi bheja';

  const timeline = reminders.map((r: any) => ({
    date: new Date(r.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    title: r.tone === 'firm' ? 'Kadak Yaad-dehani (Firm)' : 'Vinamra Yaad-dehani (Soft)',
    note: `WhatsApp/SMS reminder deliver hua (${r.delivery_status || 'delivered'})`,
    type: 'reminder' as const,
  }));

  if (raw.amount_paid_paise > 0) {
    timeline.unshift({
      date: raw.updated_at ? new Date(raw.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently',
      title: 'Paytm QR Bhuqtan',
      note: `₹${Math.round(raw.amount_paid_paise / 100)} bhuqtan prapt hua`,
      type: 'payment' as const,
    });
  }

  return {
    id: raw._id || raw.id || raw.customer_id,
    name,
    initials: initials || 'GK',
    phone: raw.customer_phone || '+91 98220 00000',
    amount: amount || Math.round((raw.amount_total_paise || 0) / 100),
    daysOverdue,
    status,
    tone,
    language: lang,
    lastReminderDate,
    promisedDate: raw.promise_date ? new Date(raw.promise_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : undefined,
    trustScore: Math.max(35, 100 - daysOverdue * 3),
    totalUdhaarEver: Math.round((raw.amount_total_paise || 0) / 100) + 1200,
    totalJamaEver: Math.round((raw.amount_paid_paise || 0) / 100) + 1200,
    timeline,
  };
}

export function mapBackendCampaignToFrontend(raw: any): Campaign {
  const m = raw.metrics || {};
  const snapshot = raw.approved_snapshot || {};
  const revenue = Math.round((m.revenue_paise || raw.outcomes?.revenue_paise || 684000) / 100);
  const cost = Math.round((m.cost_paise || raw.outcomes?.cost_paise || 54000) / 100);
  const targetCount = (raw.audience_customer_ids?.length || 0) + (raw.holdout_customer_ids?.length || 0) || 16;
  const sentCount = m.sent || raw.funnel?.sent || targetCount;
  const deliveredCount = m.delivered || raw.funnel?.delivered || Math.round(sentCount * 0.95);
  const repliedCount = m.claimed || raw.funnel?.replied || Math.round(sentCount * 0.45);
  const visitedCount = m.redeemed || raw.funnel?.visited || Math.round(sentCount * 0.25);

  const rawType = snapshot.type || raw.type || 'winback';
  let type: 'winback' | 'deadhours' | 'festival' | 'falling' = 'winback';
  if (rawType === 'dead_hour' || rawType === 'deadhours') type = 'deadhours';
  else if (rawType.startsWith('festival')) type = 'festival';
  else if (rawType === 'falling_sales') type = 'falling';

  const rawTitle = raw.title || snapshot.title;
  const titleText =
    (typeof rawTitle === 'object' && rawTitle ? (rawTitle.hinglish || rawTitle.english) : rawTitle) ||
    snapshot.title_key ||
    'Vyom Campaign';

  const customMessage = snapshot.custom_message || snapshot.message || raw.message;
  const offerText =
    raw.offer ||
    (snapshot.offer?.type ? `${snapshot.offer.type} Offer` : typeof snapshot.offer === 'string' ? snapshot.offer : null) ||
    (snapshot.discount ? `${snapshot.discount}% Discount Offer` : '10% Discount Offer');

  return {
    id: raw._id || raw.id || `camp-${Date.now()}`,
    title: {
      hinglish: typeof rawTitle === 'object' && rawTitle?.hinglish ? rawTitle.hinglish : titleText,
      hindi: typeof rawTitle === 'object' && rawTitle?.hindi ? rawTitle.hindi : titleText,
      marathi: typeof rawTitle === 'object' && rawTitle?.marathi ? rawTitle.marathi : titleText,
      english: typeof rawTitle === 'object' && rawTitle?.english ? rawTitle.english : titleText,
    },
    type,
    status: raw.status === 'running' || raw.status === 'scheduled' ? 'running' : 'completed',
    startDate: raw.created_at ? new Date(raw.created_at).toLocaleDateString('en-IN') : 'Chalu hai',
    offer: offerText,
    message: customMessage,
    draftedMessage: customMessage
      ? {
          hinglish: customMessage,
          hindi: customMessage,
          marathi: customMessage,
          english: customMessage,
        }
      : undefined,
    targetCount,
    funnel: {
      sent: sentCount,
      delivered: deliveredCount,
      replied: repliedCount,
      visited: visitedCount,
    },
    outcome: {
      revenue,
      recoveredCount: visitedCount,
      cost,
      netRoi: m.roi ? `${m.roi.toFixed(1)}x` : '12.6x',
    },
    chartData: [
      { day: 'Day 1', revenue: Math.round(revenue * 0.35), customers: Math.max(1, Math.round(visitedCount * 0.3)) },
      { day: 'Day 2', revenue: Math.round(revenue * 0.7), customers: Math.max(2, Math.round(visitedCount * 0.65)) },
      { day: 'Day 3', revenue, customers: visitedCount },
    ],
  };
}
