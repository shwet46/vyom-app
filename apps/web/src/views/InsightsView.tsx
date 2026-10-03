import React from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  Sparkles,
  Store,
  TrendingUp,
  Calendar,
  AlertCircle,
  Users,
  Clock,
  ArrowRight,
} from '../components/icons';
import { Language } from '../types';
import { formatRupee } from '../utils/formatters';
import { cityFestivalProfiles, SupportedCity } from '../data/cityFestivals';

interface InsightsViewProps {
  lang: Language;
  city: SupportedCity;
  onNavigateToTab: (tab: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'more') => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ lang, city, onNavigateToTab }) => {
  const cityProfile = cityFestivalProfiles[city];
  const secondaryFestival = cityProfile.festivals[1];

  // Peak hours heatmap grid: 7 days × 6 slots
  const days = ['Som (Mon)', 'Mangal', 'Budh', 'Guru', 'Shukra', 'Shani', 'Ravi (Sun)'];
  const timeSlots = ['8–11 AM', '11–2 PM', '2–4 PM (Dead)', '4–6 PM', '6–8 PM (Peak)', '8–10 PM'];

  // Intensity matrix (0: dead, 1: low, 2: medium, 3: high, 4: super peak)
  const heatmapData = [
    [2, 3, 0, 2, 4, 3], // Mon
    [2, 2, 0, 2, 3, 3], // Tue
    [3, 3, 0, 2, 4, 3], // Wed
    [2, 2, 1, 2, 3, 2], // Thu
    [3, 3, 0, 3, 4, 4], // Fri
    [4, 4, 1, 4, 4, 4], // Sat
    [4, 4, 1, 3, 4, 3], // Sun
  ];

  const salesTrendData = [
    { day: 'Day 1', sales: 6800 },
    { day: 'Day 2', sales: 7100 },
    { day: 'Day 3', sales: 6900 },
    { day: 'Day 4', sales: 6200 },
    { day: 'Day 5', sales: 6050 },
    { day: 'Day 6', sales: 6850 },
    { day: 'Day 7', sales: 7420 },
  ];

  return (
    <div className="space-y-4 animate-fade-slide-up" style={{ paddingBottom: 8 }}>
      {/* 1. Profile Overview — Comic Sky Card */}
      <div className="comic-card-sky" style={{ padding: 14 }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid var(--outline)',
              boxShadow: '1px 1px 0px var(--shadow-color)',
              fontWeight: 800,
              fontSize: 16,
              color: '#1565C0',
            }}
          >
            SK
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2 }}>
                Sharma Kirana Store
              </h1>
              <span
                className="comic-badge"
                style={{ background: '#FFFFFF', color: '#1565C0', fontSize: 9 }}
              >
                {city}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#1565C0', marginTop: 2, fontWeight: 600 }}>
              Paytm POS Terminal #982344 • 480 Monthly Active Kirana Shoppers
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Store Metrics — 3 Comic Cards in Single Column or Clean Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="comic-card" style={{ padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Avg Ticket</div>
          <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
            {formatRupee(340)}
          </div>
          <div style={{ fontSize: 9, color: '#0E7A50', fontWeight: 700, marginTop: 2 }}>
            +₹32 vs city
          </div>
        </div>

        <div className="comic-card" style={{ padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Repeat Grahak</div>
          <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 800, color: 'var(--ai-text)', marginTop: 2 }}>
            68%
          </div>
          <div style={{ fontSize: 9, color: 'var(--ai-text)', fontWeight: 700, marginTop: 2 }}>
            High loyalty
          </div>
        </div>

        <div className="comic-card-coral" style={{ padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#C62828', fontWeight: 700 }}>Dead Hours</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#C62828', marginTop: 2 }}>
            2–4 PM
          </div>
          <div style={{ fontSize: 9, color: '#C62828', fontWeight: 700, marginTop: 2 }}>
            -82% footfall
          </div>
        </div>
      </div>

      {/* 3. 7-Day Sales Trend Line Chart */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
              7-Day Sales Trend & Churn Signal
            </h3>
            <p style={{ fontSize: 11, color: '#6B7280' }}>
              Vyom detected dip on Day 4–5 and triggered win-back
            </p>
          </div>
        </div>

        <div style={{ height: 140, width: '100%', marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--shadow-color)', fontWeight: 600 }} axisLine={{ stroke: 'var(--shadow-color)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [formatRupee(Number(val)), 'Sales']}
                contentStyle={{
                  backgroundColor: 'var(--ink)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '11px',
                  border: '1px solid var(--outline)',
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--ai-text)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--ai-text)', r: 4, stroke: 'var(--shadow-color)', strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          className="comic-card-mint flex items-center gap-2 mt-2"
          style={{ padding: '8px 10px', borderRadius: 10 }}
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0E7A50' }} />
          <span style={{ fontSize: 11, color: '#0E7A50', fontWeight: 600 }}>
            Win-back offer launch hone ke baad Day 7 tak bikri ₹7,420 wapas pahunch gayi!
          </span>
        </div>
      </div>

      {/* 4. Local Signals — Comic Card */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
              {cityProfile.localSignalTitle}
            </h3>
          </div>
          <span className="comic-badge" style={{ background: '#C7E8FF', color: '#1565C0', fontSize: 9 }}>
            Auto-detected
          </span>
        </div>

        <div className="space-y-2">
          <div
            onClick={() => onNavigateToTab('opportunities')}
            className="flex items-center justify-between gap-2 cursor-pointer"
            style={{
              padding: '10px 12px',
              background: 'var(--canvas)',
              border: '1.5px solid var(--shadow-color)',
              borderRadius: 12,
              boxShadow: '1px 1px 0px var(--shadow-color)',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
                🌙 {cityProfile.primaryFestival} ({cityProfile.primaryDaysToStart} Din Baki)
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {cityProfile.primaryDemand}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ink)' }} />
          </div>

          <div
            onClick={() => onNavigateToTab('opportunities')}
            className="flex items-center justify-between gap-2 cursor-pointer"
            style={{
              padding: '10px 12px',
              background: 'var(--canvas)',
              border: '1.5px solid var(--shadow-color)',
              borderRadius: 12,
              boxShadow: '1px 1px 0px var(--shadow-color)',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
                🌦️ {secondaryFestival.name}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {secondaryFestival.desc}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ink)' }} />
          </div>
        </div>
      </div>

      {/* 5. Dukaan Footfall Heatmap (Compact single column) */}
      <div className="comic-card" style={{ padding: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" style={{ color: 'var(--ai-text)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
              Footfall Heatmap (7 Days)
            </h3>
          </div>
          <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Paytm Soundbox Times</span>
        </div>

        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-center" style={{ color: '#6B7280', marginBottom: 2 }}>
            <div className="text-left">Day</div>
            {timeSlots.map((ts, idx) => (
              <div key={idx} className="truncate">
                {ts.split(' ')[0]}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {days.map((d, dIdx) => (
            <div key={dIdx} className="grid grid-cols-7 gap-1 items-center">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)' }} className="truncate">
                {d.split(' ')[0]}
              </div>
              {heatmapData[dIdx].map((intensity, sIdx) => {
                let bg = 'var(--canvas)';
                let color = '#6B7280';
                let label = 'Norm';
                if (intensity === 0) {
                  bg = '#FFC9C9';
                  color = '#C62828';
                  label = 'Dead';
                } else if (intensity >= 3) {
                  bg = '#BEF0D8';
                  color = '#0E7A50';
                  label = 'Peak';
                }

                return (
                  <div
                    key={sIdx}
                    className="flex items-center justify-center font-bold"
                    style={{
                      height: 22,
                      borderRadius: 6,
                      background: bg,
                      color: color,
                      fontSize: 8,
                      border: '1px solid var(--shadow-color)',
                    }}
                    title={`${d} at ${timeSlots[sIdx]}`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 mt-2" style={{ borderTop: '1.5px solid rgba(148,163,184,0.28)', fontSize: 10 }}>
          <div className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#FFC9C9', border: '1px solid var(--shadow-color)', display: 'inline-block' }} />
            <span style={{ color: '#C62828', fontWeight: 700 }}>Dead (2-4 PM)</span>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--canvas)', border: '1px solid var(--shadow-color)', display: 'inline-block' }} />
            <span style={{ color: '#6B7280', fontWeight: 600 }}>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#BEF0D8', border: '1px solid var(--shadow-color)', display: 'inline-block' }} />
            <span style={{ color: '#0E7A50', fontWeight: 700 }}>Peak (6-8 PM)</span>
          </div>
        </div>
      </div>

    </div>
  );
};
