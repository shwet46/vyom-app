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
  via: string = 'tap'
): Promise<any> {
  return request<any>(`/opportunities/${opportunityId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ variant_key: variantKey, via }),
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
export async function uploadKhataScan(file: File, createdVia: string = 'camera'): Promise<any> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('created_via', createdVia);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}/khata/scans`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Scan upload error ${res.status}`);
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
export function mapBackendOpportunityToFrontend(raw: any): Opportunity {
  const kind = raw.kind || 'winback';
  let type: 'winback' | 'deadhours' | 'festival' | 'falling' = 'winback';
  if (kind === 'deadhours') type = 'deadhours';
  else if (kind === 'festival') type = 'festival';
  else if (kind === 'falling_sales') type = 'falling';

  const potentialRevenue = Math.round((raw.potential_revenue_paise || 0) / 100);
  const cost = Math.round((raw.cost_paise || 0) / 100);
  const roi = raw.expected_roi_multiple ? `${raw.expected_roi_multiple}x` : '10.0x';

  const titleHinglish = raw.headline_hinglish || raw.headline_hi || raw.headline_en || 'Kirana Mauka';
  const titleHi = raw.headline_hi || titleHinglish;
  const titleEn = raw.headline_en || titleHinglish;
  const descHinglish = raw.plain_text_explanation || 'Vyom ne yeh transaction analysis se dhoonda hai.';

  return {
    id: raw._id || raw.id || `opp-${Date.now()}`,
    type,
    title: {
      hinglish: titleHinglish,
      hindi: titleHi,
      marathi: titleHi,
      english: titleEn,
    },
    description: {
      hinglish: descHinglish,
      hindi: raw.headline_hi || descHinglish,
      marathi: raw.headline_hi || descHinglish,
      english: raw.plain_text_explanation || descHinglish,
    },
    potentialRevenue: potentialRevenue || 8400,
    customerCount: raw.customer_count || 14,
    draftedMessage: {
      hinglish: raw.variant_a?.body_hinglish || 'Sharma Kirana Store: Aapke liye khaas offer ready hai! Aaj hi dukaan aayein.',
      hindi: raw.variant_a?.body_hi || 'शर्मा किराना स्टोर: आपके लिए विशेष छूट! आज ही पधारें।',
      marathi: raw.variant_a?.body_mr || 'शर्मा किराना स्टोअर: तुमच्यासाठी खास सवलत! आजच भेट द्या.',
      english: raw.variant_a?.body_en || 'Sharma Kirana Store: Special discount waiting for you! Visit today.',
    },
    defaultOffer: `${Math.round(raw.discount_percent || 10)}% Discount Coupon`,
    discountPercent: Math.round(raw.discount_percent || 10),
    audienceDesc: {
      hinglish: `${raw.customer_count || 14} niyamit grahak jo 25+ dino se nahi aaye`,
      hindi: `${raw.customer_count || 14} नियमित ग्राहक जो पिछले 25 दिनों से नहीं आए`,
      marathi: `${raw.customer_count || 14} नियमित ग्राहक जे २५ दिवसांपासून आले नाहीत`,
      english: `${raw.customer_count || 14} regular customers who haven't visited in 25+ days`,
    },
    estimatedCost: cost || 840,
    expectedRoi: roi,
    reasons: {
      hinglish: [
        'Aakhri visit 25-35 din pehle hui thi',
        'Average basket value ₹480 se adhik hai',
        'SMS/WhatsApp read hone ki probability 85% hai',
      ],
      hindi: [
        'अंतिम खरीदारी 25-35 दिन पहले हुई थी',
        'औसत बिल ₹480 से अधिक रहता है',
        'संदेश पढ़े जाने की 85% संभावना है',
      ],
      marathi: [
        'शेवटची भेट २५-३५ दिवसांपूर्वी झाली होती',
        'सरासरी खरेदी ₹४८० पेक्षा जास्त आहे',
        'मेसेज वाचले जाण्याची शक्यता ८५% आहे',
      ],
      english: [
        'Last purchase was 25–35 days ago',
        'Average order basket exceeds ₹480',
        'Customer WhatsApp open probability >85%',
      ],
    },
    audioScript: {
      hinglish: `Vyom AI ne dekha ki ${raw.customer_count || 14} regular customers dukaan nahi aa rahe. Agar 10% coupon bhejein toh ₹${potentialRevenue} tak ka revenue wapas aa sakta hai.`,
      hindi: `व्योम ने देखा कि ${raw.customer_count || 14} ग्राहक काफी दिनों से नहीं आए। 10% छूट से ₹${potentialRevenue} तक की बिक्री वापस मिल सकती है।`,
      marathi: `व्योमने पाहिले की ${raw.customer_count || 14} ग्राहक अनेक दिवसांपासून आले नाहीत. १०% सवलतीमुळे ₹${potentialRevenue} पर्यंत विक्री होऊ शकते.`,
      english: `Vyom detected ${raw.customer_count || 14} lapsed customers. Sending a 10% coupon can recover up to ₹${potentialRevenue} in sales.`,
    },
    status: raw.status === 'approved' ? 'running' : raw.status === 'rejected' ? 'dismissed' : 'new',
  };
}

export function mapBackendCampaignToFrontend(raw: any): Campaign {
  const funnel = raw.funnel || {};
  const outcomes = raw.outcomes || {};
  const revenue = Math.round((outcomes.revenue_paise || 0) / 100);
  const cost = Math.round((outcomes.cost_paise || 0) / 100);

  return {
    id: raw._id || raw.id || `camp-${Date.now()}`,
    title: {
      hinglish: raw.title || 'Vyom Campaign',
      hindi: raw.title || 'व्योम अभियान',
      marathi: raw.title || 'व्योम मोहीम',
      english: raw.title || 'Vyom Campaign',
    },
    type: (raw.kind as any) || 'winback',
    status: raw.status === 'running' || raw.status === 'scheduled' ? 'running' : 'completed',
    startDate: raw.created_at ? new Date(raw.created_at).toLocaleDateString('en-IN') : 'Chalu hai',
    offer: raw.offer || '10% Discount Offer',
    targetCount: (raw.audience_customer_ids?.length || 14) + (raw.holdout_customer_ids?.length || 2),
    funnel: {
      sent: funnel.sent || 14,
      delivered: funnel.delivered || 14,
      replied: funnel.read || Math.floor((funnel.sent || 14) * 0.45),
      visited: funnel.converted || Math.floor((funnel.sent || 14) * 0.25),
    },
    outcome: {
      revenue: revenue || 6840,
      recoveredCount: funnel.converted || 4,
      cost: cost || 540,
      netRoi: outcomes.roi_multiple ? `${outcomes.roi_multiple}x` : '12.6x',
    },
    chartData: [
      { day: 'Day 1', revenue: Math.round(revenue * 0.4), customers: 2 },
      { day: 'Day 2', revenue: Math.round(revenue * 0.7), customers: 3 },
      { day: 'Day 3', revenue: revenue, customers: funnel.converted || 4 },
    ],
  };
}
