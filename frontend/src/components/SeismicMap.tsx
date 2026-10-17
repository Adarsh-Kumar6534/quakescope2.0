import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Globe, Layers, Compass } from 'lucide-react';
import type { StrongestEvent, TopRegion } from '../types/seismic';
import { REGIONAL_CENTROIDS } from '../services/dataLoader';

interface SeismicMapProps {
  strongestEvents: StrongestEvent[];
  topRegions: TopRegion[];
}

// Sub-component to programmatically change map view smoothly
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const SeismicMap: React.FC<SeismicMapProps> = ({
  strongestEvents,
  topRegions,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 10]);
  const [mapZoom, setMapZoom] = useState<number>(2);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showHotspotCentroids, setShowHotspotCentroids] = useState<boolean>(true);

  // Filter events that contain valid coordinates
  const validEvents = strongestEvents.filter(
    (e) => typeof e.latitude === 'number' && typeof e.longitude === 'number'
  );

  const getMarkerColor = (mag: number) => {
    if (mag >= 8.5) return '#f43f5e'; // Rose-red (M8.8 Kamchatka)
    if (mag >= 7.7) return '#f97316'; // Orange (M7.7-7.8)
    if (mag >= 7.5) return '#eab308'; // Amber (M7.5-7.6)
    return '#38bdf8'; // Cyan (M7.4)
  };

  const handleFlyToRegion = (regionName: string) => {
    const coords = REGIONAL_CENTROIDS[regionName];
    if (coords) {
      setMapCenter([coords.lat, coords.lng]);
      setMapZoom(4);
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Header with Provenance Notice */}
      <div className="glass-panel-chart p-5 lg:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 font-mono">
                Geographic Inquiry
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight mt-0.5">
              Which regions have the highest represented event counts?
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing the top high-impact earthquake hypocenters (M ≥ 7.4) and regional tectonic subduction belts
            </p>
          </div>

          {/* Map Controls */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setShowHotspotCentroids(!showHotspotCentroids)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center space-x-1.5 ${
                showHotspotCentroids
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-800/60 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showHotspotCentroids ? 'Hotspots Active' : 'Hotspots Hidden'}</span>
            </button>
            <button
              onClick={() => {
                setMapCenter([20, 10]);
                setMapZoom(2);
                setSelectedEventId(null);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium glass-pill text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
            >
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset View</span>
            </button>
          </div>
        </div>

        {/* Provenance & Subset Disclosure Banner */}
        <div className="my-3 p-3.5 rounded-xl glass-sub-card border-cyan-500/30 flex items-start space-x-2.5 text-xs text-slate-300">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-cyan-300">Data Integrity Notice:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                10 Strongest Events Plotted
              </span>
            </div>
            <p className="leading-relaxed">
              The cartographic layer displays the <strong className="text-white">10 strongest recorded seismic events (M ≥ 7.4)</strong> whose coordinates are verified from Spark SQL Query 3 (<code className="text-cyan-300 font-mono">output/quakescope_execution.log</code> Metric 12). In strict adherence to Stage 2 data integrity rules, the full set of 19,688 earthquakes is not plotted as points without individual coordinate exports; instead, global seismicity is represented through verified regional frequency statistics below.
            </p>
            <p className="text-[11px] text-slate-400 pt-0.5">
              Cartography streams from Esri World Dark Gray Base (free, no API key required, public academic access).
            </p>
          </div>
        </div>

        {/* Map Canvas and Regional Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          {/* Main Leaflet Map Container */}
          <div className="lg:col-span-3 h-[500px] rounded-xl overflow-hidden border border-white/12 relative shadow-2xl">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={false}
              className="w-full h-full"
              attributionControl={true}
            >
              <ChangeView center={mapCenter} zoom={mapZoom} />

              {/* Esri World Dark Gray Basemap (No API key, zero watermarks) */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                maxZoom={16}
              />
              {/* Esri World Dark Gray Reference Labels */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                attribution=''
                maxZoom={16}
              />

              {/* Plot Regional Hotspots Centroids if enabled */}
              {showHotspotCentroids &&
                topRegions.slice(0, 10).map((r) => {
                  const centroid = REGIONAL_CENTROIDS[r.region];
                  if (!centroid) return null;
                  return (
                    <CircleMarker
                      key={`region-${r.region}`}
                      center={[centroid.lat, centroid.lng]}
                      radius={12 + Math.min(r.event_count / 300, 16)}
                      pathOptions={{
                        color: 'rgba(56, 189, 248, 0.5)',
                        fillColor: '#38bdf8',
                        fillOpacity: 0.15,
                        weight: 1.5,
                        dashArray: '4, 4',
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1">
                          <p className="font-bold text-cyan-300 text-xs">{r.region} Hotspot</p>
                          <p className="text-[11px] text-slate-300">
                            <strong>{r.event_count.toLocaleString()}</strong> events ({r.pct_of_global}% of global)
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Avg Mag: {r.avg_mag} · Max Mag: {r.max_mag} · Avg Depth: {r.avg_depth_km} km
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

              {/* Plot 10 Strongest Earthquakes */}
              {validEvents.map((event) => {
                const color = getMarkerColor(event.mag);
                const isSelected = selectedEventId === event.id;
                const radius = event.mag >= 8.5 ? 18 : event.mag >= 7.7 ? 14 : 11;

                return (
                  <CircleMarker
                    key={event.id}
                    center={[event.latitude!, event.longitude!]}
                    radius={radius}
                    pathOptions={{
                      color: isSelected ? '#ffffff' : color,
                      fillColor: color,
                      fillOpacity: 0.75,
                      weight: isSelected ? 3 : 1.5,
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 max-w-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1">
                          <span className="font-mono text-[10px] text-slate-400">{event.id}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: color }}
                          >
                            M {event.mag.toFixed(1)} {event.magType}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-white leading-tight">
                          {event.place}
                        </p>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                          <div>
                            <span className="text-slate-400">Date:</span> {event.event_date}
                          </div>
                          <div>
                            <span className="text-slate-400">Depth:</span> {event.depth.toFixed(1)} km
                          </div>
                          <div className="col-span-2 font-mono text-[9px] text-cyan-300">
                            Lat: {event.latitude?.toFixed(4)}, Lon: {event.longitude?.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Overlay Floating Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-xl glass-panel-elevated text-[10px] space-y-1.5 text-slate-300 shadow-2xl pointer-events-auto">
              <span className="font-bold text-white block border-b border-white/10 pb-1">
                Magnitude Classification
              </span>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                <span>Mw 8.5+ (Kamchatka M8.8)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                <span>Mw 7.7 - 8.4 (Major)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                <span>Mw 7.4 - 7.6 (Strong)</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-white/10">
                <span className="w-3 h-3 rounded-full border border-dashed border-cyan-400 inline-block" />
                <span>Regional Hotspot Belt</span>
              </div>
            </div>
          </div>

          {/* Regional Ranking Sidebar - Signature Liquid Glass Material */}
          <div className="h-[500px] liquid-glass-card p-5 flex flex-col justify-between overflow-hidden relative group">
            {/* Chromatic backlight flare */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none -z-10" />

            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <h4 className="text-xs font-semibold text-white tracking-wide uppercase">
                  Top Seismotectonic Belts
                </h4>
                <span className="text-[10px] text-slate-300 font-mono">19,688 Quakes</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 mb-2.5">
                Click any region to center the map on its focal zone
              </p>

              <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                {topRegions.slice(0, 10).map((r, idx) => (
                  <button
                    key={r.region}
                    onClick={() => handleFlyToRegion(r.region)}
                    className="w-full text-left p-2.5 rounded-xl liquid-glass-pill hover:border-cyan-300/60 transition-all duration-150 cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono text-cyan-300 font-bold">#{idx + 1}</span>
                        <span className="text-xs font-medium text-slate-100 group-hover:text-cyan-200">
                          {r.region}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-300">
                        Avg: {r.avg_mag} Mw · Depth: {r.avg_depth_km} km
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white block">
                        {r.event_count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        {r.pct_of_global}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 text-[10px] text-slate-400 text-center">
              Source: Apache Spark SQL Top Regions Grouping
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
