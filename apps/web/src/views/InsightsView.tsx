import React from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Sparkles,
  Store,
  TrendingUp,
  Calendar,
  AlertCircle,
  ShoppingBag,
  Users,
  Clock,
  ArrowRight,
} from '../components/icons';
import { Language } from '../types';
import { formatRupee } from '../utils/formatters';

interface InsightsViewProps {
  lang: Language;
  onNavigateToTab: (tab: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'more') => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ lang, onNavigateToTab }) => {
  // Peak hours heatmap grid: 7 days × 6 representative slots
  const days = ['Som (Mon)', 'Mangal', 'Budh', 'Guru', 'Shukra', 'Shani', 'Ravi (Sun)'];
  const timeSlots = ['8–11 AM', '11–2 PM', '2–4 PM (Dead)', '4–6 PM', '6–8 PM (Peak)', '8–10 PM'];

  // Intensity matrix (0: empty, 1: low, 2: medium, 3: high, 4: super peak)
  const heatmapData = [
    [2, 3, 0, 2, 4, 3], // Mon
    [2, 2, 0, 2, 3, 3], // Tue
    [3, 3, 0, 2, 4, 3], // Wed
    [2, 2, 1, 2, 3, 2], // Thu
    [3, 3, 0, 3, 4, 4], // Fri
    [4, 4, 1, 4, 4, 4], // Sat
    [4, 4, 1, 3, 4, 3], // Sun
  ];

  const topItems = [
    { name: 'Aashirvaad Shuddh Chakki Atta (10kg)', soldCount: 142, revenue: 63900 },
    { name: 'Fortune Sunlite Sunflower Oil (1L)', soldCount: 118, revenue: 16520, alert: 'Down 35%' },
    { name: 'Amul Butter Pasteurised (500g)', soldCount: 94, revenue: 26320 },
    { name: 'Tata Salt Vacuum Evaporated (1kg)', soldCount: 180, revenue: 5040 },
    { name: 'Wagh Bakri Premium Tea (500g)', soldCount: 76, revenue: 21280 },
  ];

  const salesTrendData = [
    { day: 'Day 1', sales: 6800 },
    { day: 'Day 2', sales: 7100 },
    { day: 'Day 3', sales: 6900 },
    { day: 'Day 4', sales: 6200 }, // Falling
    { day: 'Day 5', sales: 6050 }, // Alert
    { day: 'Day 6', sales: 6850 },
    { day: 'Day 7', sales: 7420 },
  ];

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-150">
      {/* Profile Overview */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky/40 to-cloud border border-line shadow-feature">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-line text-blue font-extrabold text-xl flex items-center justify-center shadow-button">
            SK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-obsidian tracking-tight">Sharma Kirana Store</h1>
              <span className="text-[10px] font-bold text-blue bg-sky px-2 py-0.5 rounded-full uppercase">
                Pune
              </span>
            </div>
            <p className="text-xs text-charcoal mt-0.5">
              Paytm POS Terminal #982344 • 480 Monthly Active Kirana Shoppers
            </p>
          </div>
        </div>
      </div>

      {/* 3 Key Store Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-line shadow-xs">
          <div className="text-[11px] text-slate font-medium">Avg Ticket Size</div>
          <div className="text-xl font-black text-obsidian tracking-tight mt-0.5">
            {formatRupee(340)}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">+₹32 vs city avg</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-line shadow-xs">
          <div className="text-[11px] text-slate font-medium">Repeat Grahak %</div>
          <div className="text-xl font-black text-blue tracking-tight mt-0.5">
            68%
          </div>
          <div className="text-[10px] text-charcoal">High loyalty store</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky/50 border border-blue shadow-xs">
          <div className="text-[11px] text-blue font-bold">Dead Hours Alert</div>
          <div className="text-base font-black text-obsidian tracking-tight mt-0.5">
            2 PM – 4 PM
          </div>
          <div className="text-[10px] text-blue font-medium">82% footfall drop</div>
        </div>
      </div>

      {/* Local Signals (Pune Festivals & Events) */}
      <div className="p-5 rounded-3xl bg-white border border-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue" />
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight">
              Aaspas Ke Signals (Pune Local Events)
            </h3>
          </div>
          <span className="text-[10px] text-slate font-medium">Auto-detected by Vyom</span>
        </div>

        <p className="text-xs text-charcoal leading-relaxed">
          Vyom ne aaspas ke 3 bade events detect kiye hain jinse dukaan par demand badh sakti hai:
        </p>

        <div className="space-y-2">
          <div
            onClick={() => onNavigateToTab('opportunities')}
            className="p-3 rounded-2xl bg-sky/30 border border-sky/70 hover:border-blue transition cursor-pointer flex items-center justify-between gap-2"
          >
            <div>
              <div className="font-bold text-xs text-obsidian">
                🐘 Ganesh Chaturthi (4 Din Baki)
              </div>
              <div className="text-[11px] text-charcoal mt-0.5">
                Modak peeth, elaichi aur shuddh ghee ki demand 3x badhne wali hai
              </div>
            </div>
            <span className="text-xs font-bold text-blue flex items-center gap-1 flex-shrink-0">
              <span>Offer Banayein</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-cloud border border-soft-line flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-xs text-obsidian">
                🥦 Shukrawar Peth Local Market Day (Kal)
              </div>
              <div className="text-[11px] text-charcoal mt-0.5">
                Bahar se log aate hain — shaam ko cold drinks aur packaged snacks bikte hain
              </div>
            </div>
            <span className="text-[10px] text-slate font-medium">Auto-optimizing</span>
          </div>

          <div className="p-3 rounded-2xl bg-cloud border border-soft-line flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-xs text-obsidian">
                🏏 India vs Aus T20 Match (Ravi Shaam)
              </div>
              <div className="text-[11px] text-charcoal mt-0.5">
                Chips, namkeen aur cold beverage combo banayein
              </div>
            </div>
            <span className="text-[10px] text-slate font-medium">Scheduled</span>
          </div>
        </div>
      </div>

      {/* Peak Hours Heatmap Grid */}
      <div className="p-5 rounded-3xl bg-white border border-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue" />
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight">
              Dukaan Ka Peak Hours Heatmap (7 Din × Ghante)
            </h3>
          </div>
          <span className="text-[10px] text-charcoal font-medium">Paytm Footfall Data</span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[420px]">
            {/* Header row of time slots */}
            <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-slate mb-1">
              <div className="text-left">Day</div>
              {timeSlots.map((ts, idx) => (
                <div key={idx} className="text-center truncate">
                  {ts.split(' ')[0]}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {days.map((d, dIdx) => (
              <div key={dIdx} className="grid grid-cols-7 gap-1 mb-1 items-center">
                <div className="text-[11px] font-semibold text-charcoal truncate">{d.split(' ')[0]}</div>
                {heatmapData[dIdx].map((intensity, sIdx) => {
                  let bg = 'bg-cloud border border-soft-line text-slate';
                  if (intensity === 0) bg = 'bg-rose-50 text-error border border-rose-100 font-bold'; // Dead hours
                  else if (intensity === 1) bg = 'bg-sky/30 border border-sky/50';
                  else if (intensity === 2) bg = 'bg-sky text-blue font-bold';
                  else if (intensity === 3) bg = 'bg-[#2597d0] text-white font-bold';
                  else if (intensity === 4) bg = 'bg-[#0f6896] text-white font-black'; // Super peak

                  return (
                    <div
                      key={sIdx}
                      className={`h-7 rounded-lg flex items-center justify-center text-[10px] ${bg}`}
                      title={`${d} at ${timeSlots[sIdx]}`}
                    >
                      {intensity === 0 ? 'Dead' : intensity >= 3 ? 'Peak' : 'Norm'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate pt-2 border-t border-soft-line">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-50 border border-rose-200" />
            <span>Dead (2-4 PM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue" />
            <span>Peak (6-8 PM)</span>
          </div>
        </div>
      </div>

      {/* Sales Trend Line Chart with "Falling Sales" Annotation */}
      <div className="p-5 rounded-3xl bg-white border border-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight">
              7-Day Sales Trend & Churn Signal
            </h3>
            <p className="text-[11px] text-charcoal">
              Vyom detected a temporary dip on Day 4–5 and triggered recovery
            </p>
          </div>
        </div>

        <div className="h-40 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8b8b8b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#8b8b8b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [formatRupee(Number(val)), 'Sales']}
                contentStyle={{
                  backgroundColor: '#070709',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '11px',
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#2597d0"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2597d0' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>AI Note:</strong> Day 4 par bikri 12% giri thi. Vyom ki win-back offer launch hone ke baad Day 7 tak bikri ₹7,420 par wapas aa gayi!
          </span>
        </div>
      </div>

      {/* Top Selling Items Table */}
      <div className="p-5 rounded-3xl bg-white border border-line shadow-feature space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue" />
            <h3 className="font-extrabold text-sm text-obsidian tracking-tight">
              Top Selling Products (Dukaan Ke Anchor Items)
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {topItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-cloud border border-soft-line flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="font-bold text-xs text-obsidian truncate">{item.name}</div>
                <div className="text-[10px] text-slate mt-0.5">
                  {item.soldCount} units sold this month
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-black text-xs text-ink">{formatRupee(item.revenue)}</div>
                {item.alert && (
                  <span className="text-[10px] font-bold text-error bg-rose-100 px-1.5 py-0.2 rounded">
                    {item.alert}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
