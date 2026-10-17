import React, { useState, useId } from 'react';
import type { MonthlyTrend } from '../types/seismic';
import {
  Activity,
  Calendar,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Clock,
  Flame,
} from 'lucide-react';

interface SeismicPulseProps {
  monthlyTrends: MonthlyTrend[];
  totalCleanedEvents?: number;
}

export const SeismicPulse: React.FC<SeismicPulseProps> = ({
  monthlyTrends,
  totalCleanedEvents = 19688,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const pulseContainerId = useId();

  // Find selected record or null for overview
  const selectedRecord = monthlyTrends.find((m) => m.year_month === selectedMonth) || null;

  // Max event count for height normalization (2,838 in July 2025)
  const maxEventCount = Math.max(...monthlyTrends.map((m) => m.event_count));

  // Handle keyboard navigation across the 13 intervals
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = selectedMonth
      ? monthlyTrends.findIndex((m) => m.year_month === selectedMonth)
      : -1;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = currentIndex < monthlyTrends.length - 1 ? currentIndex + 1 : 0;
      setSelectedMonth(monthlyTrends[nextIndex].year_month);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : monthlyTrends.length - 1;
      setSelectedMonth(monthlyTrends[prevIndex].year_month);
    } else if (e.key === 'Escape' || e.key === 'Home') {
      e.preventDefault();
      setSelectedMonth(null);
    }
  };

  const getMonthLabel = (ym: string) => {
    const [year, month] = ym.split('-');
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
  };

  const getFullMonthName = (ym: string) => {
    const [year, month] = ym.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  return (
    <section
      aria-labelledby="seismic-pulse-heading"
      className="glass-hero p-5 sm:p-7 relative overflow-hidden transition-all duration-300"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Interactive Seismic Pulse Timeline"
    >
      {/* Subtle organic light glow in background of hero */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </span>
            <div className="flex items-center space-x-2">
              <h2
                id="seismic-pulse-heading"
                className="text-base sm:text-lg font-bold text-white tracking-tight"
              >
                Seismic Pulse
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300">
                Observatory Timeline
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Temporal frequency dynamics across 13 verified observation intervals. Scrub or click an
            interval to inspect localized event volumes, energy magnitudes, and focal depths.
          </p>
        </div>

        {/* Action Controls & Overview Reset */}
        <div className="flex items-center space-x-3 shrink-0">
          {selectedMonth ? (
            <button
              onClick={() => setSelectedMonth(null)}
              className="px-3 py-1.5 rounded-lg glass-pill text-xs font-medium text-slate-200 hover:text-white flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Reset to full catalog overview (Esc)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Overview</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-300 flex items-center space-x-1.5 font-mono px-3 py-1.5 rounded-lg glass-sub-card">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>13 Time Intervals (19,688 Events)</span>
            </div>
          )}
        </div>
      </div>

      {/* The Pulse Waveform & Interactive Timeline Scrubber */}
      <div className="relative z-10 mt-6 mb-4">
        {/* Timeline Annotation Markers */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-1">
          <span className="flex items-center space-x-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>2025-01-01</span>
          </span>
          <span className="text-rose-400 font-semibold flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Peak: July 2025 (2,838 Quakes)</span>
          </span>
          <span className="text-amber-400 font-medium">
            2026-01-01 (Jan 1 Endpoint)
          </span>
        </div>

        {/* Interactive Pulse Column Grid */}
        <div
          id={pulseContainerId}
          className="grid grid-cols-13 gap-1.5 sm:gap-2 h-44 sm:h-48 items-end p-3 rounded-2xl glass-sub-card relative"
        >
          {/* Subtle horizontal guideline at baseline average (~1400 quakes) */}
          <div
            className="absolute left-3 right-3 border-b border-dashed border-cyan-400/20 pointer-events-none flex justify-end"
            style={{ bottom: `${(1450 / maxEventCount) * 100 * 0.75 + 15}%` }}
          >
            <span className="text-[9px] font-mono text-cyan-400/60 px-1 bg-black/40 rounded -translate-y-2">
              Baseline ~1,450
            </span>
          </div>

          {monthlyTrends.map((record) => {
            const isSelected = selectedMonth === record.year_month;
            const isJulySurge = record.year_month === '2025-07';
            const isAugDecay = record.year_month === '2025-08';
            const isEndpoint = record.year_month === '2026-01';

            // Calculate height percentage normalized against max count (min 15% for visibility)
            const heightPct = Math.max(
              12,
              Math.round((record.event_count / maxEventCount) * 85)
            );

            // Dynamic color grading based on event volume and sequence character
            let barGradient = 'from-cyan-500/50 via-cyan-400/80 to-blue-500';
            let barBorder = 'border-cyan-400/40';
            let glowColor = 'shadow-[0_0_12px_rgba(56,189,248,0.25)]';

            if (isJulySurge) {
              barGradient = 'from-rose-500/70 via-rose-400 to-amber-400';
              barBorder = 'border-rose-400/70';
              glowColor = 'shadow-[0_0_20px_rgba(244,63,94,0.45)]';
            } else if (isAugDecay) {
              barGradient = 'from-indigo-500/60 via-violet-400 to-cyan-400';
              barBorder = 'border-violet-400/50';
              glowColor = 'shadow-[0_0_14px_rgba(168,85,247,0.3)]';
            } else if (isEndpoint) {
              barGradient = 'from-amber-500/40 to-amber-300';
              barBorder = 'border-amber-400/40';
              glowColor = 'shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            }

            return (
              <button
                key={record.year_month}
                onClick={() => setSelectedMonth(record.year_month)}
                className={`group relative flex flex-col items-center justify-end h-full w-full rounded-xl transition-all duration-200 cursor-pointer focus:outline-none ${
                  isSelected ? 'scale-105 z-20' : 'hover:scale-102 hover:z-10'
                }`}
                aria-label={`${getFullMonthName(record.year_month)}: ${record.event_count} events, max magnitude ${record.max_mag}`}
                aria-pressed={isSelected}
              >
                {/* Active Indicator beacon above bar */}
                {isSelected && (
                  <div className="absolute -top-3 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-bounce" />
                )}

                {/* Special Surge Indicator Icon */}
                {isJulySurge && !isSelected && (
                  <div className="absolute -top-2.5 text-rose-400 animate-pulse">
                    <Flame className="w-3 h-3" />
                  </div>
                )}

                {/* The Graphic Pulse Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 relative overflow-hidden border-t border-x ${barBorder} ${
                    isSelected
                      ? `bg-gradient-to-t ${barGradient} ring-2 ring-cyan-300/80 ${glowColor}`
                      : `bg-gradient-to-t ${barGradient} opacity-70 group-hover:opacity-100 group-hover:${glowColor}`
                  }`}
                  style={{ height: `${heightPct}%` }}
                >
                  {/* Internal specular highlight reflection */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />

                  {/* Magnitude indicator bar inside the pulse column */}
                  <div
                    className="absolute bottom-0 inset-x-0 bg-white/10 border-t border-white/20 text-[9px] font-mono text-center text-white/90 truncate hidden sm:block"
                    style={{ height: `${Math.min(100, (record.max_mag / 9.0) * 100)}%` }}
                  />
                </div>

                {/* Label beneath column */}
                <div className="mt-2 text-center w-full">
                  <span
                    className={`text-[10px] block font-mono transition-colors ${
                      isSelected
                        ? 'text-cyan-300 font-bold'
                        : isJulySurge
                        ? 'text-rose-400 font-semibold'
                        : isEndpoint
                        ? 'text-amber-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {getMonthLabel(record.year_month)}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono hidden lg:block">
                    {record.event_count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Linked Live Observatory Inspector Panel */}
      <div className="relative z-10 mt-5 p-4 sm:p-5 rounded-2xl glass-card">
        {selectedRecord ? (
          <div className="space-y-4">
            {/* Inspector Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  {getFullMonthName(selectedRecord.year_month)}
                </h3>
                <span className="text-xs font-mono text-slate-300 px-2 py-0.5 rounded glass-sub-card">
                  {selectedRecord.period_note}
                </span>
              </div>
              <div className="text-xs text-cyan-300 font-mono">
                Verified Interval Metric
              </div>
            </div>

            {/* Metrics Matrix for Selected Month */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Event Volume */}
              <div className="p-3 rounded-xl glass-sub-card">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Earthquake Volume
                </span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {selectedRecord.event_count.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400">quakes</span>
                </div>
                <div className="text-[10px] text-cyan-400 mt-1 font-mono">
                  {((selectedRecord.event_count / totalCleanedEvents) * 100).toFixed(2)}% of 2025–26 catalog
                </div>
              </div>

              {/* Peak Magnitude */}
              <div className="p-3 rounded-xl glass-sub-card">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Peak Energy (Max Mag)
                </span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span
                    className={`text-xl sm:text-2xl font-bold font-mono ${
                      selectedRecord.max_mag >= 8.0
                        ? 'text-rose-400'
                        : selectedRecord.max_mag >= 7.0
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    Mw {selectedRecord.max_mag.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-400">scale</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {selectedRecord.max_mag >= 8.0
                    ? 'Great Megathrust Event'
                    : selectedRecord.max_mag >= 7.0
                    ? 'Major Subduction Shock'
                    : 'Strong Regional Event'}
                </div>
              </div>

              {/* Mean Magnitude */}
              <div className="p-3 rounded-xl glass-sub-card">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Mean Interval Magnitude
                </span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {selectedRecord.avg_mag.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400">Mw avg</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Catalog Mean: 4.46 Mw
                </div>
              </div>

              {/* Mean Hypocenter Depth */}
              <div className="p-3 rounded-xl glass-sub-card">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Average Focal Depth
                </span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {selectedRecord.avg_depth_km.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-slate-400">km</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {selectedRecord.avg_depth_km < 70
                    ? 'Predominantly Crustal Shallow'
                    : 'Wadati-Benioff Influence'}
                </div>
              </div>
            </div>

            {/* Contextual Scientific Interpretation Note */}
            <div className="p-3.5 rounded-xl glass-sub-card text-xs text-slate-300 flex items-start space-x-2.5">
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  selectedRecord.year_month === '2025-07'
                    ? 'text-rose-400'
                    : selectedRecord.year_month === '2026-01'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              />
              <div className="leading-relaxed">
                {selectedRecord.year_month === '2025-07' && (
                  <span>
                    <strong className="text-rose-300 font-semibold">
                      Sequence Interpretation (July 2025 Surge):
                    </strong>{' '}
                    The catalog-maximum surge to 2,838 events (+95% over baseline) correlates with the
                    rupture of the Mw 8.80 Kamchatka Megathrust (2025-07-29 23:24 UTC) and its immediate
                    aftershock sequence. As noted in seismological best practices, while spatial and
                    temporal clustering confirms this correlation, detailed fault slip modeling requires
                    waveform inversion data outside of this single-source tabular catalog.
                  </span>
                )}
                {selectedRecord.year_month === '2025-08' && (
                  <span>
                    <strong className="text-violet-300 font-semibold">
                      Omori Law Sequence Relaxation (August 2025):
                    </strong>{' '}
                    Elevated seismicity (2,329 events) continues the aftershock decay following the
                    Kamchatka megathrust, with average focal depth remaining shallow (54.6 km) across the
                    plate boundary.
                  </span>
                )}
                {selectedRecord.year_month === '2026-01' && (
                  <span>
                    <strong className="text-amber-300 font-semibold">
                      Temporal Dataset Boundary Note (January 2026):
                    </strong>{' '}
                    This interval contains exactly 51 events recorded on January 1, 2026 (00:00 to 23:59
                    UTC) prior to the dataset snapshot termination. It is a single-day endpoint, not a full
                    calendar month, and should not be misinterpreted as a collapse in tectonic activity.
                  </span>
                )}
                {selectedRecord.year_month !== '2025-07' &&
                  selectedRecord.year_month !== '2025-08' &&
                  selectedRecord.year_month !== '2026-01' && (
                    <span>
                      <strong className="text-cyan-300 font-semibold">
                        Baseline Tectonic Regime:
                      </strong>{' '}
                      Event count of {selectedRecord.event_count.toLocaleString()} aligns with the steady-state
                      global monitoring rate of ~1,300 to ~1,550 earthquakes per month for magnitudes ≥ 3.5.
                      Average depth of {selectedRecord.avg_depth_km.toFixed(1)} km reflects global plate
                      convergence and subduction zones.
                    </span>
                  )}
              </div>
            </div>
          </div>
        ) : (
          /* Cumulative Observatory Overview Mode */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Observatory Overview · Full Year Cycle (2025-01 to 2026-01)
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                The global seismic pattern demonstrates steady background tectonic activity punctuated
                by the prominent July 2025 megathrust surge. Click any month on the timeline above to
                isolate interval metrics.
              </p>
            </div>

            <div className="flex items-center space-x-4 shrink-0 text-xs font-mono">
              <div className="p-2.5 rounded-xl glass-sub-card text-center min-w-24">
                <span className="text-[10px] text-slate-400 block font-sans">Total Cleaned</span>
                <span className="text-base font-bold text-white">19,688</span>
              </div>
              <div className="p-2.5 rounded-xl glass-sub-card text-center min-w-24">
                <span className="text-[10px] text-slate-400 block font-sans">Monthly Mean</span>
                <span className="text-base font-bold text-cyan-300">~1,514</span>
              </div>
              <div className="p-2.5 rounded-xl glass-sub-card text-center min-w-24">
                <span className="text-[10px] text-slate-400 block font-sans">Catalog Peak</span>
                <span className="text-base font-bold text-rose-400">Mw 8.80</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
