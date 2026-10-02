export type Language = 'hinglish' | 'hindi' | 'marathi' | 'english';

export type OpportunityType = 'winback' | 'deadhours' | 'festival' | 'falling';

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: Record<Language, string>;
  description: Record<Language, string>;
  potentialRevenue: number;
  customerCount: number;
  draftedMessage: Record<Language, string>;
  defaultOffer: string;
  discountPercent: number;
  audienceDesc: Record<Language, string>;
  estimatedCost: number;
  expectedRoi: string;
  reasons: Record<Language, string[]>;
  audioScript: Record<Language, string>;
  status: 'new' | 'running' | 'dismissed';
}

export interface CampaignFunnel {
  sent: number;
  delivered: number;
  replied: number;
  visited: number;
}

export interface CampaignOutcome {
  revenue: number;
  recoveredCount: number;
  cost: number;
  netRoi: string;
}

export interface Campaign {
  id: string;
  title: Record<Language, string>;
  type: OpportunityType;
  status: 'running' | 'completed';
  startDate: string;
  endDate?: string;
  offer: string;
  message?: string;
  draftedMessage?: Record<Language, string>;
  targetCount: number;
  funnel: CampaignFunnel;
  outcome: CampaignOutcome;
  chartData: { day: string; revenue: number; customers: number }[];
}

export type UdhaarStatus = 'reminder_sent' | 'promised' | 'paid';

export interface KhataEntry {
  id: string;
  date: string;
  items: string;
  type: 'udhaar' | 'jama'; // 'udhaar' = debit/baki, 'jama' = credit/paid
  amount: number;
  balanceAfter: number;
  paymentMode?: 'cash' | 'paytm_qr' | 'upi' | 'manual';
  soundboxVerified?: boolean;
}

export interface UdhaarTimelineEvent {
  date: string;
  title: string;
  note: string;
  type: 'reminder' | 'payment' | 'promise';
}

export interface UdhaarCustomer {
  id: string;
  name: string;
  initials: string;
  phone: string;
  amount: number; // Current outstanding balance (Baki)
  daysOverdue: number;
  status: UdhaarStatus;
  tone: 'soft' | 'firm';
  language: Language;
  lastReminderDate: string;
  promisedDate?: string;
  trustScore?: number; // 0-100
  address?: string;
  totalUdhaarEver?: number;
  totalJamaEver?: number;
  entries?: KhataEntry[];
  timeline: UdhaarTimelineEvent[];
}

export type GenUiType =
  | 'campaign_proposal'
  | 'udhaar_recovery_list'
  | 'dead_hours_deal'
  | 'financial_report'
  | 'khata_action_confirm';

export interface GenUiData {
  type: GenUiType;
  payload: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'vyom';
  text: string;
  timestamp: string;
  genUi?: GenUiData;
  actionText?: string;
  actionTarget?: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'more';
}

export interface MemoryItem {
  id: string;
  text: Record<Language, string>;
  category: 'timing' | 'offer' | 'language' | 'customer';
  dateAdded: string;
}

export interface Guardrails {
  maxWeeklyBudget: number; // e.g. 1500
  maxDiscountPercent: number; // e.g. 15
  maxMessagesPerCustomerPerWeek: number; // e.g. 1
  preferredLanguage: Language;
  quietHoursStart: string; // "21:00"
  quietHoursEnd: string; // "09:00"
  autonomousUdhaarReminders: boolean;
}

export interface ScannedLedgerRow {
  id: string;
  name: string;
  amount: number;
  date: string;
  confidence: number; // 0-100
  selected: boolean;
  items?: string;
  entryType?: 'udhaar' | 'jama';
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  iconType: 'recover' | 'reminder' | 'campaign' | 'insight';
  title: string;
  detail: string;
  amount?: number;
}
