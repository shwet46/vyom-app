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
    <div className="space-y-4 pb-8 animate-in fade-in duration-150">
      {/* Profile Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky/40 via-cloud to-paper border border-line/70 shadow-feature">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border border-line/80 text-blue font-extrabold text-lg flex items-center justify-center shadow-xs font-google">
            SK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-obsidian tracking-tight font-google">Sharma Kirana Store</h1>
              <span className="text-[10px] font-bold text-blue bg-sky px-2 py-0.5 rounded-full uppercase font-google">
                Pune
              </span>
            </div>
            <p className="text-xs text-charcoal mt-0.5 font-sans">
              Paytm POS Terminal #982344 • 480 Monthly Active Kirana Shoppers
            </p>
          </div>
        </div>
      </div>

      {/* 3 Key Store Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-line/70 shadow-feature">
          <div className="text-[11px] text-slate font-medium font-google">Avg Ticket Size</div>
          <div className="text-xl sm:text-2xl font-black text-obsidian tracking-tight font-google mt-0.5">
            {formatRupee(340)}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">+₹32 vs city avg</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-line/70 shadow-feature">
          <div className="text-[11px] text-slate font-medium font-google">Repeat Grahak %</div>
          <div className="text-xl sm:text-2xl font-black text-blue tracking-tight font-google mt-0.5">
            68%
          </div>
          <div className="text-[10px] text-charcoal mt-0.5">High loyalty store</div>
        </div>

        <div className="p-4 rounded-2xl bg-sky/40 border border-blue/20 shadow-feature">
          <div className="text-[11px] text-blue font-bold font-google">Dead Hours Alert</div>
          <div className="text-base sm:text-lg font-black text-obsidian tracking-tight font-google mt-0.5">
            2 PM – 4 PM
          </div>
          <div className="text-[10px] text-blue font-medium mt-0.5">82% footfall drop</div>
        </div>
      </div>

      {/* 2-Column Responsive Dashboard on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: 7-Day Trend + Local Signals */}
        <div className="space-y-4">
          {/* Sales Trend Line Chart with Annotation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
                  7-Day Sales Trend & Churn Signal
                </h3>
                <p className="text-[11px] text-charcoal font-sans">
                  Vyom detected dip on Day 4–5 and triggered win-back
                </p>
              </div>
            </div>

            <div className="h-36 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatRupee(Number(val)), 'Sales']}
                    contentStyle={{
                      backgroundColor: '#09090b',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#2597d0"
                    strokeWidth={2.5}
                    dot={{ fill: '#2597d0', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>
                <strong>AI Note:</strong> Win-back offer launch hone ke baad Day 7 tak bikri ₹7,420 wapas pahunch gayi!
              </span>
            </div>
          </div>

          {/* Local Signals (Pune Festivals & Events) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue" />
                <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
                  Aaspas Ke Signals (Pune Events)
                </h3>
              </div>
              <span className="text-[10px] text-slate font-medium">Auto-detected</span>
            </div>

            <div className="space-y-2">
              <div
                onClick={() => onNavigateToTab('opportunities')}
                className="p-2.5 rounded-xl bg-sky/30 border border-sky/70 hover:border-blue transition cursor-pointer flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-xs text-obsidian">
                    🐘 Ganesh Chaturthi (4 Din Baki)
                  </div>
                  <div className="text-[11px] text-charcoal mt-0.5">
                    Modak rava, jaggery aur pooja samagri demand +45% expected
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-blue flex-shrink-0" />
              </div>

              <div
                onClick={() => onNavigateToTab('opportunities')}
                className="p-2.5 rounded-xl bg-sky/30 border border-sky/70 hover:border-blue transition cursor-pointer flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-xs text-obsidian">
                    🌦️ Monsoon Chai Spike (Heavy Rain)
                  </div>
                  <div className="text-[11px] text-charcoal mt-0.5">
                    Ginger tea + biscuit combos demand +28% spike
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-blue flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Heatmap + Top Selling Products */}
        <div className="space-y-4">
          {/* Peak Hours Heatmap */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue" />
                <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
                  Dukaan Footfall Heatmap (7 Days)
                </h3>
              </div>
              <span className="text-[10px] text-slate font-medium">Paytm Soundbox Times</span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[280px]">
                {/* Header row */}
                <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-slate mb-1">
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
                    <div className="text-[10px] font-semibold text-charcoal truncate">{d.split(' ')[0]}</div>
                    {heatmapData[dIdx].map((intensity, sIdx) => {
                      let bg = 'bg-cloud border border-soft-line text-slate';
                      if (intensity === 0) bg = 'bg-rose-50 text-error border border-rose-100 font-bold';
                      else if (intensity === 1) bg = 'bg-sky/30 border border-sky/50';
                      else if (intensity === 2) bg = 'bg-sky text-blue font-bold';
                      else if (intensity === 3) bg = 'bg-[#2597d0] text-white font-bold';
                      else if (intensity === 4) bg = 'bg-[#0f6896] text-white font-black';

                      return (
                        <div
                          key={sIdx}
                          className={`h-6 rounded-md flex items-center justify-center text-[9px] ${bg}`}
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

            <div className="flex items-center justify-between text-[10px] text-slate pt-2 border-t border-soft-line">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-50 border border-rose-200" />
                <span>Dead (2-4 PM)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky" />
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue" />
                <span>Peak (6-8 PM)</span>
              </div>
            </div>
          </div>

          {/* Top Selling Items Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line/70 shadow-feature space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue" />
                <h3 className="font-extrabold text-sm text-obsidian tracking-tight font-google">
                  Top Selling Products
                </h3>
              </div>
            </div>

            <div className="space-y-1.5">
              {topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-cloud border border-soft-line flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-obsidian truncate">{item.name}</div>
                    <div className="text-[10px] text-slate mt-0.5">
                      {item.soldCount} units sold
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-xs text-ink font-google">{formatRupee(item.revenue)}</div>
                    {item.alert && (
                      <span className="text-[9px] font-bold text-error bg-rose-100 px-1 py-0.2 rounded">
                        {item.alert}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
