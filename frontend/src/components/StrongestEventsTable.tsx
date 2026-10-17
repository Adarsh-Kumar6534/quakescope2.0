import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  ArrowUpDown,
  Download,
  ChevronRight,
  X,
  MapPin,
} from 'lucide-react';
import type { StrongestEvent } from '../types/seismic';

interface StrongestEventsTableProps {
  events: StrongestEvent[];
  onSelectEventOnMap?: (event: StrongestEvent) => void;
}

type SortField = 'mag' | 'depth' | 'event_date';
type SortOrder = 'asc' | 'desc';

export const StrongestEventsTable: React.FC<StrongestEventsTableProps> = ({
  events,
  onSelectEventOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('mag');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [inspectEvent, setInspectEvent] = useState<StrongestEvent | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedEvents = useMemo(() => {
    return events
      .filter((e) => {
        const query = searchTerm.toLowerCase();
        return (
          e.place.toLowerCase().includes(query) ||
          e.region.toLowerCase().includes(query) ||
          e.id.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'event_date') {
          valA = new Date(a.time).getTime();
          valB = new Date(b.time).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [events, searchTerm, sortField, sortOrder]);

  const getMagBadge = (mag: number) => {
    if (mag >= 8.5) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center space-x-1 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>{mag.toFixed(1)} Mw</span>
        </span>
      );
    }
    if (mag >= 7.6) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/35">
          {mag.toFixed(1)} Mw
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
        {mag.toFixed(1)} Mw
      </span>
    );
  };

  return (
    <div className="liquid-glass-card p-6 lg:p-8 space-y-4 relative overflow-hidden group">
      {/* Environmental chromatic backlight */}
      <div className="absolute -top-12 left-1/3 w-[450px] h-48 bg-rose-500/35 dark:bg-rose-500/20 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/15 gap-3">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-rose-500/20 dark:bg-rose-500/25 border border-rose-500/40 text-rose-800 dark:text-rose-300 shadow-sm">
            <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-black tracking-wider uppercase font-mono">
              Energy Inquiry
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-2">
            Which recorded events have the largest magnitudes?
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-100 mt-0.5 font-medium">
            Ranked catalog subset of highest-energy seismic ruptures with hypocenter depth, moment magnitude, and spatial coordinates
          </p>
        </div>

        {/* Search & Export Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search region, place, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              className="glass-input py-2 text-xs w-52 sm:w-64 placeholder:text-slate-500 dark:placeholder:text-slate-400/80 rounded-xl focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Assets Buttons */}
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/strongest_events.csv`}
            download="strongest_events.csv"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 dark:bg-white/10 border border-rose-500/40 dark:border-white/20 text-rose-800 dark:text-rose-200 hover:bg-rose-500/25 font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Download Stage 1 Strongest Events CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </a>
          <a
            href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/strongest_events.json`}
            download="strongest_events.json"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 dark:bg-white/10 border border-rose-500/40 dark:border-white/20 text-rose-800 dark:text-rose-200 hover:bg-rose-500/25 font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Download Stage 1 Strongest Events JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </a>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/20 shadow-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white text-black font-extrabold border-b-2 border-slate-300 text-xs shadow-sm">
              <th className="py-3.5 px-4 text-black font-extrabold uppercase tracking-wider text-[11px]">#</th>
              <th className="py-3.5 px-4 font-mono text-black font-extrabold uppercase tracking-wider text-[11px]">Event ID</th>
              <th
                onClick={() => handleSort('mag')}
                className="py-3.5 px-4 cursor-pointer text-black hover:text-slate-800 font-extrabold uppercase tracking-wider text-[11px] transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Magnitude</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                </div>
              </th>
              <th
                onClick={() => handleSort('depth')}
                className="py-3.5 px-4 cursor-pointer text-black hover:text-slate-800 font-extrabold uppercase tracking-wider text-[11px] transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Depth</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                </div>
              </th>
              <th
                onClick={() => handleSort('event_date')}
                className="py-3.5 px-4 cursor-pointer text-black hover:text-slate-800 font-extrabold uppercase tracking-wider text-[11px] transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Date & UTC Time</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-black" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-black font-extrabold uppercase tracking-wider text-[11px]">Region</th>
              <th className="py-3.5 px-4 text-black font-extrabold uppercase tracking-wider text-[11px]">Exact Place</th>
              <th className="py-3.5 px-4 text-right text-black font-extrabold uppercase tracking-wider text-[11px]">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredAndSortedEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-300">
                  No seismic events matching &quot;{searchTerm}&quot; found in the top catalog subset.
                </td>
              </tr>
            ) : (
              filteredAndSortedEvents.map((event, index) => {
                const isSelected = inspectEvent?.id === event.id;
                return (
                  <tr
                    key={event.id}
                    onClick={() => setInspectEvent(event)}
                    className={`hover:bg-white/10 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/15' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 font-mono text-slate-200 font-medium">#{index + 1}</td>
                    <td className="py-3 px-3.5 font-mono text-cyan-300 font-bold">
                      {event.id}
                    </td>
                    <td className="py-3 px-3.5">{getMagBadge(event.mag)}</td>
                    <td className="py-3 px-3.5 font-mono text-white font-medium">
                      {event.depth.toFixed(1)} km
                    </td>
                    <td className="py-3 px-3.5 text-slate-100 font-mono font-medium">
                      {event.time.replace('.000', '')}
                    </td>
                    <td className="py-3 px-3.5 text-white font-semibold">{event.region}</td>
                    <td className="py-3 px-3.5 text-slate-100 font-medium max-w-xs truncate" title={event.place}>
                      {event.place}
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectEvent(event);
                        }}
                        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="View Full Record"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Inspection Modal / Elevated Glass Surface */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl glass-panel-elevated p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h4 className="text-base font-bold text-white">
                  Seismic Event Record Inspection
                </h4>
              </div>
              <button
                onClick={() => setInspectEvent(null)}
                className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl glass-sub-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">USGS Identifier</span>
                  <span className="font-mono text-cyan-400 font-bold">{inspectEvent.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recorded Magnitude</span>
                  <span className="font-bold text-white text-sm">
                    {inspectEvent.mag} ({inspectEvent.magType.toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hypocenter Depth</span>
                  <span className="font-mono text-white">{inspectEvent.depth} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timestamp (UTC)</span>
                  <span className="font-mono text-white">{inspectEvent.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Primary Region</span>
                  <span className="font-medium text-slate-200">{inspectEvent.region}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Place Description</span>
                <p className="p-3 rounded-lg glass-sub-card text-slate-200 font-medium">
                  {inspectEvent.place}
                </p>
              </div>

              {inspectEvent.latitude && inspectEvent.longitude && (
                <div className="p-3 rounded-lg glass-sub-card border-cyan-500/30 text-slate-300">
                  <span className="text-cyan-400 font-semibold block mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Spark Log Hypocenter Coordinates (Metric 12)</span>
                  </span>
                  <div className="font-mono text-xs text-white">
                    Latitude: {inspectEvent.latitude}° · Longitude: {inspectEvent.longitude}°
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              {onSelectEventOnMap && (
                <button
                  onClick={() => {
                    onSelectEventOnMap(inspectEvent);
                    setInspectEvent(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg btn-glass-primary text-cyan-300 text-xs font-medium cursor-pointer"
                >
                  Locate on Map
                </button>
              )}
              <button
                onClick={() => setInspectEvent(null)}
                className="px-4 py-2 rounded-lg glass-pill text-xs text-slate-200 font-medium transition-colors cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
