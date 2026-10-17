import React from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
} from 'lucide-react';
import type { KPIsAndCleaningData } from '../types/seismic';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: KPIsAndCleaningData;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen) return null;

  const { cleaning_reconciliation, environment } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel-elevated p-6 space-y-5 border border-white/15 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Data Quality, Cleaning Reconciliation & Methodology
              </h3>
              <p className="text-xs text-slate-400">
                Audited Apache Spark Stage 1.1 Data Engineering Specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Cleaning Reconciliation Balance Card */}
        <div className="p-4 rounded-xl glass-sub-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white tracking-wide uppercase flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Deterministic Reconciliation Balance</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              100% Balanced (Zero Leakage)
            </span>
          </div>

          <div className="p-3 rounded-lg glass-sub-card font-mono text-xs text-slate-200 overflow-x-auto">
            19,705 Raw Rows = 0 Duplicates + 1 Invalid Depth + 16 Non-Earthquakes + 19,688 Retained Cleaned
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg glass-sub-card">
              <span className="text-[10px] text-slate-400 block">Original Ingested</span>
              <span className="font-mono font-bold text-white text-sm">
                {cleaning_reconciliation.original_rows.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg glass-sub-card">
              <span className="text-[10px] text-slate-400 block">Invalid Depth (&lt;0km)</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {cleaning_reconciliation.invalid_depth_subsurface}
              </span>
            </div>
            <div className="p-2 rounded-lg glass-sub-card">
              <span className="text-[10px] text-slate-400 block">Non-Earthquakes</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {cleaning_reconciliation.excluded_non_earthquake}
              </span>
            </div>
            <div className="p-2 rounded-lg glass-sub-card">
              <span className="text-[10px] text-slate-400 block">Cleaned Retained</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {cleaning_reconciliation.cleaned_retained_rows.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Missing Optional Telemetry Handling */}
        <div className="p-4 rounded-xl glass-sub-card space-y-2 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-cyan-400" />
            <span>Preservation of Optional Quality Telemetry (268 Records)</span>
          </h4>
          <p>
            USGS earthquake feeds often lack optional station metadata (<code className="text-cyan-300 font-mono">gap</code>, <code className="text-cyan-300 font-mono">nst</code>, <code className="text-cyan-300 font-mono">dmin</code>, <code className="text-cyan-300 font-mono">rms</code>, or measurement errors) in oceanic subduction zones and remote plate boundaries.
          </p>
          <p>
            Rather than discarding these 268 records—which would introduce severe spatial sampling bias by omitting remote oceanic earthquakes—the QuakeScope pipeline safely retains them while tracking their quality status.
          </p>
        </div>

        {/* 3. Dataset Coverage & Endpoint Limitations */}
        <div className="p-4 rounded-xl glass-sub-card space-y-2 text-xs text-slate-300 leading-relaxed">
          <h4 className="font-semibold text-white flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Temporal Coverage & January 2026 Endpoint Limitation</span>
          </h4>
          <p>
            The dataset spans from <strong className="text-white">January 1, 2025</strong> through <strong className="text-white">January 1, 2026</strong>.
          </p>
          <p>
            <strong className="text-amber-300">Important Note:</strong> The entry for &quot;2026-01&quot; contains exactly 51 events recorded on January 1, 2026. It represents a single-day boundary snapshot rather than a complete calendar month.
          </p>
        </div>

        {/* 4. Apache Spark Distributed Environment */}
        <div className="p-4 rounded-xl glass-sub-card space-y-2 text-xs">
          <h4 className="font-semibold text-white flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Distributed Execution Environment</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 font-mono text-[11px] pt-1">
            <div className="p-2 rounded glass-sub-card">
              <span className="text-[10px] text-slate-500 block">Spark Engine</span>
              <span>v{environment.spark_version}</span>
            </div>
            <div className="p-2 rounded glass-sub-card">
              <span className="text-[10px] text-slate-500 block">Scala Runtime</span>
              <span>{environment.scala_version}</span>
            </div>
            <div className="p-2 rounded glass-sub-card">
              <span className="text-[10px] text-slate-500 block">Java Virtual Machine</span>
              <span>OpenJDK {environment.java_version}</span>
            </div>
            <div className="p-2 rounded glass-sub-card">
              <span className="text-[10px] text-slate-500 block">Execution Host</span>
              <span>Linux WSL2 x86_64</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono">Generated: {data.generated_at}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-medium transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
