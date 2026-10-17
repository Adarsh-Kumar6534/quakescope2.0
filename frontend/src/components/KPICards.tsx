import React from 'react';
import {
  Activity,
  Flame,
  AlertTriangle,
  BrainCircuit,
} from 'lucide-react';
import type { OverallKPIs, MLlibMetrics, MagnitudeDistribution, MonthlyTrend } from '../types/seismic';

interface KPICardsProps {
  kpis: OverallKPIs;
  mllib: MLlibMetrics;
  magDistribution: MagnitudeDistribution[];
  monthlyTrends?: MonthlyTrend[];
  onOpenAudit?: () => void;
  onSelectEvent?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  kpis,
  mllib,
  magDistribution,
  monthlyTrends = [],
  onOpenAudit,
  onSelectEvent,
}) => {
  // Compute Magnitude 6.0+ count from real exported magnitude distribution
  const strongCount = magDistribution.find((m) => m.category.includes('Strong'))?.count || 130;
  const majorCount = magDistribution.find((m) => m.category.includes('Major'))?.count || 16;
  const mag6PlusTotal = strongCount + majorCount; // 146

  // Generate SVG path points for real monthly event counts if available
  const sparklineData = monthlyTrends.length > 0
    ? monthlyTrends.map((m) => m.event_count)
    : [1504, 1486, 1341, 1420, 1339, 1267, 2838, 2329, 1709, 1579, 1393, 1432, 51];

  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 160;
  const height = 44;

  const points = sparklineData.map((val, idx) => {
    const x = (idx / (sparklineData.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const sparklinePath = `M ${points.join(' L ')}`;
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width},${height} L 0,${height} Z`;

  return (
    <section aria-label="Key Seismic Observatory Metrics" className="w-full space-y-4">
      {/* Editorial Row 1: Two Prominent Primary Anchors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
        {/* Environmental chromatic backlight to illuminate the liquid glass cards */}
        <div className="absolute -top-10 left-4 w-[480px] h-56 bg-cyan-400/25 rounded-full blur-[80px] pointer-events-none -z-10" />
        <div className="absolute -top-10 right-4 w-[400px] h-56 bg-rose-500/25 rounded-full blur-[80px] pointer-events-none -z-10" />

        {/* Anchor 1: Cleaned Seismic Events with Real Sparkline (7 cols on lg) */}
        <div className="lg:col-span-7 liquid-glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle top specular shimmer */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-200 tracking-wide uppercase">
                <span className="p-1.5 rounded-xl liquid-glass-pill text-cyan-200 inline-flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5" />
                </span>
                <span className="tracking-wider">Verified Seismic Catalog</span>
              </div>
              <h3 className="text-sm text-slate-200 mt-2 font-medium">
                Cleaned Earthquake Records
              </h3>
              <div className="flex items-baseline space-x-2.5 mt-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono drop-shadow-sm">
                  {kpis.total_events.toLocaleString()}
                </span>
                <span className="text-xs text-slate-300 font-sans">
                  events (M3.5 – 8.8)
                </span>
              </div>
            </div>

            {/* Sparkline of actual monthly frequencies */}
            <div className="sm:self-end flex flex-col items-start sm:items-end">
              <span className="text-[10px] font-mono text-slate-200 mb-1.5 px-2 py-0.5 rounded-lg liquid-glass-pill flex items-center space-x-1.5">
                <span>13-Month Trend</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
              </span>
              <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#sparkGradient)" />
                <path
                  d={sparklinePath}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Highlight peak in July (index 6) */}
                <circle
                  cx={((6 / (sparklineData.length - 1)) * width).toFixed(1)}
                  cy={(height - ((2838 - minVal) / range) * (height - 8) - 4).toFixed(1)}
                  r="3.5"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>

          {/* Footer note: Audit reconciliation equation */}
          <div className="pt-3 mt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
            <span className="font-mono text-[11px] text-slate-200">
              19,705 raw rows − 17 excluded (1 depth &lt; 0 km, 16 non-earthquakes)
            </span>
            {onOpenAudit && (
              <button
                onClick={onOpenAudit}
                className="liquid-glass-pill px-3 py-1 text-cyan-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
              >
                Inspect Audit Formula →
              </button>
            )}
          </div>
        </div>

        {/* Anchor 2: Record Megathrust Event (5 cols on lg) */}
        <div className="lg:col-span-5 liquid-glass-card p-6 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle top specular shimmer with rose tint */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/60 to-transparent pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-rose-200 tracking-wide uppercase">
                <span className="p-1.5 rounded-xl liquid-glass-pill text-rose-300 inline-flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5" />
                </span>
                <span className="tracking-wider">Peak Catalog Energy</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full liquid-glass-pill text-rose-200 font-bold">
                Great Quake
              </span>
            </div>

            <div className="flex items-baseline space-x-2.5 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono text-rose-50 drop-shadow-sm">
                Mw {kpis.max_magnitude.toFixed(2)}
              </span>
              <span className="text-xs text-rose-200/90 font-sans">
                Moment Magnitude (Mww)
              </span>
            </div>

            <h4 className="text-sm font-semibold text-white mt-2">
              2025 Kamchatka Megathrust
            </h4>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
              Pacific-Okhotsk subduction plate boundary · Hypocenter 35.0 km depth.
            </p>
          </div>

          {/* Footer note: Timestamp & Action */}
          <div className="pt-3 mt-4 border-t border-white/20 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono text-[11px] text-slate-200">2025-07-29 23:24:52 UTC</span>
            {onSelectEvent && (
              <button
                onClick={onSelectEvent}
                className="liquid-glass-pill px-3 py-1 text-rose-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
              >
                View on Map →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editorial Row 2: Four Refined Secondary Analytical Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Global Mean Magnitude */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-300">Mean Magnitude</span>
              <span className="text-[10px] font-mono text-cyan-300">Gutenberg-Richter</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {kpis.avg_magnitude.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono">Mw</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Std Dev ±{kpis.stddev_magnitude.toFixed(2)} · Range 3.5 – 8.8
            </div>
          </div>
          <div className="pt-2.5 mt-3 border-t border-white/10 text-[11px] text-slate-400">
            Light (4.0–4.9) tier dominates 83.15% of records
          </div>
        </div>

        {/* Module 2: Hypocenter Focal Depth with Proportion Bar */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-300">Focal Depth Profile</span>
              <span className="text-[10px] font-mono text-violet-300">Max 669.6 km</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {kpis.avg_depth_km.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">km avg</span>
            </div>
            {/* Visual Depth Stratification Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-400"
                style={{ width: '75.2%' }}
                title="Shallow (0-70 km): 75.2%"
              />
              <div
                className="h-full bg-indigo-400"
                style={{ width: '19.1%' }}
                title="Intermediate (70-300 km): 19.1%"
              />
              <div
                className="h-full bg-purple-400"
                style={{ width: '5.7%' }}
                title="Deep (>300 km): 5.7%"
              />
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-[10px] font-mono text-slate-400">
            <span className="text-emerald-300">75% Crust</span>
            <span className="text-indigo-300">19% Benioff</span>
            <span className="text-purple-300">6% Mantle</span>
          </div>
        </div>

        {/* Module 3: M6.0+ High Impact Events */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-300">M6.0+ High-Impact</span>
              <span className="text-[10px] font-mono text-amber-300">0.74% of Catalog</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {mag6PlusTotal}
              </span>
              <span className="text-xs text-slate-400">quakes</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {strongCount} Strong (6.0–6.9) + {majorCount} Major (7.0+)
            </div>
          </div>
          <div className="pt-2.5 mt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center space-x-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Significant tsunamigenic & slip potential</span>
          </div>
        </div>

        {/* Module 4: Spark MLlib Classifier Performance */}
        <div className="glass-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium text-slate-300">Spark MLlib Classifier</span>
              <span className="text-[10px] font-mono text-emerald-300">DecisionTree</span>
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                {(mllib.evaluation_metrics.test_accuracy * 100).toFixed(2)}%
              </span>
              <span className="text-xs text-emerald-300 font-mono">+2.92%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Baseline {(mllib.evaluation_metrics.majority_baseline_accuracy * 100).toFixed(2)}% · F1 {mllib.evaluation_metrics.weighted_f1_score.toFixed(4)}
            </div>
          </div>
          <div className="pt-2.5 mt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center space-x-1.5">
            <BrainCircuit className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Tested on 3,827 spatial vectors</span>
          </div>
        </div>
      </div>
    </section>
  );
};
