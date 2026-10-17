import { useEffect, useState } from 'react';
import { loadDashboardData } from './services/dataLoader';
import type { DashboardDataset } from './types/seismic';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { SeismicPulse } from './components/SeismicPulse';
import { ActivityCharts } from './components/ActivityCharts';
import { SeismicMap } from './components/SeismicMap';
import { StrongestEventsTable } from './components/StrongestEventsTable';
import { MLInsights } from './components/MLInsights';
import { MethodologyModal } from './components/MethodologyModal';
import {
  Activity,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export function App() {
  const [data, setData] = useState<DashboardDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData()
      .then((loadedData) => {
        setData(loadedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to load static dashboard assets.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#090e1a] text-white">
        <div className="seismic-atmosphere" />
        <div className="relative z-10 flex flex-col items-center space-y-4 p-8 rounded-2xl glass-panel-elevated border border-white/15 max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.35)]">
            <Activity className="w-6 h-6 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Initializing QuakeScope</h2>
            <p className="text-xs text-slate-400 mt-1">
              Loading static Spark MLlib & seismic intelligence assets...
            </p>
          </div>
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-cyan-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#090e1a] text-white">
        <div className="seismic-atmosphere" />
        <div className="relative z-10 p-8 rounded-2xl glass-panel-elevated border border-rose-500/30 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Failed to Load Dashboard Data</h2>
            <p className="text-xs text-rose-300 mt-1 font-mono">{error}</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please ensure that all 13 exported Stage 1 JSON/CSV files exist in{' '}
            <code className="text-cyan-300 font-mono">public/data/</code>.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 mx-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/25 selection:text-white">
      {/* Background Atmosphere & Subtle Grid */}
      <div className="seismic-atmosphere" />
      <div className="seismic-grid-pattern" />
      <div className="seismic-topography" />

      {/* Main Glass Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kpiData={data.kpisAndCleaning}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* Primary Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Dynamic Section Content based on activeTab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top KPI Cards with Editorial Asymmetric Composition - Exclusive to Overview */}
            <KPICards
              kpis={data.kpisAndCleaning.overall_kpis}
              mllib={data.mllibMetrics}
              magDistribution={data.magnitudeDistribution}
              monthlyTrends={data.monthlyTrends}
              onOpenAudit={() => setIsAuditModalOpen(true)}
              onSelectEvent={() => setActiveTab('geography')}
            />

            {/* Signature Interactive Feature: Seismic Pulse */}
            <SeismicPulse
              monthlyTrends={data.monthlyTrends}
              totalCleanedEvents={data.kpisAndCleaning.overall_kpis.total_events}
            />

            {/* Executive Observatory Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Kamchatka Megathrust Feature */}
              <div className="glass-card p-5 flex flex-col justify-between border-l-4 border-l-rose-500">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono">
                      Peak Seismicity
                    </span>
                    <span className="font-mono text-xs text-rose-300 font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30">
                      Mw 8.80
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2">
                    2025 Kamchatka Megathrust Sequence
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Triggered the prominent July 2025 surge (2,838 quakes) at 35.0 km depth along the Pacific subduction interface.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs mt-3">
                  <span className="text-slate-400">2025-07-29 23:24 UTC</span>
                  <button
                    onClick={() => setActiveTab('strongest')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Deep Focus Mantle Hotspots */}
              <div className="glass-card p-5 flex flex-col justify-between border-l-4 border-l-violet-500">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider font-mono">
                      Mantle Geodynamics
                    </span>
                    <span className="font-mono text-xs text-violet-300 font-bold px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30">
                      669.6 km Max
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2">
                    Tonga & Fiji Subduction Zone
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    1,120 deep-focus earthquakes (&gt;300 km) concentrated south of Fiji and Tonga without producing shallow crustal devastation.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs mt-3">
                  <span className="text-slate-400">5.69% Global Total</span>
                  <button
                    onClick={() => setActiveTab('geography')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>View Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Machine Learning Model Status */}
              <div className="glass-card p-5 flex flex-col justify-between border-l-4 border-l-emerald-500">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      Spark MLlib Pipeline
                    </span>
                    <span className="font-mono text-xs text-emerald-300 font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                      86.07% Test Acc
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-2">
                    Decision Tree Pattern Classifier
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Supervised multiclass pattern classification on 3,827 test records with strictly leak-free spatial features.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs mt-3">
                  <span className="text-slate-400">Depth: 7 · Nodes: 113</span>
                  <button
                    onClick={() => setActiveTab('mllib')}
                    className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>ML Insights</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Navigation Bridge to Specialized Sections */}
            <div className="p-4 sm:p-5 rounded-2xl glass-sub-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h4 className="text-sm font-semibold text-white">Explore Detailed Geophysical Analytics</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dive into frequency surge dynamics, global hypocenter mapping, ranked energy catalogues, and MLlib decision trees.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('activity')}
                  className="px-3.5 py-1.5 rounded-xl glass-pill text-xs font-medium text-cyan-200 hover:text-white transition-all cursor-pointer"
                >
                  Seismic Activity →
                </button>
                <button
                  onClick={() => setActiveTab('geography')}
                  className="px-3.5 py-1.5 rounded-xl glass-pill text-xs font-medium text-emerald-200 hover:text-white transition-all cursor-pointer"
                >
                  Geographic Map →
                </button>
                <button
                  onClick={() => setActiveTab('mllib')}
                  className="px-3.5 py-1.5 rounded-xl glass-pill text-xs font-medium text-violet-200 hover:text-white transition-all cursor-pointer"
                >
                  ML Intelligence →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Seismic Activity Section */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <ActivityCharts
              monthlyTrends={data.monthlyTrends}
              magnitudeDistribution={data.magnitudeDistribution}
              depthDistribution={data.depthDistribution}
              hourlyDistribution={data.hourlyDistribution}
            />
          </div>
        )}

        {activeTab === 'geography' && (
          <SeismicMap
            strongestEvents={data.strongestEvents}
            topRegions={data.topRegions}
          />
        )}

        {activeTab === 'strongest' && (
          <StrongestEventsTable
            events={data.strongestEvents}
            onSelectEventOnMap={() => {
              setActiveTab('geography');
            }}
          />
        )}

        {activeTab === 'mllib' && (
          <MLInsights mllib={data.mllibMetrics} />
        )}
      </main>

      {/* Methodology & Data Audit Modal */}
      <MethodologyModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        data={data.kpisAndCleaning}
      />

      {/* Fluid Glass Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 mt-12 glass-nav text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">QuakeScope</span>
            <span className="text-slate-500">·</span>
            <span>Distributed Seismic Analysis & Earthquake Pattern Classification</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-slate-300">
            <span className="px-2.5 py-0.5 rounded glass-sub-card">Apache Spark 3.5.6</span>
            <span className="px-2.5 py-0.5 rounded glass-sub-card">Scala 2.12.18</span>
            <span className="px-2.5 py-0.5 rounded glass-sub-card">Spark MLlib</span>
            <span className="px-2.5 py-0.5 rounded glass-sub-card">React 19 & Vite</span>
          </div>

          <div className="text-slate-500 text-[11px] text-center md:text-right">
            USGS Snapshot: 2025-01-01 to 2026-01-01 · 19,688 Cleaned Records
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
