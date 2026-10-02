export type SupportedCity = 'Pune' | 'Delhi' | 'Mumbai' | 'Bengaluru';

export interface CityFestival {
  key: string;
  name: string;
  dates: string;
  phase: string;
  tone: 'solemn' | 'devotional' | 'festive';
  desc: string;
  color: string;
}

export interface CityFestivalProfile {
  state: string;
  radarTitle: string;
  timelineTitle: string;
  localSignalTitle: string;
  primaryFestival: string;
  primaryDaysToStart: number;
  primaryDemand: string;
  stockAdvisorTitle: string;
  stockAdvisorSubtitle: string;
  festivals: CityFestival[];
  stockItems: { name: string; role: string; uplift: string; current: number; suggested: number; status: string }[];
}

export const cityFestivalProfiles: Record<SupportedCity, CityFestivalProfile> = {
  Pune: {
    state: 'Maharashtra',
    radarTitle: 'Pune Regional Festival Radar',
    timelineTitle: 'Maharashtra / Pune Upcoming Festivals',
    localSignalTitle: 'Aaspas Ke Signals (Pune Events)',
    primaryFestival: 'Navratri',
    primaryDaysToStart: 11,
    primaryDemand: 'Sabudana, singhara atta aur ghee demand +45% expected',
    stockAdvisorTitle: 'AI Stock Advisor • Navratri Fasting (Vrat)',
    stockAdvisorSubtitle: 'Pune last year sales velocity blended with regional consumption priors.',
    festivals: [
      { key: 'pitru_paksha', name: 'Pitru Paksha (Shraddha)', dates: '16 Sep – 30 Sep 2026', phase: 'RECENT / ENDING', tone: 'solemn', desc: 'Solemn ancestral period. High demand for pooja samagri and vegetarian essentials.', color: 'bg-slate-100 text-slate-700' },
      { key: 'navratri', name: 'Shardiya Navratri & Ghatasthapana', dates: '1 Oct – 10 Oct 2026', phase: 'UPCOMING', tone: 'devotional', desc: 'Vrat staples, fasting flour, sendha namak, makhana, ghee, and pooja items.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      { key: 'dussehra', name: 'Dussehra / Vijayadashami', dates: '20 Oct 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Apta leaves, marigold garlands, sweets, and pooja items.', color: 'bg-cloud text-charcoal' },
      { key: 'diwali', name: 'Diwali Mahotsav Cluster', dates: '5 Nov – 11 Nov 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Faral ingredients, cooking oil, ghee, dry fruits, diyas, and ubtan.', color: 'bg-cloud text-charcoal' },
    ],
    stockItems: [
      { name: 'Sabudana (500g)', role: 'Vrat Staple', uplift: '+240%', current: 18, suggested: 65, status: 'Low Stock' },
      { name: 'Rajgira Atta (500g)', role: 'Vrat Flour', uplift: '+180%', current: 8, suggested: 40, status: 'Reorder' },
      { name: 'Sendha Namak (1kg)', role: 'Fasting Salt', uplift: '+150%', current: 12, suggested: 35, status: 'Low Stock' },
      { name: 'Pure Cow Ghee (1L)', role: 'Puja & Cooking', uplift: '+95%', current: 14, suggested: 28, status: 'Adequate' },
      { name: 'Phool Makhana (250g)', role: 'Vrat Snack', uplift: '+210%', current: 6, suggested: 30, status: 'Reorder' },
    ],
  },
  Delhi: {
    state: 'Delhi',
    radarTitle: 'Delhi NCR Festival Radar',
    timelineTitle: 'Delhi NCR Upcoming Festivals',
    localSignalTitle: 'Aaspas Ke Signals (Delhi NCR Events)',
    primaryFestival: 'Navratri',
    primaryDaysToStart: 11,
    primaryDemand: 'Kuttu atta, singhara atta aur sendha namak demand +52% expected',
    stockAdvisorTitle: 'AI Stock Advisor • Delhi Navratri Demand',
    stockAdvisorSubtitle: 'Delhi NCR fasting demand blended with your store sales history.',
    festivals: [
      { key: 'navratri', name: 'Shardiya Navratri & Ramleela', dates: '1 Oct – 10 Oct 2026', phase: 'ACTIVE', tone: 'devotional', desc: 'Fasting staples, pooja items, ramleela snacks, and family-gathering essentials.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      { key: 'dussehra', name: 'Dussehra / Vijayadashami', dates: '20 Oct 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Ramleela gatherings drive demand for sweets, flowers, and pooja supplies.', color: 'bg-cloud text-charcoal' },
      { key: 'karwa_chauth', name: 'Karwa Chauth', dates: '29 Oct 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Karwa sets, mehendi supplies, dry fruits, cosmetics, and gift packs.', color: 'bg-cloud text-charcoal' },
      { key: 'diwali', name: 'Diwali & Bhai Dooj', dates: '5 Nov – 11 Nov 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Sweets, dry fruits, diyas, gift hampers, and cooking essentials.', color: 'bg-cloud text-charcoal' },
    ],
    stockItems: [
      { name: 'Kuttu Atta (500g)', role: 'Vrat Flour', uplift: '+260%', current: 12, suggested: 52, status: 'Low Stock' },
      { name: 'Sendha Namak (1kg)', role: 'Fasting Salt', uplift: '+180%', current: 10, suggested: 34, status: 'Reorder' },
      { name: 'Karwa Set', role: 'Karwa Chauth', uplift: '+140%', current: 5, suggested: 24, status: 'Reorder' },
      { name: 'Dry Fruits Gift Box', role: 'Festival Gifting', uplift: '+95%', current: 16, suggested: 30, status: 'Adequate' },
      { name: 'Ghee (1L)', role: 'Puja & Cooking', uplift: '+110%', current: 14, suggested: 32, status: 'Low Stock' },
    ],
  },
  Mumbai: {
    state: 'Maharashtra',
    radarTitle: 'Mumbai Regional Festival Radar',
    timelineTitle: 'Maharashtra / Mumbai Upcoming Festivals',
    localSignalTitle: 'Aaspas Ke Signals (Mumbai Events)',
    primaryFestival: 'Navratri',
    primaryDaysToStart: 11,
    primaryDemand: 'Navratri snacks, sabudana and dandiya-season essentials +48% expected',
    stockAdvisorTitle: 'AI Stock Advisor • Mumbai Navratri Demand',
    stockAdvisorSubtitle: 'Mumbai buying patterns blended with your store sales history.',
    festivals: [
      { key: 'navratri', name: 'Navratri & Dandiya Season', dates: '1 Oct – 10 Oct 2026', phase: 'ACTIVE', tone: 'devotional', desc: 'Vrat staples, dandiya accessories, snacks, ghee, and pooja essentials.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      { key: 'dussehra', name: 'Dussehra / Vijayadashami', dates: '20 Oct 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Flowers, sweets, pooja items, and family celebration essentials.', color: 'bg-cloud text-charcoal' },
      { key: 'diwali', name: 'Diwali & Bhaubeej', dates: '5 Nov – 11 Nov 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Faral, dry fruits, diyas, gift boxes, and cooking essentials.', color: 'bg-cloud text-charcoal' },
      { key: 'gudi_padwa', name: 'Gudi Padwa Planning', dates: '19 Mar 2027', phase: 'LATER', tone: 'festive', desc: 'Seasonal planning signal for sweets, neem, flowers, and household refresh items.', color: 'bg-cloud text-charcoal' },
    ],
    stockItems: [
      { name: 'Sabudana (500g)', role: 'Vrat Staple', uplift: '+220%', current: 16, suggested: 58, status: 'Low Stock' },
      { name: 'Dandiya Snacks', role: 'Seasonal Snack', uplift: '+160%', current: 20, suggested: 44, status: 'Reorder' },
      { name: 'Dry Fruits Gift Box', role: 'Festival Gifting', uplift: '+130%', current: 9, suggested: 28, status: 'Reorder' },
      { name: 'Pure Ghee (1L)', role: 'Puja & Cooking', uplift: '+100%', current: 13, suggested: 28, status: 'Low Stock' },
      { name: 'Faral Ingredients', role: 'Diwali Cooking', uplift: '+90%', current: 25, suggested: 40, status: 'Adequate' },
    ],
  },
  Bengaluru: {
    state: 'Karnataka',
    radarTitle: 'Bengaluru Regional Festival Radar',
    timelineTitle: 'Karnataka / Bengaluru Upcoming Festivals',
    localSignalTitle: 'Aaspas Ke Signals (Bengaluru Events)',
    primaryFestival: 'Dasara',
    primaryDaysToStart: 18,
    primaryDemand: 'Dasara sweets, flowers, pooja supplies and gifting demand +42% expected',
    stockAdvisorTitle: 'AI Stock Advisor • Bengaluru Dasara Demand',
    stockAdvisorSubtitle: 'Bengaluru seasonal demand blended with your store sales history.',
    festivals: [
      { key: 'dasara', name: 'Mysuru Dasara Season', dates: '1 Oct – 22 Oct 2026', phase: 'ACTIVE', tone: 'festive', desc: 'Sweets, flowers, pooja supplies, and family celebration essentials.', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      { key: 'karnataka_rajyotsava', name: 'Karnataka Rajyotsava', dates: '1 Nov 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Regional celebration demand for flowers, sweets, flags, and gathering supplies.', color: 'bg-cloud text-charcoal' },
      { key: 'deepavali', name: 'Deepavali', dates: '8 Nov – 10 Nov 2026', phase: 'UPCOMING', tone: 'festive', desc: 'Sweets, dry fruits, diyas, gift boxes, and cooking essentials.', color: 'bg-cloud text-charcoal' },
      { key: 'sankranti', name: 'Makara Sankranti Planning', dates: '15 Jan 2027', phase: 'LATER', tone: 'festive', desc: 'Seasonal signal for sesame, jaggery, sugarcane, and gifting packs.', color: 'bg-cloud text-charcoal' },
    ],
    stockItems: [
      { name: 'Mysore Pak Ingredients', role: 'Dasara Sweet', uplift: '+190%', current: 10, suggested: 36, status: 'Reorder' },
      { name: 'Jasmine Flowers', role: 'Pooja Essential', uplift: '+145%', current: 8, suggested: 26, status: 'Low Stock' },
      { name: 'Dry Coconut (250g)', role: 'Pooja & Cooking', uplift: '+120%', current: 14, suggested: 32, status: 'Reorder' },
      { name: 'Dry Fruits Gift Box', role: 'Festival Gifting', uplift: '+105%', current: 11, suggested: 27, status: 'Low Stock' },
      { name: 'Ghee (1L)', role: 'Sweets & Cooking', uplift: '+85%', current: 18, suggested: 30, status: 'Adequate' },
    ],
  },
};
