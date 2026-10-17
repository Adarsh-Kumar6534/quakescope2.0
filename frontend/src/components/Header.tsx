import React from 'react';
import { Activity, ShieldCheck, Menu, X } from 'lucide-react';
import type { KPIsAndCleaningData } from '../types/seismic';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  kpiData?: KPIsAndCleaningData;
  onOpenAudit: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAudit,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Seismic Activity' },
    { id: 'geography', label: 'Geographic Intelligence' },
    { id: 'strongest', label: 'Strongest Events' },
    { id: 'mllib', label: 'ML Insights' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 sm:px-6 lg:px-8 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Wordmark */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/25 via-slate-800/80 to-violet-600/25 border border-cyan-400/40 shadow-[0_0_18px_rgba(56,189,248,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Activity className="w-5 h-5 text-cyan-300 animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-sm pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                QuakeScope
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Distributed Seismic Intelligence · Apache Spark & Scala
            </p>
          </div>
        </div>

        {/* Desktop Navigation Glass Pills */}
        <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/40 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none ${
                  isActive
                    ? 'glass-pill-active text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Audit Trigger */}
        <div className="hidden lg:flex items-center space-x-3">
          {/* Audit & Methodology Modal Trigger */}
          <button
            onClick={onOpenAudit}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg btn-glass-primary text-xs font-medium text-cyan-300 hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none"
            title="Inspect Data Cleaning Reconciliation & Methodology"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit & Specs</span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={onOpenAudit}
            className="p-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-cyan-400 cursor-pointer"
            title="Audit"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-slate-300 cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 p-3 rounded-xl bg-slate-900/95 border border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                activeTab === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
            <span>Static Snapshot (19,688 Events)</span>
            <span className="font-mono text-cyan-400">Spark 3.5.6</span>
          </div>
        </div>
      )}
    </header>
  );
};
